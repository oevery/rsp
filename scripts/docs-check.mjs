import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const docsRoot = join(repositoryRoot, 'docs')
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
  if (withoutQuery.startsWith('/'))
    return join(docsRoot, withoutQuery)
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
const firstFiles = markdownFiles(join(docsRoot, firstLocale))

for (const file of firstFiles) {
  const localePath = relative(join(docsRoot, firstLocale), file)
  for (const locale of otherLocales) {
    const pair = join(docsRoot, locale, localePath)
    if (!existsSync(pair))
      errors.push(`Missing ${locale} page for ${firstLocale}/${localePath}`)
  }
}

for (const locale of otherLocales) {
  for (const file of markdownFiles(join(docsRoot, locale))) {
    const localePath = relative(join(docsRoot, locale), file)
    const pair = join(docsRoot, firstLocale, localePath)
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
