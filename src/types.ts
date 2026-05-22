/** Feature lifecycle status */
export type FeatureStatus = 'draft' | 'ready' | 'in-progress' | 'blocked' | 'done'

/** Feature priority level */
export type FeaturePriority = 'low' | 'medium' | 'high' | 'critical'

/** Parsed YAML frontmatter from a feature file */
export interface Frontmatter {
  'status'?: FeatureStatus
  'priority'?: FeaturePriority
  'depends-on'?: string | string[]
  'tags'?: string[]
  'summary'?: string
  [key: string]: unknown
}

/** Semantic checkbox counts in a feature's Plan section */
export interface CheckboxCount {
  todo: number
  progress: number
  done: number
  total: number
}

export interface NewFeatureArgs {
  name: string
  _: string[]
}

export interface CloseFeatureArgs {
  name: string
}

/** User-customizable project configuration from .rsp/config.yaml */
export interface RspConfig {
  /** Custom status values (merged with built-in defaults) */
  statuses?: string[]
  /** Custom priority values (merged with built-in defaults) */
  priorities?: string[]
  /** Sections that must exist in every feature file */
  required_sections?: string[]
}

/** Parsed ADDED/MODIFIED/REMOVED delta markers from a feature's Spec section */
export interface DeltaSections {
  added: boolean
  modified: boolean
  removed: boolean
}

/** A structured Given/When/Then scenario block */
export interface ScenarioBlock {
  heading: string
  steps: string[]
}

/** Summary info for one feature file */
export interface FeatureInfo {
  path: string
  name: string
  /** Days since feature file was created (null if unknown) */
  ageDays: number | null
}
