import type { UiLanguageArgument } from '../route.js'

export type UiLocale = 'en' | 'zh-CN'

function normalizeLocale(value: string | undefined): UiLocale | null {
  if (!value)
    return null
  const normalized = value.replaceAll('_', '-').split('.')[0].toLowerCase()
  if (normalized === 'en')
    return 'en'
  if (normalized === 'zh' || normalized === 'zh-cn' || normalized.startsWith('zh-cn-') || normalized === 'zh-hans' || normalized.startsWith('zh-hans-'))
    return 'zh-CN'
  return null
}

export function resolveUiLocale(explicit: UiLanguageArgument, environmentLocale: string | undefined, hostLocale: string | undefined): UiLocale {
  if (explicit !== 'auto')
    return explicit
  return normalizeLocale(environmentLocale) ?? normalizeLocale(hostLocale) ?? 'en'
}
