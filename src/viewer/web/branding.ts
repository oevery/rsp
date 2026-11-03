declare const __RSP_ICON__: string

// The existing authored icon is embedded by the viewer build, not fetched remotely.
export const rspIcon = `data:image/svg+xml,${encodeURIComponent(__RSP_ICON__)}`
