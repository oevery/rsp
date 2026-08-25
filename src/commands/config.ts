import type { ConfigResult } from '../types.js'
import { CONFIG_PATH, inspectRspConfig, resolveKinds, resolveLanguagePolicy, resolveManagePolicy } from '../core/config.js'
import { resolveDecisionRecordsPath } from '../core/decisions.js'
import { toErrorMessage } from '../core/output.js'

export async function showConfig(): Promise<ConfigResult> {
  try {
    const inspection = await inspectRspConfig()
    if (inspection.issues.length > 0) {
      return {
        command: 'config',
        ok: false,
        path: CONFIG_PATH,
        summary: null,
        diagnostics: [{
          severity: 'error',
          code: 'invalid_config',
          path: CONFIG_PATH,
          message: inspection.issues.join('; '),
        }],
        runtime: [],
      }
    }

    return {
      command: 'config',
      ok: true,
      path: CONFIG_PATH,
      summary: {
        kinds: resolveKinds(inspection.config),
        decisions: { path: resolveDecisionRecordsPath(inspection.config) },
        manage: resolveManagePolicy(inspection.config, { configValid: true }),
        language: resolveLanguagePolicy(inspection.config, { configValid: true }),
      },
      diagnostics: [],
      runtime: [],
    }
  }
  catch (error) {
    return {
      command: 'config',
      ok: false,
      path: CONFIG_PATH,
      summary: null,
      diagnostics: [{
        severity: 'error',
        code: 'invalid_config',
        path: CONFIG_PATH,
        message: toErrorMessage(error),
      }],
      runtime: [],
    }
  }
}
