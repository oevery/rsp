import { defineConfig } from 'vitepress'

const shared = {
  search: { provider: 'local' as const },
  socialLinks: [{ icon: 'github' as const, link: 'https://github.com/oevery/rsp' }],
}

export default defineConfig({
  title: 'RSP',
  description: 'Reliable Software Practice',
  cleanUrls: true,
  ignoreDeadLinks: [/^https?:\/\//],
  themeConfig: shared,
  locales: {
    'root': {
      label: 'English',
      lang: 'en',
      link: '/',
      themeConfig: {
        ...shared,
        nav: nav('en'),
        sidebar: sidebar('en'),
      },
    },
    'zh-CN': {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh-CN/',
      themeConfig: {
        ...shared,
        nav: nav('zh-CN'),
        sidebar: sidebar('zh-CN'),
        outline: { label: '本页目录' },
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdated: { text: '最后更新' },
        returnToTopLabel: '返回顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '外观',
      },
    },
  },
  rewrites: {
    'en/:rest*': ':rest*',
  },
})

function nav(locale: 'en' | 'zh-CN') {
  const prefix = locale === 'en' ? '' : '/zh-CN'
  const zh = locale === 'zh-CN'
  return [
    { text: zh ? '入门' : 'Get started', link: `${prefix}/getting-started` },
    { text: zh ? '指南' : 'Guides', link: `${prefix}/guides/daily-workflow` },
    { text: zh ? '参考' : 'Reference', link: `${prefix}/reference/cli` },
    { text: zh ? '迁移' : 'Migrations', link: '/migrations/3.1' },
  ]
}

function sidebar(locale: 'en' | 'zh-CN') {
  const prefix = locale === 'en' ? '' : '/zh-CN'
  const zh = locale === 'zh-CN'
  const link = (path: string) => `${prefix}/${path}`
  return [
    {
      text: zh ? '开始使用' : 'Start',
      items: [
        { text: zh ? '概览' : 'Overview', link: link('') },
        { text: zh ? '五分钟入门' : 'Five-minute start', link: link('getting-started') },
        { text: zh ? '核心概念' : 'Core concepts', link: link('concepts') },
      ],
    },
    {
      text: zh ? '指南' : 'Guides',
      items: [
        { text: zh ? '日常工作流' : 'Daily workflow', link: link('guides/daily-workflow') },
        { text: 'Skills & Manage', link: link('guides/skills') },
      ],
    },
    {
      text: zh ? '参考' : 'Reference',
      items: [
        { text: zh ? '配置' : 'Configuration', link: link('reference/configuration') },
        { text: 'CLI', link: link('reference/cli') },
      ],
    },
  ]
}
