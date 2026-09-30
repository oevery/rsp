# Historical artifact recovery

Historical reports and verdicts remain unchanged. Their old cache paths and relative links describe past runs, not current runnable interfaces. Some evidence is retained privately, some files require Git history, and disposable runtime material has been permanently discarded. **Complete old workspaces and the original full backup bundles are no longer available.**

## What remains

The local, ignored directory `tests/skills/reports/legacy/2026-09-30-research-artifact-hygiene/` contains four files. Directories are 0700 and files 0600. A fresh clone does not include these private artifacts; do not upload them without checking for credentials and private evidence.

| File | Purpose |
| --- | --- |
| `selected-evidence.tar.gz` | Deduplicated retained bytes, addressed as `blobs/<sha256>`; **members are not original paths**. |
| `dispositions.json.gz` | Exact original path, kind, mode, file size/hash or link target, disposition, and blob/Git recovery mapping for all 529,561 original entries. |
| `repository-provenance.json.gz` | Original nested-repository HEADs and dirty-path observations; not complete Git histories or diffs. |
| `retention-receipt.json` | Final payload hashes, classification totals, verification, precise removal references and space measurements. |

The selected pack retains genuine provider-run evidence, associated failed/incomplete results, unique experimental sources, Changes and candidate Skills. Small unclassified material is conservatively retained without calling it model acceptance. Ten native SQLite files remain, including matching DB/WAL/SHM collections; file restoration was checked, database replay was not.

## Choose the recovery source

Look up the original repository-relative `path` in the disposition manifest before attempting restoration.

| Disposition or field | Recovery |
| --- | --- |
| `blob` | Read that member from the selected tar, verify SHA-256 and length, then write to the original path beneath a fresh private directory. |
| `git-fixed-revision-research` | Restore the original path at `d14b6dcd35c64025cd229cf6012ce57ee5011579`. All 1,102 pre-cleanup research files matched that exact revision. |
| `git-reachable-identical-blob` | Read `git cat-file blob <gitBlob>` and verify the recorded SHA-256/length. All 1,436 distinct recovery blobs across both Git categories are reachable from the fixed commit and its ancestry, not dangling objects. |
| Layout/link metadata | Original modes and link targets remain in the manifest. Links are not followed or automatically recreated by the example below. |
| `discard-*` | Original payload is absent. Installed dependencies may be rebuilt, but exact historic runtime bytes are not promised. |

Keep the fixed Git history available: a shallow clone or rewritten/pruned history may lack recovery blobs. Nested `.git` histories, installed `node_modules`, 328 confirmed `local-test` run outputs and the 42,560,828-byte repeatable Vitest log were discarded. Final retained snapshots do not recover deleted-file preimages or full dirty-repository diffs. Unproven build/package samples were retained; no separate `dist` tree qualified for removal.

The original 176 full bundles, their inventories and redundant scripts/restoration samples were removed only after independent classification and complete mapping/content verification. Their former names and hashes remain provenance in the disposition manifest, not references to files that still exist.

## Restore without modifying the checkout

Run from the repository root with the private four-file set present. This example restores the native state database **and its matching WAL/SHM**, using the manifest to map blob members back to paths. Replace `wanted` with other exact original regular-file paths when needed. Discarded or absent paths fail explicitly; no archived code or symlink is executed.

```sh
python3 - <<'PY'
import gzip, hashlib, json, os, subprocess, tarfile, tempfile
from pathlib import Path, PurePosixPath

os.umask(0o077)
base = Path('tests/skills/reports/legacy/2026-09-30-research-artifact-hygiene')
receipt = json.loads((base / 'retention-receipt.json').read_text())
for name, identity in receipt['retained'].items():
    with (base / name).open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    assert digest == identity['sha256'], f'Changed archive: {name}'
manifest = json.loads(gzip.decompress((base / 'dispositions.json.gz').read_bytes()))
prefix = 'evals/reports/native-v1-live-B6rHZu/home/state_5.sqlite'
wanted = {prefix, prefix + '-wal', prefix + '-shm'}
rows = {row['path']: row for row in manifest['entries'] if row['path'] in wanted}
assert set(rows) == wanted, 'Original path missing from manifest'
restore = Path(tempfile.mkdtemp(prefix='rsp-evidence-restore-'))
with tarfile.open(base / 'selected-evidence.tar.gz', 'r:gz') as archive:
    for name, row in rows.items():
        path = PurePosixPath(name)
        assert not path.is_absolute() and '..' not in path.parts
        assert row['kind'] == 'file', 'Select regular files only'
        if 'blob' in row:
            member = archive.getmember(row['blob'])
            assert member.isfile()
            data = archive.extractfile(member).read()
        elif 'gitBlob' in row:
            data = subprocess.check_output(['git', 'cat-file', 'blob', row['gitBlob']])
        else:
            raise RuntimeError(f'Original payload discarded: {name}')
        assert len(data) == row['bytes'] and hashlib.sha256(data).hexdigest() == row['sha256']
        target = restore / path
        target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        with target.open('xb') as stream:
            stream.write(data)
        target.chmod(0o600)
print(f'Restored {len(rows)} verified files under {restore}')
PY
```

The example requires Python 3.11+ and preserves private 0600 output permissions; original modes are recorded in the manifest. Apply historical executable modes only deliberately inside a private recovery boundary. For the entire historical tracked research tree, `git archive d14b6dcd35c64025cd229cf6012ce57ee5011579 research` produces a tar stream for extraction into a separate directory; it does not recover ignored model reports.

Replace an old absolute repository root with the restoration root when inspecting a historical reference. Preserved bytes are not a relocatable runtime: old tools, provider state and commands may be unavailable. No automatic replay compatibility or new model verdict is claimed.

## Retention and measured storage

The active consumers still own `.cache/upstreams/`, `.cache/upstream-distillation/` and `.cache/rsp-package-install/`, including backups within those roots. They and current reports outside `legacy/` remain unchanged. Readable research conclusions, upstream distillations and model synthesis remain tracked; obsolete tracked raw files are recoverable through the fixed Git revision.

On 2026-09-30 the complete final four-file set, including its disposition manifest, provenance and receipt, occupies **57,961,822 logical bytes** and **58,052 KiB allocated** (`du -sk`). Before selective retention the full legacy set occupied 383,645,989 logical bytes and 375,452 KiB allocated. The reductions are **325,684,167 logical bytes** and **325,017,600 allocated bytes**, respectively—not filesystem-wide free-space measurements.

All 12,516 retained blobs and 1,436 Git recovery blobs passed complete content checks; all 529,561 disposition rows matched original inventories. Fourteen files were actually restored and compared, including all ten SQLite files. The main session independently checked retained blobs, Git contents/reachability and inventory completeness before authorizing removal. These checks establish preservation within the declared boundary, not Skill behavioral acceptance.
