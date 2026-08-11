import type { DatabaseSync } from 'node:sqlite'

import type { RuntimeProjectIdentity, RuntimeSchemaIdentity } from './model.js'
import {
  RUNTIME_STORE_SCHEMA_MAJOR,
  RUNTIME_STORE_SCHEMA_VERSION,
  RuntimeStoreError,
} from './model.js'

const RUNTIME_APPLICATION_ID = 0x52535034

export interface RuntimeMigrationContext {
  project: RuntimeProjectIdentity
  now: string
}

export interface RuntimeMigration {
  version: number
  name: string
  apply: (database: DatabaseSync, context: RuntimeMigrationContext) => void
}

export interface RuntimeMigrationResult {
  schema: RuntimeSchemaIdentity
  migratedFrom: number
  applied: number[]
}

export const RUNTIME_MIGRATIONS: readonly RuntimeMigration[] = Object.freeze([
  {
    version: 1,
    name: 'observation-ledger',
    apply(database, context) {
      database.exec(`
        CREATE TABLE runtime_metadata (
          singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
          application TEXT NOT NULL CHECK (application = 'rsp-runtime'),
          schema_major INTEGER NOT NULL CHECK (schema_major >= 1),
          schema_version INTEGER NOT NULL CHECK (schema_version >= 1),
          project_id TEXT NOT NULL,
          checkout_root TEXT NOT NULL,
          filesystem_device TEXT NOT NULL,
          filesystem_inode TEXT NOT NULL,
          created_at TEXT NOT NULL,
          migrated_at TEXT NOT NULL
        ) STRICT;

        CREATE TABLE runtime_migrations (
          version INTEGER PRIMARY KEY CHECK (version >= 1),
          name TEXT NOT NULL UNIQUE,
          applied_at TEXT NOT NULL
        ) STRICT;

        CREATE TABLE runtime_runs (
          run_id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          run_key TEXT NOT NULL,
          work_ref TEXT NOT NULL,
          next_sequence INTEGER NOT NULL DEFAULT 1 CHECK (next_sequence >= 1),
          created_at TEXT NOT NULL,
          last_observed_at TEXT NOT NULL,
          UNIQUE (project_id, run_key)
        ) STRICT;

        CREATE TABLE runtime_dispatches (
          dispatch_id TEXT PRIMARY KEY,
          run_id TEXT NOT NULL REFERENCES runtime_runs(run_id) ON DELETE CASCADE,
          lane TEXT NOT NULL,
          worker_id TEXT NOT NULL,
          parent_event_id TEXT,
          fingerprint TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          redaction_count INTEGER NOT NULL CHECK (redaction_count >= 0),
          created_at TEXT NOT NULL
        ) STRICT;
        CREATE INDEX runtime_dispatches_run_created
          ON runtime_dispatches(run_id, created_at, dispatch_id);

        CREATE TABLE runtime_events (
          event_id TEXT PRIMARY KEY,
          run_id TEXT NOT NULL REFERENCES runtime_runs(run_id) ON DELETE CASCADE,
          dispatch_id TEXT REFERENCES runtime_dispatches(dispatch_id) ON DELETE SET NULL,
          sequence INTEGER NOT NULL CHECK (sequence >= 1),
          kind TEXT NOT NULL,
          actor_type TEXT NOT NULL CHECK (actor_type IN ('manager', 'worker', 'system')),
          actor_id TEXT NOT NULL,
          parent_event_id TEXT,
          fingerprint TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          redaction_count INTEGER NOT NULL CHECK (redaction_count >= 0),
          observed_at TEXT NOT NULL,
          committed_at TEXT NOT NULL,
          UNIQUE (run_id, sequence)
        ) STRICT;
        CREATE INDEX runtime_events_run_sequence
          ON runtime_events(run_id, sequence);
        CREATE INDEX runtime_events_parent
          ON runtime_events(run_id, parent_event_id);

        CREATE TABLE runtime_receipts (
          receipt_id TEXT PRIMARY KEY,
          run_id TEXT NOT NULL REFERENCES runtime_runs(run_id) ON DELETE CASCADE,
          dispatch_id TEXT NOT NULL UNIQUE REFERENCES runtime_dispatches(dispatch_id) ON DELETE CASCADE,
          event_id TEXT NOT NULL UNIQUE REFERENCES runtime_events(event_id) ON DELETE CASCADE,
          result TEXT NOT NULL,
          fingerprint TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          redaction_count INTEGER NOT NULL CHECK (redaction_count >= 0),
          observed_at TEXT NOT NULL,
          committed_at TEXT NOT NULL
        ) STRICT;
        CREATE INDEX runtime_receipts_run_committed
          ON runtime_receipts(run_id, committed_at, receipt_id);

        CREATE TABLE runtime_idempotency (
          run_id TEXT NOT NULL REFERENCES runtime_runs(run_id) ON DELETE CASCADE,
          scope TEXT NOT NULL CHECK (scope IN ('dispatch', 'event', 'receipt')),
          idempotency_key TEXT NOT NULL,
          effect_id TEXT NOT NULL,
          fingerprint TEXT NOT NULL,
          delivery_count INTEGER NOT NULL DEFAULT 1 CHECK (delivery_count >= 1),
          duplicate_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
          conflict_count INTEGER NOT NULL DEFAULT 0 CHECK (conflict_count >= 0),
          first_delivered_at TEXT NOT NULL,
          last_delivered_at TEXT NOT NULL,
          PRIMARY KEY (run_id, scope, idempotency_key)
        ) STRICT;

        CREATE TABLE runtime_checkpoints (
          run_id TEXT NOT NULL REFERENCES runtime_runs(run_id) ON DELETE CASCADE,
          projector TEXT NOT NULL,
          projector_version TEXT NOT NULL,
          version INTEGER NOT NULL CHECK (version >= 1),
          source_sequence INTEGER NOT NULL CHECK (source_sequence >= 0),
          payload_json TEXT NOT NULL,
          redaction_count INTEGER NOT NULL CHECK (redaction_count >= 0),
          updated_at TEXT NOT NULL,
          PRIMARY KEY (run_id, projector)
        ) STRICT;

        CREATE TRIGGER runtime_dispatches_immutable
          BEFORE UPDATE ON runtime_dispatches
          BEGIN
            SELECT RAISE(ABORT, 'runtime dispatches are append-only');
          END;

        CREATE TRIGGER runtime_events_immutable
          BEFORE UPDATE ON runtime_events
          BEGIN
            SELECT RAISE(ABORT, 'runtime events are append-only');
          END;

        CREATE TRIGGER runtime_receipts_immutable
          BEFORE UPDATE ON runtime_receipts
          BEGIN
            SELECT RAISE(ABORT, 'runtime receipts are append-only');
          END;
      `)
      database.prepare(`
        INSERT INTO runtime_metadata (
          singleton,
          application,
          schema_major,
          schema_version,
          project_id,
          checkout_root,
          filesystem_device,
          filesystem_inode,
          created_at,
          migrated_at
        ) VALUES (1, 'rsp-runtime', ?, 1, ?, ?, ?, ?, ?, ?)
      `).run(
        RUNTIME_STORE_SCHEMA_MAJOR,
        context.project.projectId,
        context.project.root,
        context.project.filesystem.device,
        context.project.filesystem.inode,
        context.now,
        context.now,
      )
    },
  },
  {
    version: 2,
    name: 'freshness-context-retention',
    apply(database) {
      database.exec(`
        CREATE TABLE runtime_context_packets (
          run_id TEXT NOT NULL REFERENCES runtime_runs(run_id) ON DELETE CASCADE,
          packet_key TEXT NOT NULL,
          version INTEGER NOT NULL CHECK (version >= 1),
          source_sequence INTEGER NOT NULL CHECK (source_sequence >= 0),
          schema_version INTEGER NOT NULL CHECK (schema_version >= 1),
          freshness_json TEXT NOT NULL,
          data_json TEXT NOT NULL,
          redaction_count INTEGER NOT NULL CHECK (redaction_count >= 0),
          expires_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (run_id, packet_key)
        ) STRICT;
        CREATE INDEX runtime_context_expiry
          ON runtime_context_packets(expires_at, updated_at);

        CREATE TABLE runtime_retention_runs (
          retention_id INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL,
          run_cutoff TEXT NOT NULL,
          context_cutoff TEXT NOT NULL,
          max_runs INTEGER NOT NULL CHECK (max_runs >= 1),
          max_context_packets_per_run INTEGER NOT NULL CHECK (max_context_packets_per_run >= 1),
          deleted_runs INTEGER NOT NULL CHECK (deleted_runs >= 0),
          deleted_context_packets INTEGER NOT NULL CHECK (deleted_context_packets >= 0)
        ) STRICT;
      `)
    },
  },
  {
    version: 3,
    name: 'unified-observation-sequence',
    apply(database) {
      database.exec(`
        DROP TRIGGER runtime_dispatches_immutable;
        ALTER TABLE runtime_dispatches
          ADD COLUMN sequence INTEGER;
      `)
      const runs = database.prepare(`
        SELECT run_id, next_sequence
        FROM runtime_runs
        ORDER BY run_id
      `).all() as Array<{ run_id: string, next_sequence: number }>
      const dispatches = database.prepare(`
        SELECT dispatch_id
        FROM runtime_dispatches
        WHERE run_id = ?
        ORDER BY created_at, dispatch_id
      `)
      const assignSequence = database.prepare(`
        UPDATE runtime_dispatches
        SET sequence = ?
        WHERE dispatch_id = ?
      `)
      const advanceRun = database.prepare(`
        UPDATE runtime_runs
        SET next_sequence = ?
        WHERE run_id = ?
      `)
      for (const run of runs) {
        let nextSequence = run.next_sequence
        const rows = dispatches.all(run.run_id) as Array<{ dispatch_id: string }>
        for (const row of rows) {
          assignSequence.run(nextSequence, row.dispatch_id)
          nextSequence += 1
        }
        if (nextSequence !== run.next_sequence)
          advanceRun.run(nextSequence, run.run_id)
      }
      database.exec(`
        CREATE UNIQUE INDEX runtime_dispatches_run_sequence
          ON runtime_dispatches(run_id, sequence);
        CREATE TRIGGER runtime_dispatches_sequence_required
          BEFORE INSERT ON runtime_dispatches
          WHEN NEW.sequence IS NULL
          BEGIN
            SELECT RAISE(ABORT, 'runtime dispatch sequence is required');
          END;
        CREATE TRIGGER runtime_dispatches_immutable
          BEFORE UPDATE ON runtime_dispatches
          BEGIN
            SELECT RAISE(ABORT, 'runtime dispatches are append-only');
          END;
      `)
    },
  },
  {
    version: 4,
    name: 'dispatch-presentation-metadata',
    apply(database) {
      database.exec(`
        DROP TRIGGER runtime_dispatches_immutable;
        ALTER TABLE runtime_dispatches
          ADD COLUMN worker_display_name TEXT;
        ALTER TABLE runtime_dispatches
          ADD COLUMN worker_role TEXT;
        CREATE TRIGGER runtime_dispatches_immutable
          BEFORE UPDATE ON runtime_dispatches
          BEGIN
            SELECT RAISE(ABORT, 'runtime dispatches are append-only');
          END;
      `)
    },
  },
])

