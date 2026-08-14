import type { SpecsInspection } from '../specs/model.js'
import type { SpecsDetailProjection, SpecsSearchProjection, SpecsTreeProjection } from '../specs/projection.js'
import type { InspectSpecsOptions } from '../specs/query.js'
import { SPECS_DEFAULT_RESULT_LIMIT, SPECS_SEARCH_EXCERPT_CODE_POINTS } from '../specs/model.js'
import { projectSpecsDetail, projectSpecsSearch, projectSpecsTree } from '../specs/projection.js'
import { inspectSpecs } from '../specs/query.js'

export interface TuiSpecsSearchOptions {
  limit?: number
  excerptCodePoints?: number
}

export interface TuiSpecsSource {
  tree: () => Promise<SpecsTreeProjection>
  detail: (path: string) => Promise<SpecsDetailProjection>
  search: (literal: string, options?: TuiSpecsSearchOptions) => Promise<SpecsSearchProjection>
}

export interface TuiSpecsSourceDependencies {
  inspect: (options?: InspectSpecsOptions) => Promise<SpecsInspection>
  projectTree: (inspection: SpecsInspection) => SpecsTreeProjection
  projectDetail: (inspection: SpecsInspection, path: string) => Promise<SpecsDetailProjection>
  projectSearch: (
    inspection: SpecsInspection,
    literal: string,
    options: { limit: number, excerptCodePoints: number },
  ) => Promise<SpecsSearchProjection>
}

const defaultDependencies: TuiSpecsSourceDependencies = {
  inspect: inspectSpecs,
  projectTree: projectSpecsTree,
  projectDetail: projectSpecsDetail,
  projectSearch: projectSpecsSearch,
}

export function createTuiSpecsSource(dependencies: TuiSpecsSourceDependencies = defaultDependencies): TuiSpecsSource {
  let latestInspection: SpecsInspection | null = null

  async function inspectComplete(): Promise<{ inspection: SpecsInspection, tree: SpecsTreeProjection }> {
    const inspection = await dependencies.inspect()
    const tree = dependencies.projectTree(inspection)
    latestInspection = inspection
    return { inspection, tree }
  }

  async function currentInspection(): Promise<SpecsInspection> {
    if (latestInspection)
      return latestInspection
    return (await inspectComplete()).inspection
  }

  return {
    async tree() {
      return (await inspectComplete()).tree
    },
    async detail(path) {
      return dependencies.projectDetail(await currentInspection(), path)
    },
    async search(literal, options = {}) {
      return dependencies.projectSearch(await currentInspection(), literal, {
        limit: options.limit ?? SPECS_DEFAULT_RESULT_LIMIT,
        excerptCodePoints: options.excerptCodePoints ?? SPECS_SEARCH_EXCERPT_CODE_POINTS,
      })
    },
  }
}
