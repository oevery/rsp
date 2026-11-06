import type { Translate } from '../i18n.js'

let sequence = 0
let queue = Promise.resolve()

/** Render untrusted diagrams as images, without activating SVG links or scripts. */
export function renderDiagrams(article: HTMLElement, t: Translate) {
  for (const figure of article.querySelectorAll<HTMLElement>('figure[data-rsp-mermaid]:not([data-rendered])')) {
    figure.dataset.rendered = 'pending'
    const pre = figure.querySelector('pre')!
    const source = pre.textContent ?? ''
    const disclosure = document.createElement('details')
    const summary = document.createElement('summary')
    summary.dataset.rspReadingStatus = 'diagramSource'
    summary.textContent = t('diagramSource')
    disclosure.append(summary, pre)
    figure.append(disclosure)
    queue = queue.then(async () => {
      if (!figure.isConnected)
        return
      const host = document.createElement('div')
      host.className = 'diagram-render-host'
      host.setAttribute('aria-hidden', 'true')
      document.body.append(host)
      try {
        const modulePath = '/mermaid.js'
        const { default: mermaid } = await import(modulePath) as typeof import('mermaid')
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          suppressErrorRendering: true,
          maxTextSize: 50000,
          secure: ['securityLevel', 'startOnLoad', 'maxTextSize', 'maxEdges', 'suppressErrorRendering'],
        })
        const { svg } = await mermaid.render(`rsp-mermaid-${++sequence}`, source, host)
        if (!figure.isConnected)
          return
        const image = document.createElement('img')
        image.alt = t('documentDiagram')
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
        figure.prepend(image)
        figure.dataset.rendered = 'complete'
      }
      catch {
        if (!figure.isConnected)
          return
        const error = document.createElement('p')
        error.setAttribute('role', 'status')
        error.dataset.rspReadingStatus = 'diagramError'
        error.textContent = t('diagramError')
        figure.prepend(error)
        disclosure.open = true
        figure.dataset.rendered = 'error'
      }
      finally {
        host.remove()
      }
    })
  }
}