export function migrateRuntimeDatabase(
  database: DatabaseSync,
  project: RuntimeProjectIdentity,
  options: {
    now?: string
    targetVersion?: number
  } = {},
): RuntimeMigrationResult {
  const now = options.now ?? new Date().toISOString()
  const targetVersion = options.targetVersion ?? RUNTIME_STORE_SCHEMA_VERSION
  if (!Number.isSafeInteger(targetVersion)
    || targetVersion < 1
    || targetVersion > RUNTIME_STORE_SCHEMA_VERSION) {
    throw new RuntimeStoreError(
      'runtime_schema_target_invalid',
      `Runtime schema target must be between 1 and ${RUNTIME_STORE_SCHEMA_VERSION}`,
    )
  }

  database.exec('BEGIN EXCLUSIVE')
  try {
    const tables = database.prepare(`
      SELECT name
      FROM sqlite_schema
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all() as Array<{ name: string }>
    const hasMetadata = tables.some(table => table.name === 'runtime_metadata')
    if (!hasMetadata && tables.length > 0) {
      throw new RuntimeStoreError(
        'runtime_database_invalid',
        'Runtime database contains tables but no RSP runtime metadata',
        'Dispose the project runtime database only after preserving any needed diagnostics',
      )
    }

    let currentVersion = 0
    if (hasMetadata) {
      const metadata = readRuntimeMetadata(database)
      validateRuntimeMetadata(metadata, project)
      currentVersion = metadata.schema_version
      validateSupportedSchemaVersion(currentVersion)
      validateMigrationHistory(database, currentVersion)
    }

    const migratedFrom = currentVersion
    const applied: number[] = []
    for (const migration of RUNTIME_MIGRATIONS) {
      if (migration.version <= currentVersion || migration.version > targetVersion)
        continue
      if (migration.version !== currentVersion + 1) {
        throw new RuntimeStoreError(
          'runtime_migration_gap',
          `Runtime migration registry has no step from version ${currentVersion} to ${migration.version}`,
        )
      }
      migration.apply(database, { project, now })
      database.prepare(`
        INSERT INTO runtime_migrations (version, name, applied_at)
        VALUES (?, ?, ?)
      `).run(migration.version, migration.name, now)
      database.prepare(`
        UPDATE runtime_metadata
        SET schema_version = ?, migrated_at = ?
        WHERE singleton = 1
      `).run(migration.version, now)
      currentVersion = migration.version
      applied.push(migration.version)
    }
    if (currentVersion !== targetVersion) {
      throw new RuntimeStoreError(
        'runtime_migration_incomplete',
        `Runtime database stopped at schema version ${currentVersion}; expected ${targetVersion}`,
      )
    }
    database.exec(`PRAGMA application_id = ${RUNTIME_APPLICATION_ID}`)
    database.exec(`PRAGMA user_version = ${RUNTIME_STORE_SCHEMA_MAJOR * 1_000 + currentVersion}`)
    database.exec('COMMIT')
    return {
      schema: {
        major: RUNTIME_STORE_SCHEMA_MAJOR,
        version: currentVersion,
      },
      migratedFrom,
      applied,
    }
  }
  catch (error) {
    rollback(database)
    throw error
  }
}

export function inspectRuntimeSchema(
  database: DatabaseSync,
  project: RuntimeProjectIdentity,
): RuntimeSchemaIdentity {
  const metadata = readRuntimeMetadata(database)
  validateRuntimeMetadata(metadata, project)
  validateSupportedSchemaVersion(metadata.schema_version)
  validateMigrationHistory(database, metadata.schema_version)
  return {
    major: metadata.schema_major,
    version: metadata.schema_version,
  }
}

interface RuntimeMetadataRow {
  application: string
  schema_major: number
  schema_version: number
  project_id: string
  checkout_root: string
  filesystem_device: string
  filesystem_inode: string
}

function readRuntimeMetadata(database: DatabaseSync): RuntimeMetadataRow {
  let row: RuntimeMetadataRow | undefined
  try {
    row = database.prepare(`
      SELECT
        application,
        schema_major,
        schema_version,
        project_id,
        checkout_root,
        filesystem_device,
        filesystem_inode
      FROM runtime_metadata
      WHERE singleton = 1
    `).get() as RuntimeMetadataRow | undefined
  }
  catch (error) {
    throw new RuntimeStoreError(
      'runtime_database_corrupt',
      `Runtime database metadata cannot be read: ${errorMessage(error)}`,
      'Preserve the database for diagnostics, then dispose only this checkout runtime namespace',
    )
  }
  if (!row || row.application !== 'rsp-runtime') {
    throw new RuntimeStoreError(
      'runtime_database_invalid',
      'Runtime database metadata is missing or belongs to another application',
      'Preserve the database for diagnostics, then dispose only this checkout runtime namespace',
    )
  }
  return row
}

function validateRuntimeMetadata(
  metadata: RuntimeMetadataRow,
  project: RuntimeProjectIdentity,
): void {
  if (metadata.schema_major !== RUNTIME_STORE_SCHEMA_MAJOR) {
    throw new RuntimeStoreError(
      'runtime_schema_incompatible',
      `Runtime database schema major ${metadata.schema_major} is incompatible with supported major ${RUNTIME_STORE_SCHEMA_MAJOR}`,
      'Stop the incompatible Broker and use an RSP package that owns this runtime schema major',
    )
  }
  if (metadata.project_id !== project.projectId
    || metadata.checkout_root !== project.root
    || metadata.filesystem_device !== project.filesystem.device
    || metadata.filesystem_inode !== project.filesystem.inode) {
    throw new RuntimeStoreError(
      'runtime_project_identity_mismatch',
      'Runtime database checkout identity does not match the registered Broker project session',
      'Do not reuse or move runtime databases across repositories or worktrees',
    )
  }
  if (!Number.isSafeInteger(metadata.schema_version) || metadata.schema_version < 1) {
    throw new RuntimeStoreError(
      'runtime_database_corrupt',
      'Runtime database schema version is invalid',
      'Preserve the database for diagnostics, then dispose only this checkout runtime namespace',
    )
  }
}

function validateSupportedSchemaVersion(currentVersion: number): void {
  if (currentVersion <= RUNTIME_STORE_SCHEMA_VERSION)
    return
  throw new RuntimeStoreError(
    'runtime_schema_newer',
    `Runtime database schema 1.${currentVersion} is newer than supported schema 1.${RUNTIME_STORE_SCHEMA_VERSION}`,
    'Stop the older package and use an RSP package compatible with this runtime database',
  )
}

function validateMigrationHistory(database: DatabaseSync, currentVersion: number): void {
  let rows: Array<{ version: number, name: string }>
  try {
    rows = database.prepare(`
      SELECT version, name
      FROM runtime_migrations
      ORDER BY version
    `).all() as Array<{ version: number, name: string }>
  }
  catch (error) {
    throw new RuntimeStoreError(
      'runtime_database_corrupt',
      `Runtime migration history cannot be read: ${errorMessage(error)}`,
      'Preserve the database for diagnostics, then dispose only this checkout runtime namespace',
    )
  }
  if (rows.length !== currentVersion) {
    throw new RuntimeStoreError(
      'runtime_migration_history_invalid',
      `Runtime migration history has ${rows.length} records for schema version ${currentVersion}`,
    )
  }
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!
    const migration = RUNTIME_MIGRATIONS[index]
    if (!migration || row.version !== migration.version || row.name !== migration.name) {
      throw new RuntimeStoreError(
        'runtime_migration_history_invalid',
        `Runtime migration history diverges at version ${row.version}`,
      )
    }
  }
}

function rollback(database: DatabaseSync): void {
  try {
    database.exec('ROLLBACK')
  }
  catch {
    // Preserve the original migration error.
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
