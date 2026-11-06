import { useRef, useState } from 'react'

export function useNavigationPanel(scenario: boolean, narrow: boolean) {
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [panelPinned, setPanelPinned] = useState<boolean | null>(() => {
    const value = sessionStorage.getItem('rsp-panel-open')
    return value === null ? null : value === 'true'
  })
  const [panelTab, setPanelTab] = useState<'navigation' | 'steps'>('navigation')
  const navigationTrigger = useRef<HTMLButtonElement>(null)
  const navigationPane = useRef<HTMLDivElement>(null)
  const stepsTrigger = useRef<HTMLButtonElement>(null)
  const navigationSelection = useRef(false)
  const desktopPanelOpen = panelPinned ?? !scenario
  const activePanelTab = scenario ? panelTab : 'navigation'
  const panelVisible = narrow ? navigationOpen : desktopPanelOpen
  const openPanel = (tab: 'navigation' | 'steps') => {
    setPanelTab(tab)
    navigationSelection.current = false
    if (narrow) {
      setNavigationOpen(true)
    }
    else {
      setPanelPinned(true)
      sessionStorage.setItem('rsp-panel-open', 'true')
    }
  }
  const closePanel = () => {
    if (narrow) {
      setNavigationOpen(false)
    }
    else {
      setPanelPinned(false)
      sessionStorage.setItem('rsp-panel-open', 'false')
      requestAnimationFrame(() => (activePanelTab === 'steps' ? stepsTrigger : navigationTrigger).current?.focus())
    }
  }
  return {
    navigationOpen,
    setNavigationOpen,
    panelVisible,
    desktopPanelOpen,
    activePanelTab,
    setPanelTab,
    navigationTrigger,
    navigationPane,
    stepsTrigger,
    navigationSelection,
    openPanel,
    closePanel,
    dismiss: () => setNavigationOpen(false),
    selected: () => {
      navigationSelection.current = true
      setNavigationOpen(false)
    },
  }
}
export type NavigationPanelController = ReturnType<typeof useNavigationPanel>
