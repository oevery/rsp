import type { ArchiveReadinessOutput, VerifyCriticalitySummary } from '../types.js'
import { classifyVerifyCheckboxes, collectVerifyCheckboxLines, getOpenCheckboxes, hasMeaningfulBlockers, parseScenarios } from './content.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionBody, parseRspDocument } from './document-model.js'

export interface ArchiveReadiness {
  taskTodos: string[]
  verifyTodos: string[]
  requiredVerifyTodos: string[]
  optionalVerifyTodos: string[]
  verifyCriticality: VerifyCriticalitySummary
  activeBlockers: boolean
  scenarioCount: number
  missingScenarios: boolean
  deterministic: 'pass' | 'warnings'
  semantic: 'needs-review'
  archiveReady: 'yes' | 'judgment' | 'no'
  warnings: string[]
}

export interface DurableReviewGuidance {
  required: true
  factDecisions: string[]
  rationaleDecisions: string[]
  factCandidateTargets: string[]
  decisionRecordsPath: string
  note: string
}

export function collectArchiveReadiness(content: string, options: { activeBlockers?: boolean } = {}): ArchiveReadiness {
  const warnings: string[] = []
  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  const tasksSection = getDocumentSectionBody(document, 'tasks')
  const verifySection = getDocumentSectionBody(document, 'verify')
  const taskTodos = getOpenCheckboxes(tasksSection)
  if (taskTodos.length > 0)
    warnings.push(`${taskTodos.length} task item(s) still incomplete`)

  const verifyCriticality = classifyVerifyCheckboxes(verifySection)
  const verifyLines = collectVerifyCheckboxLines(verifySection)
  const requiredVerifyTodos = getOpenCheckboxes([...verifyLines.required, ...verifyLines.unclassified].join('\n'))
  const optionalVerifyTodos = getOpenCheckboxes(verifyLines.optional.join('\n'))
  const verifyTodos = [...requiredVerifyTodos, ...optionalVerifyTodos]
  if (requiredVerifyTodos.length > 0)
    warnings.push(`${requiredVerifyTodos.length} required Verify item(s) are still incomplete`)
  if (optionalVerifyTodos.length > 0)
    warnings.push(`${optionalVerifyTodos.length} optional Verify item(s) are still incomplete`)

  const activeBlockers = options.activeBlockers ?? hasMeaningfulBlockers(content)
  if (activeBlockers)
    warnings.push('active blockers are present in the change file')
  const scenarios = parseScenarios(content)
  const missingScenarios = scenarios.length === 0
  if (missingScenarios)
    warnings.push('no Scenario blocks found (some changes do not need them)')

  const archiveReady = activeBlockers || taskTodos.length > 0 || requiredVerifyTodos.length > 0 ? 'no' : 'yes'
  return {
    taskTodos,
    verifyTodos,
    requiredVerifyTodos,
    optionalVerifyTodos,
    verifyCriticality,
    activeBlockers,
    scenarioCount: scenarios.length,
    missingScenarios,
    deterministic: warnings.length === 0 ? 'pass' : 'warnings',
    semantic: 'needs-review',
    archiveReady,
    warnings,
  }
}

export function toArchiveReadinessOutput(readiness: ArchiveReadiness): ArchiveReadinessOutput {
  return {
    incompleteTasks: readiness.taskTodos.length,
    incompleteVerify: readiness.verifyTodos.length,
    incompleteRequiredVerify: readiness.requiredVerifyTodos.length,
    incompleteOptionalVerify: readiness.optionalVerifyTodos.length,
    requiredVerify: readiness.verifyCriticality.required,
    optionalVerify: readiness.verifyCriticality.optional,
    legacyVerify: readiness.verifyCriticality.legacy,
    completionGate: readiness.archiveReady === 'no' ? 'blocked' : 'pass',
    coverageWarnings: readiness.optionalVerifyTodos.length,
    activeBlockers: readiness.activeBlockers,
    missingScenarios: readiness.missingScenarios,
    deterministic: readiness.deterministic,
    semantic: readiness.semantic,
    archiveReady: readiness.archiveReady,
  }
}

export function buildDurableReviewGuidance(factCandidateTargets: string[], decisionRecordsPath: string): DurableReviewGuidance {
  return {
    required: true,
    factDecisions: ['No current-fact update needed', 'Update existing spec or scoped instruction', 'Create a new durable spec'],
    rationaleDecisions: ['No Decision Record needed', 'Create or update a Decision Record'],
    factCandidateTargets,
    decisionRecordsPath,
    note: 'Semantic review decides current-fact and lasting-rationale updates independently. The CLI never infers scoped instruction or Decision Record filenames and never promotes Change content automatically.',
  }
}

export function getDurableReviewCandidateTargets(): string[] {
  return ['.rsp/specs/design.md']
}

export function collectArchiveChecklist(content: string, options: { activeBlockers?: boolean } = {}): string[] {
  return collectArchiveReadiness(content, options).warnings
}
