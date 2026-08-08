import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const packageManifest = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8'))
const docsRoot = join(repositoryRoot, 'docs')
const siteRoot = join(docsRoot, 'site')
const localeRoots = ['en', 'zh-CN']

function markdownFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    if (entry.isDirectory())
      return markdownFiles(path)
    return entry.isFile() && extname(entry.name) === '.md' ? [path] : []
  })
}

function normalizeSiteTarget(target) {
  const withoutQuery = target.split(/[?#]/, 1)[0]
  if (!withoutQuery)
    return null
  if (withoutQuery.startsWith('/')) {
    const route = withoutQuery.slice(1)
    return route === 'zh-CN' || route.startsWith('zh-CN/')
      ? join(siteRoot, route)
      : join(siteRoot, 'en', route)
  }
  return null
}

function candidateTargets(source, rawTarget) {
  const decoded = decodeURIComponent(rawTarget)
  const siteTarget = normalizeSiteTarget(decoded)
  const base = siteTarget ?? resolve(dirname(source), decoded.split(/[?#]/, 1)[0])
  if (!base)
    return []
  if (extname(base))
    return [base]
  return [base, `${base}.md`, join(base, 'index.md')]
}

const errors = []
const [firstLocale, ...otherLocales] = localeRoots
const firstRoot = join(siteRoot, firstLocale)
const firstFiles = markdownFiles(firstRoot)

function checkSetupSemantics(file, content) {
  const relativePath = relative(repositoryRoot, file)
  const nodeRequirement = packageManifest.engines?.node
  const nodeMajor = typeof nodeRequirement === 'string'
    ? nodeRequirement.match(/>=\s*(\d+)/)?.[1]
    : null

  if (!nodeMajor)
    errors.push(`Unable to derive the Node.js engine requirement from package.json for ${relativePath}`)
  else if (!new RegExp(`Node\\.js\\s+${nodeMajor}\\b`, 'i').test(content))
    errors.push(`Missing current Node.js engine requirement in ${relativePath}`)

  if (!/\binit\s+--with-project-setup\b/.test(content))
    errors.push(`Missing project setup invocation in ${relativePath}`)
  if (!/\bdoctor\b/.test(content))
    errors.push(`Missing doctor verification command in ${relativePath}`)
  if (!/\bstatus\b/.test(content))
    errors.push(`Missing status inspection command in ${relativePath}`)
  if (/\bRSP\s+3\.\d+\b/i.test(content)) {
    errors.push(`Evergreen setup prose must not pin a release identity in ${relativePath}`)
  }
}

if (typeof packageManifest.name !== 'string'
  || typeof packageManifest.version !== 'string'
  || typeof packageManifest.engines?.node !== 'string') {
  errors.push('package.json is missing the authoritative name, version, or Node.js engine fields')
}

for (const file of firstFiles) {
  const localePath = relative(firstRoot, file)
  for (const locale of otherLocales) {
    const pair = join(siteRoot, locale, localePath)
    if (!existsSync(pair))
      errors.push(`Missing ${locale} page for ${firstLocale}/${localePath}`)
  }
}

for (const locale of otherLocales) {
  const localeRoot = join(siteRoot, locale)
  for (const file of markdownFiles(localeRoot)) {
    const localePath = relative(localeRoot, file)
    const pair = join(firstRoot, localePath)
    if (!existsSync(pair))
      errors.push(`Missing ${firstLocale} page for ${locale}/${localePath}`)
  }
}

const checkedFiles = [
  join(repositoryRoot, 'README.md'),
  join(repositoryRoot, 'README.zh-CN.md'),
  ...markdownFiles(docsRoot),
]
const markdownLink = /!?\[[^\]]*\]\(([^)]+)\)/g

for (const file of checkedFiles) {
  const content = readFileSync(file, 'utf8')
  if ([
    join(repositoryRoot, 'README.md'),
    join(repositoryRoot, 'README.zh-CN.md'),
    join(siteRoot, 'en', 'getting-started.md'),
    join(siteRoot, 'zh-CN', 'getting-started.md'),
  ].includes(file)) {
    checkSetupSemantics(file, content)
  }

  for (const match of content.matchAll(markdownLink)) {
    const target = match[1].trim().replace(/^<|>$/g, '')
    if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target))
      continue
    const candidates = candidateTargets(file, target)
    if (!candidates.some(candidate => existsSync(candidate) && statSync(candidate).isFile()))
      errors.push(`Broken link in ${relative(repositoryRoot, file)}: ${target}`)
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exitCode = 1
}
else {
  const pairCount = firstFiles.length
  console.log(`Documentation checks passed: ${pairCount} bilingual page pairs and ${checkedFiles.length} Markdown files.`)
}
