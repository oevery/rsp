import { emitJson } from '../core/output.js'
import { deriveStatusView } from '../status/derive.js'
import { inspectProjectStatus } from '../status/inspect.js'
import { collectProjectIssueUrls, projectWebOverview } from './projection.js'

async function main(): Promise<void> {
  try {
    const view = deriveStatusView(await inspectProjectStatus())
    const sensitiveUrls = collectProjectIssueUrls(view)
    const overview = projectWebOverview(view, {
      checkoutRoots: [process.cwd()],
      sensitiveUrls,
    })
    emitJson({
      ok: true,
      overview,
      openWorkRefs: [
        ...view.records.map(record => record.output.name),
        ...view.groups.map(group => group.name),
      ],
      sensitiveUrls,
    }, { compact: true })
  }
  catch {
    emitJson({
      ok: false,
      error: {
        code: 'web_overview_unavailable',
        message: 'Unable to derive the current project overview',
      },
    }, { compact: true })
    process.exitCode = 1
  }
}

void main()
