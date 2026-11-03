import type { ArchitectureResult } from '../../architecture/model.js'
import type { WorkspaceSummary } from '../workspaces.js'
import { useId, useState } from 'react'
import { rspIcon } from './branding.js'
import { useLocale } from './i18n.js'
import { Button, CloseButton, Input, Select } from './ui/primitives.js'

interface Props {
  workspace: string
  workspaces: WorkspaceSummary[]
  architecture?: ArchitectureResult
  mode: string
  view: string
  root?: string
  revision?: string
  mobile?: boolean
  selectionDisabled?: boolean
  onWorkspace: (workspace: string) => void
  onView: (view: string) => void
  onSelect: (node: string) => void
  onClose: () => void
}

export function WorkspaceSidebar(props: Props) {
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState(0)
  const id = useId()
  const { locale, setLocale, t } = useLocale()
  const currentWorkspace = props.workspaces.find(workspace => workspace.id === props.workspace)
  const identity = (workspace: WorkspaceSummary) => workspace.git
    ? `${workspace.git.branch ?? `${t('detachedHead')} · ${workspace.git.commit}`} · ${t(workspace.git.linked ? 'linkedWorktree' : 'mainWorktree')}`
    : t('directoryWorkspace')
  const results = search.trim() ? props.architecture?.nodes.filter(node => `${node.title} ${node.id} ${node.description}`.toLowerCase().includes(search.trim().toLowerCase())) ?? [] : []
  const choose = (node: string) => {
    if (props.selectionDisabled)
      return
    setSearch('')
    props.onSelect(node)
  }
  return (
    <aside className="sidebar" aria-label={t('architectureNavigation')}>
      <div className="workspace-entry">
        <img className="brand-mark" src={rspIcon} alt="RSP" />
        <div className="workspace-picker">
          <Select
            id={`${id}-workspace`}
            label={t('workspace')}
            value={props.workspace}
            onValueChange={props.onWorkspace}
            options={props.workspaces.map(workspace => ({
              value: workspace.id,
              label: workspace.title,
              description: (
                <>
                  {identity(workspace)}
                  <span className="workspace-option-path" title={workspace.root}>{workspace.root}</span>
                </>
              ),
              group: { id: workspace.git?.repository ?? 'directories', label: workspace.git?.title ?? t('directoryWorkspace') },
            }))}
          />
          {currentWorkspace && <small className="workspace-identity" title={`${identity(currentWorkspace)} · ${currentWorkspace.root}`}>{identity(currentWorkspace)}</small>}
        </div>
        {props.mobile && <CloseButton label={t('closeNavigation')} onClick={props.onClose} />}
      </div>
      <div className="search">
        <Input
          aria-label={t('searchObjects')}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={!!search}
          aria-controls={`${id}-results`}
          aria-describedby={props.selectionDisabled ? `${id}-selection-hint` : undefined}
          aria-activedescendant={search && results[cursor] ? `${id}-result-${cursor}` : undefined}
          placeholder={t('findObject')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setCursor(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && search) {
              event.preventDefault()
              event.stopPropagation()
              setSearch('')
            }
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && results.length) {
              event.preventDefault()
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? results.length - 1 : (cursor + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length
              setCursor(next)
              globalThis.document.getElementById(`${id}-result-${next}`)?.scrollIntoView({ block: 'nearest' })
            }
            if (event.key === 'Enter' && results[cursor]) {
              event.preventDefault()
              choose(results[cursor].id)
            }
          }}
        />
        {props.selectionDisabled && <p id={`${id}-selection-hint`} className="empty-views">{t('closeDocumentToSelect')}</p>}
        {search && (
          <div className="search-results" id={`${id}-results`} role="listbox" aria-label={t('searchResults')}>
            {results.length
              ? results.map((node, index) => (
                  <div
                    id={`${id}-result-${index}`}
                    role="option"
                    aria-selected={cursor === index}
                    aria-disabled={props.selectionDisabled || undefined}
                    key={node.id}
                    onPointerMove={() => setCursor(index)}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => choose(node.id)}
                  >
                    {node.title}
                    <small>{node.description}</small>
                  </div>
                ))
              : <p role="status">{t('noMatches')}</p>}
          </div>
        )}
      </div>
      <div className="sidebar-section-heading">
        <h2>{t('views')}</h2>
        <span>{props.architecture?.views.length ?? 0}</span>
      </div>
      <nav className="view-navigation" aria-label={t('views')}>
        {props.architecture?.views.map(view => (
          <Button variant="ghost" key={view.id} aria-label={view.title} aria-current={props.mode === 'view' && props.view === view.id ? 'page' : undefined} onClick={() => props.onView(view.id)}>
            <span className="view-dot" aria-hidden="true" />
            <span>
              {view.title}
              <small>{props.architecture?.nodes.find(node => node.id === view.node)?.title}</small>
            </span>
          </Button>
        ))}
        <Button variant="ghost" className="all-nodes" aria-current={props.mode === 'full' ? 'page' : undefined} onClick={() => props.onView('')}>{t('allNodes')}</Button>
      </nav>
      {props.architecture && !props.architecture.views.length && <p className="empty-views">{t('noViews')}</p>}
      <footer className="sidebar-footer">
        <div className="language-picker">
          <label htmlFor={`${id}-language`}>{t('language')}</label>
          <Select id={`${id}-language`} label={t('language')} value={locale} onValueChange={value => setLocale(value as 'en' | 'zh-CN')} options={[{ value: 'zh-CN', label: '简体中文', lang: 'zh-CN' }, { value: 'en', label: 'English', lang: 'en' }]} />
        </div>
        <details className="source">
          <summary>{t('source')}</summary>
          <p>{props.root}</p>
          <code>{props.revision}</code>
          {props.architecture?.diagnostics.map((diagnostic, index) => <p className="warning" key={index}>{diagnostic.message}</p>)}
          <p>{t('referenceExplanation')}</p>
        </details>
      </footer>
    </aside>
  )
}
