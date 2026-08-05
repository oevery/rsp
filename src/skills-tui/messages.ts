import type { UiLocale } from '../tui/i18n/locale.js'

export interface SkillsTuiMessages {
  title: string
  target: string
  defaultHeading: string
  optionalHeading: string
  missing: string
  unchanged: string
  divergent: string
  locked: string
  none: string
  selectHelp: string
  replaceTitle: string
  replaceHelp: string
}

export const skillsCatalogs: Record<UiLocale, SkillsTuiMessages> = {
  'en': {
    title: 'RSP Skill manager',
    target: 'Target',
    defaultHeading: 'Default suite Skills',
    optionalHeading: 'Optional project Skills',
    missing: 'missing',
    unchanged: 'unchanged',
    divergent: 'divergent',
    locked: 'locked',
    none: 'none',
    selectHelp: '↑/↓ move · Space select · Enter confirm · Esc cancel',
    replaceTitle: 'Replace divergent selected Skills?',
    replaceHelp: 'y replace · n cancel',
  },
  'zh-CN': {
    title: 'RSP Skill 管理器',
    target: '目标',
    defaultHeading: '默认套件 Skills',
    optionalHeading: '可选项目 Skills',
    missing: '未安装',
    unchanged: '一致',
    divergent: '有差异',
    locked: '锁定',
    none: '无',
    selectHelp: '↑/↓ 移动 · 空格选择 · 回车确认 · Esc 取消',
    replaceTitle: '替换所选的差异 Skill？',
    replaceHelp: 'y 替换 · n 取消',
  },
}
