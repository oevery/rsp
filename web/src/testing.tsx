import type { AppState } from './state.js'
import { renderToStaticMarkup } from 'react-dom/server'
import { ObservatoryApp } from './app.js'

export {
  applyAutoRefreshSelection,
  applyLocaleSelection,
  applyManagedEvent,
  applyOperationFailure,
  applyProjectionSuccess,
  applySnapshotFailure,
  applySnapshotSuccess,
  AUTO_REFRESH_INTERVAL_MS,
  createInitialState,
  createProjectionRequestCoordinator,
  createSseParser,
  escapeHtml,
  formatTimestamp,
  shouldAutoRefresh,
  WebRequestError,
} from './state.js'

export function renderAppHtml(state: AppState): string {
  return renderToStaticMarkup(<ObservatoryApp state={state} />)
}
