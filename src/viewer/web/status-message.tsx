import { useLocale } from './i18n.js'

export function StatusMessage({ kind, stale = false, message, file }: { kind: 'architecture' | 'document' | 'image', stale?: boolean, message: string, file?: string }) {
  const { t } = useLocale()
  return (
    <div className="error" role="alert">
      <strong>{t(kind === 'architecture' ? 'architectureError' : kind === 'document' ? 'documentError' : 'imageError')}</strong>
      {stale && <p>{t(kind === 'architecture' ? 'staleContent' : kind === 'document' ? 'staleDocument' : 'staleImage')}</p>}
      <p>{t(kind === 'architecture' ? 'reopen' : 'checkSource')}</p>
      <details>
        <summary>{t('technicalDetails')}</summary>
        {file && <code>{file}</code>}
        <pre>{message}</pre>
      </details>
    </div>
  )
}
