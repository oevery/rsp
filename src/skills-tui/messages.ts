import type { UiLocale } from '../tui/i18n/locale.js'

export interface SkillsTuiMessages {
  title: string
  target: string
  defaultHeading: string
  missing: string
  unchanged: string
  divergent: string
  locked: string
  selectHelp: string
  replaceTitle: string
  replaceHelp: string
  replaceDirectory: string
  removeDirectory: string
}

export const skillsCatalogs: Record<UiLocale, SkillsTuiMessages> = {
  'en': {
    title: 'RSP Skill manager',
    target: 'Target',
    defaultHeading: 'Core suite (installed together)',
    missing: 'missing',
    unchanged: 'unchanged',
    divergent: 'divergent',
    locked: 'locked',
    selectHelp: 'Enter install suite · Esc cancel',
    replaceTitle: 'Apply the listed replacements and deletions? Local customizations in these directories will be lost.',
    replaceHelp: 'y confirm · n cancel',
    replaceDirectory: 'Replace directory',
    removeDirectory: 'Delete directory',
  },
  'zh-CN': {
    title: 'RSP Skill 管理器',
    target: '目标',
    defaultHeading: '核心套件（整套安装）',
    missing: '未安装',
    unchanged: '一致',
    divergent: '有差异',
    locked: '锁定',
    selectHelp: '回车安装整套 · Esc 取消',
    replaceTitle: '确认执行列出的替换和删除？这些目录内的本地定制内容将丢失。',
    replaceHelp: 'y 确认 · n 取消',
    replaceDirectory: '替换目录',
    removeDirectory: '删除目录',
  },
}
