import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFile, execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { chromium } from 'playwright-core'

async function chooseOption(page, label, option) {
  const trigger = page.getByRole('combobox', { name: label, exact: true })
  await trigger.click()
  await page.getByRole('option', { name: option, exact: true }).click()
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'combobox')
}

async function main() {
  const execute = promisify(execFile)
  const root = process.cwd()
  const temporary = await realpath(await mkdtemp(join(tmpdir(), 'rsp-viewer-browser-')))
  const installed = join(temporary, 'package')
  const first = join(temporary, 'first')
  const second = join(temporary, 'second')
  const worktree = join(temporary, 'worktree')
  const cli = join(installed, 'dist/cli.mjs')
  const checks = []
  const errors = []
  const network = []
  const measurements = {}
  let browser
  let page
  const run = async (cwd, args) => (await execute(process.execPath, [cli, ...args], { cwd, timeout: 20000 })).stdout.trim()
  function architecture(title) {
    return { schemaVersion: 1, nodes: [
      { id: 'app', title, description: 'Owns the app' },
      { id: 'runtime', parent: 'app', title: `${title} Runtime`, description: 'Serves requests' },
      { id: 'query', parent: 'runtime', title: `${title} Query`, description: 'Reads state' },
      { id: 'store', title: `${title} Store`, description: 'Persists records' },
    ], relations: [{ id: 'reads', source: 'query', target: 'store', type: 'read', description: 'Reads records' }, { id: 'owns', source: 'app', target: 'runtime', type: 'owns', description: 'Owns runtime' }, { id: 'retries', source: 'query', target: 'query', type: 'retry', description: 'Retries query' }], views: [
      { id: 'landscape', title: 'Landscape', node: 'app', include: ['runtime', 'store'] },
      { id: 'runtime', title: 'Runtime', node: 'runtime', include: ['query', 'store'] },
    ], bindings: [{ node: 'app', file: 'docs/contract.md', headings: ['Contract'], scope: 'subtree' }] }
  }
  try {
    await mkdir(installed)
    await cp(join(root, 'dist'), join(installed, 'dist'), { recursive: true })
    await cp(join(root, 'package.json'), join(installed, 'package.json'))
    await symlink(join(root, 'node_modules'), join(installed, 'node_modules'))
    for (const [project, title] of [[first, 'First'], [second, 'Second']]) {
      await mkdir(join(project, '.rsp'), { recursive: true })
      await mkdir(join(project, 'docs'))
      await mkdir(join(project, 'notes'))
      await mkdir(join(project, 'assets'))
      await writeFile(join(project, '.rsp/architecture.json'), JSON.stringify(architecture(title)))
      await writeFile(join(project, 'docs/contract.md'), `# ${title} document\n\n## Contract\n\n${'complete reading body '.repeat(2500)}\n\n## Final chapter\n\nEND OF COMPLETE DOCUMENT\n\n[Other](../notes/other.md#other)\n\n![Local](../assets/image.png)\n\n![Blocked](https://example.invalid/tracker.png)\n\n<script>window.projectScriptExecuted=true</script>\n`)
      await writeFile(join(project, 'notes/other.md'), `# Other\n\nLOCAL LINK TARGET\n\n[Back to contract](../docs/contract.md)\n\n${'Before linked chapter.\n\n'.repeat(120)}## Linked chapter\n\n![Linked image](../assets/image.png)\n\n${'After linked chapter.\n\n'.repeat(120)}`)
      await writeFile(join(project, 'assets/image.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgaGD4DwAChAGA+gVWHQAAAABJRU5ErkJggg==', 'base64'))
      execFileSync('git', ['init', '-q'], { cwd: project })
      execFileSync('git', ['add', '.'], { cwd: project })
      execFileSync('git', ['-c', 'user.name=Viewer Test', '-c', 'user.email=viewer@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture'], { cwd: project })
    }
    execFileSync('git', ['worktree', 'add', '-q', '--detach', worktree], { cwd: first })
    const cold = performance.now()
    const opened = await Promise.all([run(first, ['view', '--no-open']), run(second, ['view', '--no-open'])])
    measurements.concurrentColdOpenMs = performance.now() - cold
    const warm = performance.now()
    const worktreeUrl = await run(worktree, ['view', '--no-open'])
    measurements.warmOpenMs = performance.now() - warm
    assert.ok(opened.every(Boolean), `Missing open output: ${JSON.stringify(opened)}`)
    assert.equal(new URL(opened[0]).origin, new URL(opened[1]).origin)
    assert.notEqual(new URL(opened[0]).search, new URL(worktreeUrl).search)
    checks.push('Concurrent starts converge; two Git projects and a real worktree have distinct workspace identities')
    browser = await chromium.launch({ ...(process.env.RSP_BROWSER_EXECUTABLE ? { executablePath: process.env.RSP_BROWSER_EXECUTABLE } : { channel: 'chrome' }), headless: true })
    page = await browser.newPage({ locale: 'en-US', viewport: { width: 1440, height: 1000 } })
    page.setDefaultTimeout(15000)
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => network.push(request.url()))
    const node = id => page.locator(`.react-flow__node[data-id="${id}"]`)
    const openView = async (target, name) => {
      const navigation = target.getByRole('navigation', { name: 'Views', exact: true })
      if (!await navigation.isVisible())
        await target.getByRole('button', { name: 'Navigation', exact: true }).click()
      await target.getByRole('navigation', { name: 'Views', exact: true }).getByRole('button', { name, exact: true }).click()
    }
    await page.goto(opened[0])
    await page.getByRole('navigation', { name: 'Views', exact: true }).getByRole('button', { name: 'Landscape', exact: true }).waitFor()
    await page.locator('.canvas .react-flow__node').first().waitFor()
    assert.ok(await page.locator('.view-navigation button').first().evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize) >= 14))
    assert.ok(await page.locator('.workspace-identity').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize) >= 12))
    assert.equal(network.some(url => url.includes('/document?')), false)
    assert.equal(await page.title(), 'Landscape · first · RSP')
    const icon = await page.locator('link[rel=icon]').getAttribute('href')
    assert.equal(decodeURIComponent(icon.split(',')[1]), await readFile(join(root, 'docs/site/public/rsp-icon.svg'), 'utf8'))
    await page.getByRole('combobox', { name: 'Workspace', exact: true }).click()
    await page.getByRole('group', { name: 'first', exact: true }).waitFor()
    await page.getByRole('option', { name: 'worktree', exact: true }).getByText(/Detached HEAD/).waitFor()
    await page.keyboard.press('Escape')
    await writeFile(join(worktree, 'docs/contract.md'), '# Worktree Spec\n\n## Contract\n\nWORKTREE ONLY CONTENT\n')
    await chooseOption(page, 'Workspace', 'worktree')
    assert.equal(new URL(page.url()).searchParams.get('workspace'), new URL(worktreeUrl).searchParams.get('workspace'))
    const worktreeSearch = page.getByRole('combobox', { name: 'Search objects', exact: true })
    await worktreeSearch.fill('First Query')
    await worktreeSearch.press('Enter')
    await page.getByRole('navigation', { name: 'Documents', exact: true }).getByRole('button').click()
    await page.locator('article').getByText('WORKTREE ONLY CONTENT', { exact: true }).waitFor()
    await chooseOption(page, 'Workspace', 'first')
    await page.locator('.canvas .react-flow__node').first().waitFor()
    assert.equal(await page.locator('article').count(), 0)
    checks.push('Bundled RSP icon/favicon and contextual title render; repository grouping exposes detached worktree identity while model and Spec navigation remain workspace-isolated')
    assert.equal(new URL(page.url()).searchParams.get('view'), 'landscape')
    await node('n0.n1').waitFor({ state: 'visible' })
    await page.locator('.canvas').getByText('owns', { exact: true }).waitFor()
    assert.match(await node('n0.n1.n2').textContent(), /First Query \[boundary\]/)
    assert.equal(await page.locator('.canvas').getByText('retry', { exact: true }).count(), 0)
    checks.push('Stable sidebar defaults to the first declared view; named views keep exact boundaries without recursive expansion or requesting document bodies')
    const transform = () => page.locator('.canvas .react-flow__viewport').getAttribute('style')
    const beforeSelection = await transform()
    await node('r0').click()
    await page.getByRole('complementary', { name: 'Details', exact: true }).getByRole('heading', { name: 'First Runtime', exact: true }).waitFor()
    assert.equal(new URL(page.url()).searchParams.get('view'), 'landscape')
    assert.equal(await transform(), beforeSelection)
    const selectedBounds = await node('r0').boundingBox()
    const cardBounds = await page.getByRole('complementary', { name: 'Details', exact: true }).boundingBox()
    const overlap = Math.max(0, Math.min(selectedBounds.x + selectedBounds.width, cardBounds.x + cardBounds.width) - Math.max(selectedBounds.x, cardBounds.x)) * Math.max(0, Math.min(selectedBounds.y + selectedBounds.height, cardBounds.y + cardBounds.height) - Math.max(selectedBounds.y, cardBounds.y))
    assert.equal(overlap, 0)
    await node('r0').hover()
    await node('r0').getByRole('button', { name: /Browse First Runtime.*relationships/ }).click()
    await page.locator('.relationships-browser.initialized').waitFor({ state: 'visible' })
    await page.locator('.relationships-browser .react-flow__edge').first().waitFor({ state: 'attached' })
    await page.keyboard.press('Escape')
    assert.ok(await page.getByRole('complementary', { name: 'Details', exact: true }).isVisible(), 'Native Escape must not also close host details')
    await page.locator('.canvas').getByText('owns', { exact: true }).click()
    await page.getByRole('complementary', { name: 'Details', exact: true }).getByRole('heading', { name: 'owns', exact: true }).waitFor()
    await page.getByRole('complementary', { name: 'Details', exact: true }).getByText('Owns runtime', { exact: true }).waitFor()
    assert.equal(await transform(), beforeSelection)
    await node('r0').click()
    checks.push('Click only selects original-object details without navigation or viewport changes; native relationship browsing remains available')
    await page.getByRole('navigation', { name: 'Node views', exact: true }).getByRole('button', { name: 'Runtime', exact: false }).click()
    await node('n0.n1.n2').waitFor({ state: 'visible' })
    await node('n0.n1.n2').click()
    const canvasBounds = await page.locator('.canvas').boundingBox()
    const beforeWheel = await transform()
    await page.mouse.move(canvasBounds.x + canvasBounds.width * 0.4, canvasBounds.y + canvasBounds.height * 0.8)
    await page.mouse.wheel(0, -180)
    let previousViewport = await transform()
    for (let sample = 0; sample < 20; sample++) {
      await page.waitForTimeout(150)
      const current = await transform()
      if (current && current === previousViewport)
        break
      previousViewport = current
    }
    const savedViewport = await transform()
    assert.notEqual(savedViewport, beforeWheel)
    await page.getByRole('button', { name: 'Focus relationships', exact: false }).click()
    await page.getByRole('heading', { name: 'First Query relationships', exact: true }).waitFor()
    await page.locator('.canvas').getByText('retry', { exact: true }).first().waitFor()
    await page.goBack()
    await page.getByRole('heading', { name: 'Runtime', exact: true }).waitFor()
    await page.locator('.canvas .react-flow__viewport').waitFor()
    const numbers = value => value.match(/-?\d+(?:\.\d+)?/g).map(Number)
    let restoredViewport
    for (let sample = 0; sample < 20; sample++) {
      restoredViewport = await transform()
      if (numbers(savedViewport).every((value, index) => Math.abs(value - numbers(restoredViewport)[index]) < (index === 2 ? 0.00001 : 1)))
        break
      await page.waitForTimeout(100)
    }
    assert.ok(numbers(savedViewport).every((value, index) => Math.abs(value - numbers(restoredViewport)[index]) < (index === 2 ? 0.00001 : 1)), `Viewport was not restored: ${savedViewport} / ${restoredViewport}`)
    await page.getByRole('button', { name: 'Focus relationships', exact: false }).click()
    await page.getByRole('heading', { name: 'First Query relationships', exact: true }).waitFor()
    const focusedUrl = page.url()
    await page.reload()
    await page.getByRole('complementary', { name: 'Details', exact: true }).getByRole('heading', { name: 'First Query', exact: true }).waitFor()
    assert.equal(page.url(), focusedUrl)
    await page.goBack()
    await page.getByRole('heading', { name: 'Runtime', exact: true }).waitFor()
    await node('n0.n1.n2').click()
    checks.push('Internal-view and relationship-focus navigation are explicit; focus and selection survive refresh and back navigation')
    const beforeDocument = await transform()
    const search = page.getByRole('combobox', { name: 'Search objects', exact: true })
    await search.fill('First')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('End')
    await page.keyboard.press('Home')
    const firstOption = page.getByRole('listbox', { name: 'Search results', exact: true }).getByRole('option', { selected: true })
    assert.match(await firstOption.textContent(), /First/)
    await page.keyboard.press('Escape')
    assert.equal(await search.inputValue(), '')
    assert.ok(await page.getByRole('complementary', { name: 'Details', exact: true }).isVisible())
    await search.fill('First Query')
    await page.keyboard.press('Enter')
    await page.getByRole('complementary', { name: 'Details', exact: true }).getByRole('heading', { name: 'First Query', exact: true }).waitFor()
    const bindingButton = page.getByRole('navigation', { name: 'Documents', exact: true }).getByRole('button').first()
    for (let tab = 0; tab < 20 && !await bindingButton.evaluate(element => element === document.activeElement); tab++)
      await page.keyboard.press('Tab')
    assert.ok(await bindingButton.evaluate(element => element === document.activeElement), 'Search selection must provide a keyboard path to its document')
    await page.keyboard.press('Enter')
    const article = page.locator('article')
    await article.getByText('END OF COMPLETE DOCUMENT').waitFor()
    assert.ok((await article.textContent()).length > 12000)
    assert.equal(await page.getByRole('complementary', { name: 'Details', exact: true }).count(), 0)
    assert.ok(await page.getByRole('complementary', { name: 'Architecture navigation', exact: true }).isVisible())
    assert.equal(await transform(), beforeDocument)
    assert.equal(await page.locator('[role=dialog]').count(), 0, 'Desktop reading must not introduce a modal dialog')
    const readingUrl = page.url()
    const readingOffset = await article.evaluate(element => element.scrollTop)
    await search.fill('First Store')
    const disabledResult = page.getByRole('listbox', { name: 'Search results', exact: true }).getByRole('option').first()
    assert.equal(await disabledResult.getAttribute('aria-disabled'), 'true')
    await page.getByText('Close the document to select an object.', { exact: true }).waitFor()
    await page.keyboard.press('Enter')
    // Exercise the pointer handler despite the deliberately disabled ARIA state.
    await disabledResult.dispatchEvent('click')
    assert.equal(page.url(), readingUrl)
    assert.equal(await article.evaluate(element => element.scrollTop), readingOffset)
    assert.equal(await transform(), beforeDocument)
    await search.fill('')
    checks.push('Reading blocks search keyboard and pointer reselection without changing the document, original object or viewport')
    assert.notEqual(await page.locator('body').evaluate(element => getComputedStyle(element).pointerEvents), 'none')
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
    await page.waitForTimeout(400)
    assert.notEqual(await transform(), beforeDocument, 'The canvas remains interactive during desktop reading')
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click()
    await page.waitForTimeout(400)
    const restoredAfterZoom = await transform()
    assert.ok(numbers(beforeDocument).every((value, index) => Math.abs(value - numbers(restoredAfterZoom)[index]) < 0.001))
    const drawer = page.getByRole('region', { name: 'Complete document', exact: true })
    const drawerBefore = await drawer.boundingBox()
    await page.getByRole('separator', { name: 'Resize document', exact: true }).focus()
    await page.keyboard.press('ArrowLeft')
    assert.ok((await drawer.boundingBox()).width > drawerBefore.width)
    assert.equal(await transform(), beforeDocument)
    const separator = await page.getByRole('separator', { name: 'Resize document', exact: true }).boundingBox()
    const beforeDrag = await drawer.boundingBox()
    await page.mouse.move(separator.x + separator.width / 2, separator.y + separator.height / 2)
    await page.mouse.down()
    await page.mouse.move(separator.x - 45, separator.y + separator.height / 2)
    await page.mouse.up()
    assert.ok((await drawer.boundingBox()).width > beforeDrag.width)
    assert.equal(await transform(), beforeDocument)
    await page.getByRole('button', { name: 'Expand reading', exact: true }).click()
    assert.ok(Math.abs((await drawer.boundingBox()).width - (await page.locator('.canvas').boundingBox()).width) < 2)
    assert.equal(await transform(), beforeDocument)
    await page.getByRole('button', { name: 'Reduce', exact: true }).click()
    await page.getByRole('button', { name: 'Return to graph', exact: true }).focus()
    await page.keyboard.press('Escape')
    await page.getByRole('complementary', { name: 'Details', exact: true }).getByRole('heading', { name: 'First Query', exact: true }).waitFor()
    assert.equal(await transform(), beforeDocument)
    await page.waitForFunction(() => {
      let active = document.activeElement
      while (active?.shadowRoot?.activeElement)
        active = active.shadowRoot.activeElement
      return active?.matches('.react-flow__node[data-id="n0.n1.n2"]')
    })
    assert.ok(await node('n0.n1.n2').evaluate(element => element.getRootNode().activeElement === element), 'Closing reading restores focus to the selected native node')
    await page.getByRole('navigation', { name: 'Documents', exact: true }).getByRole('button').first().click()
    await article.getByText('END OF COMPLETE DOCUMENT').waitFor()
    const chapterOffset = () => article.evaluate(element => element.getBoundingClientRect().top - element.querySelector('#contract').getBoundingClientRect().top)
    await article.evaluate(element => element.scrollTop += 800)
    await page.waitForTimeout(100)
    const beforeNarrowReading = await chapterOffset()
    await page.setViewportSize({ width: 390, height: 844 })
    const modal = page.getByRole('dialog', { name: 'Read complete document', exact: true })
    await modal.waitFor()
    const afterNarrowReading = await chapterOffset()
    assert.ok(Math.abs(afterNarrowReading - beforeNarrowReading) < 2, `Narrow remount preserves chapter offset: ${beforeNarrowReading} -> ${afterNarrowReading}`)
    assert.ok((await drawer.boundingBox()).width >= 388)
    for (let tab = 0; tab < 12; tab++) {
      await page.keyboard.press(tab % 2 ? 'Shift+Tab' : 'Tab')
      assert.ok(await modal.evaluate(element => element.contains(document.activeElement)), 'Mobile reading traps focus')
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.equal(await page.getByRole('complementary', { name: 'Details', exact: true }).count(), 0)
    const mobileViewport = await transform()
    if (await page.getByRole('tooltip').count()) {
      await page.keyboard.press('Escape')
      assert.ok(await modal.isVisible())
    }
    await page.keyboard.press('Escape')
    await modal.waitFor({ state: 'hidden' })
    assert.equal(await transform(), mobileViewport)
    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    const navigationModal = page.getByRole('dialog', { name: 'Architecture navigation', exact: true })
    await navigationModal.waitFor()
    const mobileSearch = navigationModal.getByRole('combobox', { name: 'Search objects', exact: true })
    await mobileSearch.fill('Query')
    await page.keyboard.press('Escape')
    assert.equal(await mobileSearch.inputValue(), '')
    assert.ok(await navigationModal.isVisible(), 'Escape dismisses search before its enclosing sheet')
    await page.keyboard.press('Escape')
    await navigationModal.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.matches('.navigation-toggle'))
    assert.ok(await page.getByRole('button', { name: 'Navigation', exact: true }).evaluate(element => element === document.activeElement))
    await page.getByRole('navigation', { name: 'Documents', exact: true }).getByRole('button').first().click()
    await article.getByText('END OF COMPLETE DOCUMENT').waitFor()
    await article.evaluate(element => element.scrollTop += 600)
    await page.waitForTimeout(100)
    const beforeWideReading = await chapterOffset()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await modal.waitFor({ state: 'hidden' })
    assert.ok(Math.abs(await chapterOffset() - beforeWideReading) < 2, 'Desktop remount preserves the current chapter offset')
    const wholeDocumentUrl = new URL(page.url())
    wholeDocumentUrl.searchParams.delete('anchor')
    await page.goto(wholeDocumentUrl.href)
    await article.getByText('END OF COMPLETE DOCUMENT').waitFor()
    await article.evaluate(element => element.scrollTop = 800)
    await page.waitForTimeout(100)
    const wholeDocumentOffset = await chapterOffset()
    await page.setViewportSize({ width: 390, height: 844 })
    await modal.waitFor()
    assert.ok(Math.abs(await chapterOffset() - wholeDocumentOffset) < 2, 'Whole-file reading does not reset to the top on a narrow remount')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await modal.waitFor({ state: 'hidden' })
    assert.ok(Math.abs(await chapterOffset() - wholeDocumentOffset) < 2, 'Whole-file reading survives the return to desktop')
    checks.push('Reading position survives desktop/mobile remounts in both directions for chapter and whole-file links')
    checks.push('Keyboard object search, top-layer Escape, selected-node focus return, non-modal desktop canvas and trapped narrow-screen sheets work without competing layers')
    checks.push('Node information opens a complete chapter-positioned right drawer; resize, expand and close keep the selection and viewport, with no competing detail card and usable narrow-screen reading')
    await page.getByRole('navigation', { name: 'Table of contents' }).getByRole('button', { name: 'Final chapter', exact: true }).click()
    assert.ok(await article.evaluate(element => element.scrollTop) > 0)
    await article.getByRole('link', { name: 'Other', exact: true }).click()
    await article.getByText('LOCAL LINK TARGET').waitFor()
    await page.getByRole('navigation', { name: 'Table of contents' }).getByRole('button', { name: 'Linked chapter', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('article img')?.naturalWidth === 1)
    const image2 = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 2
      canvas.height = 1
      return canvas.toDataURL().split(',')[1]
    })
    await writeFile(join(first, 'assets/image.png'), Buffer.from(image2, 'base64'))
    await page.waitForFunction(() => document.querySelector('article img')?.naturalWidth === 2)
    await rm(join(first, 'assets/image.png'))
    await page.getByRole('alert').filter({ hasText: 'Displayed image is stale.' }).waitFor()
    assert.equal(await article.locator('img').evaluate(image => image.naturalWidth), 2)
    await writeFile(join(first, 'assets/image.png'), Buffer.from(image2, 'base64'))
    await page.getByRole('alert').filter({ hasText: 'Displayed image is stale.' }).waitFor({ state: 'detached' })
    await writeFile(join(first, 'notes/other.md'), `# Other\n\n${'Inserted before chapter.\n\n'.repeat(180)}## Linked chapter\n\nUNBOUND DOCUMENT UPDATED\n\n![Linked image](../assets/image.png)\n\n${'After linked chapter.\n\n'.repeat(120)}`)
    await article.getByText('UNBOUND DOCUMENT UPDATED', { exact: true }).waitFor()
    assert.ok(Math.abs(await article.locator('#linked-chapter').evaluate(heading => heading.getBoundingClientRect().top - heading.closest('article').getBoundingClientRect().top)) < 80)
    await rm(join(first, 'notes/other.md'))
    await page.getByRole('alert').filter({ hasText: 'Displayed document is stale.' }).waitFor()
    await article.getByText('UNBOUND DOCUMENT UPDATED', { exact: true }).waitFor()
    await writeFile(join(first, 'notes/other.md'), '# Other\n\nUNBOUND REACTIVATED\n')
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await article.getByText('UNBOUND REACTIVATED', { exact: true }).waitFor()
    await page.getByRole('status').filter({ hasText: 'selected chapter is unavailable' }).waitFor()
    checks.push('Unbound relative Markdown and images independently detect updates/deletion/recovery, preserve the reading chapter and display stale/missing targets')
    await page.goBack()
    await page.goBack()
    await article.getByText('END OF COMPLETE DOCUMENT').waitFor()
    await page.waitForFunction(() => document.querySelector('article img')?.naturalWidth === 2)
    assert.equal(await page.evaluate(() => globalThis.projectScriptExecuted), undefined)
    checks.push('Complete long document, chapter positioning, relative link/history and local image work; project HTML does not execute')
    const selectedWorkspace = new URL(page.url()).searchParams.get('workspace')
    const before = JSON.parse(await run(first, ['view', 'status']))
    const update = performance.now()
    await writeFile(join(first, 'docs/contract.md'), '# First document\n\n## Contract\n\nUPDATED DOCUMENT\n\n## Final chapter\n\nEND OF COMPLETE DOCUMENT\n')
    await article.getByText('UPDATED DOCUMENT', { exact: true }).waitFor()
    measurements.documentUpdateMs = performance.now() - update
    const after = JSON.parse(await run(first, ['view', 'status']))
    assert.equal(before.workspaces.find(item => item.id === selectedWorkspace).layoutMs, after.workspaces.find(item => item.id === selectedWorkspace).layoutMs)
    const secondId = new URL(opened[1]).searchParams.get('workspace')
    // Delay one old-workspace response, then switch while it is outstanding.
    await page.route(`**/api/workspaces/${selectedWorkspace}/model`, async (route) => {
      await new Promise(resolve => setTimeout(resolve, 600))
      try {
        await route.continue()
      }
      catch {}
    })
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await chooseOption(page, 'Workspace', 'second')
    await page.getByRole('navigation', { name: 'Views', exact: true }).waitFor()
    await openView(page, 'Landscape')
    await node('n0.n1').waitFor({ state: 'visible' })
    assert.match(await node('n0.n1').textContent(), /Second Runtime/)
    await page.waitForTimeout(800)
    assert.match(await node('n0.n1').textContent(), /Second Runtime/)
    await page.goBack()
    await page.goBack()
    await article.getByText('UPDATED DOCUMENT', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Return to graph' }).click()
    await node('n0.n1.n2').waitFor({ state: 'visible' })
    checks.push('Document-only updates reuse layout; delayed responses and browser history preserve workspace isolation')
    await writeFile(join(first, '.rsp/architecture.json'), '{invalid')
    await page.getByRole('alert').filter({ hasText: 'stale' }).waitFor()
    await writeFile(join(first, '.rsp/architecture.json'), JSON.stringify(architecture('Repaired')))
    await page.getByRole('alert').waitFor({ state: 'detached' })
    await node('n0.n1.n2').waitFor({ state: 'visible' })
    checks.push('Invalid architecture marks stale content; repaired dirty sources recover')
    const reduced = architecture('Reduced')
    reduced.nodes = reduced.nodes.filter(node => node.id !== 'query')
    reduced.relations = []
    reduced.views = reduced.views.filter(view => view.id !== 'runtime')
    await writeFile(join(first, '.rsp/architecture.json'), JSON.stringify(reduced))
    await page.getByRole('status').filter({ hasText: 'previous view was removed' }).waitFor()
    assert.equal(await node('n0.n1.n2').count(), 0)
    reduced.views.push({ id: 'constructor', title: 'Prototype-named view', node: 'app', include: ['runtime'] })
    await writeFile(join(first, '.rsp/architecture.json'), JSON.stringify(reduced))
    await openView(page, 'Prototype-named view')
    await node('n0.n1').waitFor({ state: 'visible' })
    assert.equal(await page.title(), 'Prototype-named view · first · RSP')
    reduced.views.pop()
    await writeFile(join(first, '.rsp/architecture.json'), JSON.stringify(reduced))
    await page.getByRole('status').filter({ hasText: 'previous view was removed' }).waitFor()
    await page.locator('.canvas .react-flow__node').filter({ hasText: 'Reduced Store' }).waitFor({ state: 'visible' })
    assert.equal(await page.title(), 'All registered nodes · first · RSP')
    checks.push('Removing a node and the active view falls back explicitly to all registered structure')
    await chooseOption(page, 'Workspace', 'second')
    await openView(page, 'Landscape')
    await node('n0.n1').waitFor({ state: 'visible' })
    execFileSync('git', ['checkout', '-qb', 'viewer-update'], { cwd: first })
    await writeFile(join(first, '.rsp/architecture.json'), JSON.stringify(architecture('Branch')))
    await writeFile(join(first, '.rsp/config.yaml'), 'workflow:\n  delegation: auto\n  closeout: ask\n')
    execFileSync('git', ['add', '.'], { cwd: first })
    execFileSync('git', ['-c', 'user.name=Viewer Test', '-c', 'user.email=viewer@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'branch input'], { cwd: first })
    await chooseOption(page, 'Workspace', 'first')
    await openView(page, 'Landscape')
    await node('n0.n1').waitFor({ state: 'visible' })
    assert.match(await node('n0.n1').textContent(), /Branch Runtime/)
    checks.push('Branch and configuration changes while a workspace is inactive load on return without rebuilding the frontend')
    const isolationPage = await browser.newPage({ locale: 'en-US', viewport: { width: 1440, height: 1000 } })
    isolationPage.setDefaultTimeout(15000)
    isolationPage.on('pageerror', error => errors.push(error.message))
    isolationPage.on('request', request => network.push(request.url()))
    // Hold the new context open so assertions cover the loading interval, not
    // only the eventual successful response that would clear unscoped errors.
    async function holdRequest(pattern) {
      let release
      let requested
      const gate = new Promise((resolve) => {
        release = resolve
      })
      const seen = new Promise((resolve) => {
        requested = resolve
      })
      const handler = async (route) => {
        requested()
        await gate
        try {
          await route.continue()
        }
        catch {}
      }
      await isolationPage.route(pattern, handler)
      return { seen, release: async () => {
        release()
        await isolationPage.unroute(pattern, handler)
      } }
    }
    await isolationPage.route(`**/api/workspaces/${selectedWorkspace}/model`, route => route.fulfill({ status: 409, body: 'FIRST WORKSPACE FAILURE' }))
    await isolationPage.goto(opened[0])
    await isolationPage.getByRole('alert').filter({ hasText: 'FIRST WORKSPACE FAILURE' }).waitFor()
    const workspaceLoad = await holdRequest(`**/api/workspaces/${secondId}/model`)
    await chooseOption(isolationPage, 'Workspace', 'second')
    await workspaceLoad.seen
    assert.equal(await isolationPage.getByRole('alert').count(), 0)
    await isolationPage.getByText('Opening architecture…', { exact: true }).waitFor()
    await workspaceLoad.release()
    await isolationPage.getByRole('navigation', { name: 'Views', exact: true }).waitFor()
    await openView(isolationPage, 'Landscape')
    await isolationPage.locator('.react-flow__node[data-id="r0"]').click()
    await isolationPage.route(`**/api/workspaces/${secondId}/asset?*`, route => route.fulfill({ status: 409, body: 'SECOND IMAGE FAILURE' }))
    await isolationPage.getByRole('navigation', { name: 'Documents', exact: true }).getByRole('button').first().click()
    await isolationPage.locator('article').getByRole('link', { name: 'Other', exact: true }).waitFor()
    await isolationPage.getByRole('alert').filter({ hasText: 'SECOND IMAGE FAILURE' }).waitFor()
    const documentLoad = await holdRequest(`**/api/workspaces/${secondId}/document?file=notes%2Fother.md`)
    await isolationPage.locator('article').getByRole('link', { name: 'Other', exact: true }).click()
    await documentLoad.seen
    assert.equal(await isolationPage.getByRole('alert').count(), 0)
    assert.equal(await isolationPage.locator('article').count(), 0)
    await documentLoad.release()
    await isolationPage.locator('article').getByText('LOCAL LINK TARGET').waitFor()
    await isolationPage.getByRole('alert').filter({ hasText: 'SECOND IMAGE FAILURE' }).waitFor()
    // The document error must be isolated independently of its image errors.
    await isolationPage.unroute(`**/api/workspaces/${secondId}/asset?*`)
    await isolationPage.evaluate(() => window.dispatchEvent(new Event('focus')))
    await isolationPage.getByRole('alert').waitFor({ state: 'detached' })
    await isolationPage.route(`**/api/workspaces/${secondId}/document?file=notes%2Fother.md`, route => route.fulfill({ status: 409, body: 'OTHER DOCUMENT FAILURE' }))
    await isolationPage.evaluate(() => window.dispatchEvent(new Event('focus')))
    await isolationPage.getByRole('alert').filter({ hasText: 'OTHER DOCUMENT FAILURE' }).waitFor()
    const returnLoad = await holdRequest(`**/api/workspaces/${secondId}/document?file=docs%2Fcontract.md`)
    await isolationPage.locator('article').getByRole('link', { name: 'Back to contract', exact: true }).click()
    await returnLoad.seen
    assert.equal(await isolationPage.getByRole('alert').count(), 0)
    await returnLoad.release()
    await isolationPage.locator('article').getByText('END OF COMPLETE DOCUMENT').waitFor()
    await isolationPage.close()
    checks.push('Workspace, document and image errors never appear in a different workspace/file, including delayed loading intervals')
    const shapes = [
      { name: 'single-app', nodes: [
        { id: 'app', title: 'Ledger App', description: 'One application with cohesive modules' },
        { id: 'http', title: 'HTTP API', description: 'Accepts requests', parent: 'app' },
        { id: 'domain', title: 'Ledger Domain', description: 'Owns ledger rules', parent: 'app' },
        { id: 'adapter', title: 'Storage Adapter', description: 'Persists entries', parent: 'app' },
        { id: 'db', title: 'Ledger DB', description: 'Independent data boundary' },
      ], relations: [
        { id: 'call', source: 'http', target: 'domain', type: 'call', description: 'Applies ledger rules' },
        { id: 'save', source: 'domain', target: 'adapter', type: 'call', description: 'Saves entries' },
        { id: 'sql', source: 'adapter', target: 'db', type: 'sql', description: 'Writes ledger records' },
      ], views: [{ id: 'inside', title: 'Application modules', node: 'app', include: ['app', 'http', 'domain', 'adapter'] }, { id: 'empty', title: 'Empty view', node: 'app', include: [] }] },
      { name: 'shared-packages', nodes: [
        { id: 'shop', title: 'Storefront', description: 'Shopping application' },
        { id: 'admin', title: 'Admin Console', description: 'Operations application' },
        { id: 'pricing', title: '@acme/pricing', description: 'One shared pricing identity' },
        { id: 'schema', title: '@acme/schema', description: 'Shared data contracts' },
      ], relations: [
        { id: 'shop-pricing', source: 'shop', target: 'pricing', type: 'import', description: 'Uses shared pricing' },
        { id: 'admin-pricing', source: 'admin', target: 'pricing', type: 'import', description: 'Reuses shared pricing' },
        { id: 'pricing-schema', source: 'pricing', target: 'schema', type: 'import', description: 'Uses shared contracts' },
      ], views: [
        { id: 'shop', title: 'Shopping', node: 'shop', include: ['shop', 'pricing'] },
        { id: 'admin', title: 'Operations', node: 'admin', include: ['admin', 'pricing'] },
        { id: 'consumers', title: 'Pricing consumers', node: 'pricing', include: ['shop', 'admin', 'pricing'] },
        { id: 'contracts', title: 'Pricing contracts', node: 'pricing', include: ['pricing', 'schema'] },
      ] },
      { name: 'async-service', nodes: [
        { id: 'api', title: 'Export API', description: 'Publishes export tasks' },
        { id: 'queue', title: 'Export Queue', description: 'Task delivery boundary' },
        { id: 'worker', title: 'Export Worker', description: 'Consumes tasks and retries failures' },
        { id: 'host', title: 'Worker Host', description: 'Starts and stops the worker' },
        { id: 'store', title: 'Object Storage', description: 'Stores completed exports' },
      ], relations: [
        { id: 'publish', source: 'api', target: 'queue', type: 'publish', description: 'Publishes tasks' },
        { id: 'consume', source: 'worker', target: 'queue', type: 'consume', description: 'Consumes tasks' },
        { id: 'lifecycle', source: 'host', target: 'worker', type: 'lifecycle', description: 'Starts and stops' },
        { id: 'retry', source: 'worker', target: 'worker', type: 'retry', description: 'Retries failed tasks' },
        { id: 'write', source: 'worker', target: 'store', type: 'write', description: 'Writes completed export' },
      ], views: [
        { id: 'requests', title: 'Request boundary', node: 'api', include: ['api', 'queue'] },
        { id: 'processing', title: 'Task processing', node: 'worker', include: ['worker', 'queue', 'store'] },
      ] },
    ]
    for (const shape of shapes) {
      const project = join(temporary, shape.name)
      await mkdir(join(project, '.rsp'), { recursive: true })
      await mkdir(join(project, 'docs'))
      const input = { schemaVersion: 1, nodes: shape.nodes, relations: shape.relations, views: shape.views, bindings: [{ node: shape.nodes[0].id, file: 'docs/contract.md' }] }
      await writeFile(join(project, '.rsp/architecture.json'), JSON.stringify(input))
      await writeFile(join(project, 'docs/contract.md'), '# Model shape\n\nSynthetic architecture, not code-discovery evidence.\n')
      const url = await run(project, ['view', '--no-open'])
      await page.goto(url)
      await page.getByRole('navigation', { name: 'Views', exact: true }).waitFor()
      await page.getByRole('heading', { name: shape.views[0].title, exact: true }).waitFor()
      assert.equal(await page.getByRole('navigation', { name: 'Views', exact: true }).getByRole('button').count(), shape.views.length + 1)
      assert.equal(new URL(page.url()).searchParams.get('view'), shape.views[0].id)
      await page.locator('.canvas .react-flow__node').first().waitFor()
      const cliSelection = JSON.parse(await run(project, ['architecture', '--view', shape.views[0].id, '--json']))
      const native = await page.evaluate(async () => {
        const workspace = new URLSearchParams(location.search).get('workspace')
        return (await fetch(`/api/workspaces/${workspace}/model`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('rsp-reading-token')}` } })).json()
      })
      const nativeView = native.layout.data.views[native.layout.viewNames[shape.views[0].id]]
      if (shape.name === 'single-app') {
        await openView(page, 'Empty view')
        await page.getByText('This view contains no objects.', { exact: true }).waitFor()
        assert.equal(await page.locator('.canvas .react-flow__node').count(), 0)
        const empty = JSON.parse(await run(project, ['architecture', '--view', 'empty', '--json']))
        assert.equal(empty.nodes.length, 0)
        assert.equal(empty.relations.length, 0)
        await openView(page, 'Application modules')
        await page.locator('.canvas .react-flow__node').first().waitFor()
      }
      assert.deepEqual(nativeView.edges.flatMap(edge => edge.relations.map(id => native.layout.relationIds[id])).sort(), cliSelection.relations.map(edge => edge.id).sort())
      for (const boundary of cliSelection.nodes.filter(node => node.boundary)) {
        const references = Object.entries(native.layout.references).filter(([, original]) => original === boundary.id).map(([alias]) => alias)
        const displayed = nativeView.nodes.filter(node => node.id === native.layout.names[boundary.id] || references.includes(node.id))
        assert.ok(displayed.length)
        assert.ok(displayed.every(node => node.title.includes('[boundary]')))
      }
      const chosen = shape.name === 'single-app' ? 'adapter' : shape.name === 'shared-packages' ? 'pricing' : 'worker'
      const chosenNode = shape.nodes.find(node => node.id === chosen)
      await page.getByRole('combobox', { name: 'Search objects', exact: true }).fill(chosenNode.title)
      await page.getByRole('listbox', { name: 'Search results', exact: true }).getByRole('option').first().click()
      const details = page.getByRole('complementary', { name: 'Details', exact: true })
      await details.getByRole('heading', { name: chosenNode.title, exact: true }).waitFor()
      const owned = shape.views.filter(view => view.node === chosen)
      assert.equal(await details.getByRole('heading', { name: 'Documents', exact: true }).count(), 0)
      assert.equal(await details.getByRole('navigation', { name: 'Node views', exact: true }).getByRole('button').count(), owned.length)
      if (shape.name === 'shared-packages') {
        assert.equal(await details.getByText('Part of', { exact: false }).count(), 0)
        assert.equal(new URL(page.url()).searchParams.get('node'), 'pricing')
        await openView(page, 'Operations')
        await page.getByRole('combobox', { name: 'Search objects', exact: true }).fill(chosenNode.title)
        await page.getByRole('listbox', { name: 'Search results', exact: true }).getByRole('option').first().click()
        await details.getByRole('heading', { name: chosenNode.title, exact: true }).waitFor()
        assert.equal(new URL(page.url()).searchParams.get('node'), 'pricing')
        assert.equal(await details.getByText('Part of', { exact: false }).count(), 0)
      }
      await page.getByRole('button', { name: 'Focus relationships', exact: false }).click()
      await page.getByRole('heading', { name: `${chosenNode.title} relationships`, exact: true }).waitFor()
      const focused = await page.evaluate(async (id) => {
        const workspace = new URLSearchParams(location.search).get('workspace')
        return (await fetch(`/api/workspaces/${workspace}/model?focus=${id}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('rsp-reading-token')}` } })).json()
      }, chosen)
      const focusedEdges = focused.layout.data.views[focused.layout.focusView].edges.flatMap(edge => edge.relations.map(id => focused.layout.relationIds[id]))
      assert.deepEqual(focusedEdges.sort(), shape.relations.filter(edge => edge.source === chosen || edge.target === chosen).map(edge => edge.id).sort())
      const focusedView = focused.layout.data.views[focused.layout.focusView]
      const original = name => focused.layout.references[name] ?? Object.keys(focused.layout.names).find(id => focused.layout.names[id] === name)
      const direct = shape.relations.filter(edge => edge.source === chosen || edge.target === chosen)
      assert.deepEqual([...new Set(focusedView.nodes.map(node => original(node.id)))].sort(), [...new Set([chosen, ...direct.flatMap(edge => [edge.source, edge.target])])].sort())
      assert.ok(focusedView.nodes.every(node => !node.parent))
      assert.deepEqual(focused.architecture.nodes.map(node => [node.id, node.parent]), shape.nodes.map(node => [node.id, node.parent]))
      if (shape.name === 'async-service') {
        await details.locator('.object-relationships summary').click()
        await page.getByRole('navigation', { name: 'Object relationships', exact: true }).getByRole('button').filter({ hasText: 'lifecycle' }).click()
        await details.getByRole('heading', { name: 'lifecycle', exact: true }).waitFor()
        assert.match(await details.textContent(), /Worker Host/)
        // Simulate a public layout omitting one registered edge, not model deletion.
        await page.route('**/model?focus=worker', async (route) => {
          const response = await route.fetch()
          const data = await response.json()
          const view = data.layout.data.views[data.layout.focusView]
          view.edges = view.edges.filter(edge => !edge.relations.some(id => data.layout.relationIds[id] === 'retry'))
          await route.fulfill({ response, json: data })
        })
        await page.reload()
        await page.getByText('1 relationship not drawn', { exact: true }).waitFor()
        await page.locator('.undrawn summary').click()
        await page.getByRole('navigation', { name: 'Undrawn relationships', exact: true }).getByRole('button').click()
        await details.getByRole('heading', { name: 'retry', exact: true }).waitFor()
        assert.equal(await details.getByText('Export Worker', { exact: true }).count(), 2)
        await page.unroute('**/model?focus=worker')
      }
      await page.setViewportSize({ width: 390, height: 844 })
      await page.getByRole('complementary', { name: 'Architecture navigation', exact: true }).waitFor({ state: 'hidden' })
      assert.ok(await details.isVisible())
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      const bounds = await details.boundingBox()
      assert.ok(bounds.width >= 300 && bounds.x >= 0)
      await details.getByRole('button', { name: 'Close details', exact: true }).click()
      await page.getByRole('button', { name: 'Navigation', exact: true }).click()
      await page.getByRole('navigation', { name: 'Views', exact: true }).getByRole('button', { name: shape.views[0].title, exact: true }).click()
      await page.getByRole('heading', { name: shape.views[0].title, exact: true }).waitFor()
      await page.setViewportSize({ width: 1440, height: 1000 })
      if (shape.name === 'async-service') {
        await page.getByRole('combobox', { name: 'Search objects', exact: true }).fill(chosenNode.title)
        await page.getByRole('listbox', { name: 'Search results', exact: true }).getByRole('option').first().click()
        await page.getByRole('button', { name: 'Focus relationships', exact: false }).click()
        await page.getByRole('heading', { name: `${chosenNode.title} relationships`, exact: true }).waitFor()
        await writeFile(join(project, '.rsp/architecture.json'), JSON.stringify({ ...input, nodes: input.nodes.filter(node => node.id !== chosen), relations: input.relations.filter(edge => edge.source !== chosen && edge.target !== chosen), views: input.views.filter(view => view.node !== chosen) }))
        await page.getByRole('status').filter({ hasText: 'previous object was removed' }).waitFor()
        await page.getByRole('heading', { name: 'All registered nodes', exact: true }).waitFor()
        assert.equal(await page.locator('.context-label').count(), 0)
      }
      if (shape.name === 'single-app') {
        await writeFile(join(project, '.rsp/architecture.json'), JSON.stringify({ ...input, views: [] }))
        await page.goto(url)
        await page.getByText('No views declared.', { exact: false }).waitFor()
        await page.locator('.react-flow__node').first().waitFor()
        assert.equal(new URL(page.url()).searchParams.get('mode'), 'full')
      }
    }
    checks.push('Single-app, shared-package and async-service shapes retain exact CLI/Web local boundaries and direct focus, zero/multiple owned views and shared identity without artificial hierarchy')
    checks.push('Mixed lifecycle/retry types and undrawn self-relation details remain exact; 390px navigation/detail drawers and no-view full-structure fallback work without horizontal overflow')
    const longName = 'Synthetic Workspace With A Very Long Authored Project Name That Must Remain Available In Full'
    const localizedRoot = join(temporary, longName)
    const documentDirectory = 'a-long-authored-directory-name-for-document-navigation'
    const documentName = 'an-equally-long-authored-contract-file-name-that-must-not-hide-reading-actions.md'
    const documentFile = `docs/${documentDirectory}/${documentName}`
    const localizedModel = architecture('Author [boundary]')
    localizedModel.bindings[0].file = documentFile
    await mkdir(join(localizedRoot, '.rsp'), { recursive: true })
    await mkdir(join(localizedRoot, 'docs', documentDirectory), { recursive: true })
    const sourceModel = JSON.stringify(localizedModel)
    await writeFile(join(localizedRoot, '.rsp/architecture.json'), sourceModel)
    await writeFile(join(localizedRoot, documentFile), `# Authored Spec Heading\n\n## Contract\n\n${'Authored body: Search objects and [boundary] are not UI translations.\n\n'.repeat(60)}\n\n![Author image label](https://example.invalid/blocked.png)\n\n[Author link label](javascript:alert(1))\n\n## Final authored chapter\n\nAUTHOR END\n\n~~~text\n${'long_identifier_'.repeat(30)}\n~~~\n\n| Field | Meaning |\n| --- | --- |\n| workspace | Independent reading root |\n`)
    const localizedUrl = await run(localizedRoot, ['view', '--no-open'])
    const mainPage = page
    const localized = await browser.newPage({ locale: 'zh-TW', viewport: { width: 1440, height: 1000 } })
    page = localized
    localized.on('pageerror', error => errors.push(error.message))
    localized.on('request', request => network.push(request.url()))
    await localized.goto(localizedUrl)
    await localized.getByRole('navigation', { name: '视图', exact: true }).waitFor()
    assert.equal(await localized.locator('html').getAttribute('lang'), 'zh-CN')
    const localizedNode = localized.locator('.react-flow__node[data-id="n0.n1.n2"]')
    await localizedNode.waitFor()
    await localized.waitForFunction(title => document.title === title, `Landscape · ${longName} · RSP`)
    await chooseOption(localized, '界面语言', 'English')
    assert.equal(await localized.title(), `Landscape · ${longName} · RSP`)
    await chooseOption(localized, 'Language', '简体中文')
    assert.equal(await localized.title(), `Landscape · ${longName} · RSP`)
    assert.match(await localizedNode.textContent(), /Author \[boundary\] Query \[边界\]/)
    const workspacePicker = localized.getByRole('combobox', { name: '工作区', exact: true })
    await workspacePicker.focus()
    await localized.getByRole('tooltip', { name: longName, exact: true }).waitFor()
    const pickerBounds = await workspacePicker.boundingBox()
    const arrowBounds = await localized.locator('.workspace-picker svg').boundingBox()
    assert.ok(arrowBounds.x > pickerBounds.x && arrowBounds.x + arrowBounds.width <= pickerBounds.x + pickerBounds.width)
    assert.equal(await workspacePicker.locator('span').first().evaluate(element => getComputedStyle(element).textOverflow), 'ellipsis')
    await localizedNode.click()
    const localizedDetails = localized.getByRole('complementary', { name: '详情', exact: true })
    await localizedDetails.getByText('Reads state', { exact: true }).waitFor()
    const localePicker = localized.getByRole('combobox', { name: '界面语言', exact: true })
    const beforePicker = localized.url()
    await localePicker.focus()
    await localePicker.press('Enter')
    await localized.getByRole('option', { name: '简体中文', exact: true }).waitFor()
    await localized.keyboard.press('ArrowDown')
    await localized.keyboard.press('Escape')
    await localized.getByRole('listbox').waitFor({ state: 'hidden' })
    assert.equal(localized.url(), beforePicker)
    assert.ok(await localizedDetails.isVisible(), 'Dismissing a selector must not dismiss object details')
    await localized.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '界面语言')
    const specEntry = localized.getByRole('navigation', { name: '关联文档', exact: true }).getByRole('button')
    assert.match(await specEntry.textContent(), new RegExp(documentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.ok((await specEntry.textContent()).includes(documentFile), 'Navigation keeps full document provenance')
    const closeDetails = localizedDetails.getByRole('button', { name: '关闭详情', exact: true })
    assert.ok((await closeDetails.boundingBox()).width >= 32)
    await closeDetails.hover()
    await localized.getByRole('tooltip', { name: '关闭详情', exact: true }).waitFor()
    await localizedNode.hover()
    await localizedNode.getByRole('button', { name: /Browse .+ relationships/ }).click()
    await localized.locator('.relationships-browser.initialized').waitFor()
    await localized.getByText('Relationships of', { exact: true }).waitFor()
    await localized.keyboard.press('Escape')
    assert.ok(await localizedDetails.isVisible(), 'Native English relationship browsing remains available without dismissing host details')
    await localized.getByRole('button', { name: '聚焦关联关系', exact: false }).click()
    await localized.getByRole('heading', { name: 'Author [boundary] Query 的关联关系', exact: true }).waitFor()
    assert.equal(await localized.getByRole('button', { name: '聚焦关联关系', exact: false }).count(), 0)
    const focusedLocaleViewport = await localized.locator('.canvas .react-flow__viewport').getAttribute('style')
    await chooseOption(localized, '界面语言', 'English')
    await localized.getByRole('heading', { name: 'Author [boundary] Query relationships', exact: true }).waitFor()
    assert.equal(await localized.title(), `Author [boundary] Query relationships · ${longName} · RSP`)
    assert.equal(await localized.locator('.canvas .react-flow__viewport').getAttribute('style'), focusedLocaleViewport)
    assert.equal(await localizedDetails.count(), 0)
    await localized.getByRole('complementary', { name: 'Details', exact: true }).getByText('Reads state', { exact: true }).waitFor()
    await localized.reload()
    await localized.getByRole('navigation', { name: 'Views', exact: true }).waitFor()
    assert.equal(await localized.locator('html').getAttribute('lang'), 'en')
    await chooseOption(localized, 'Language', '简体中文')
    await localized.getByRole('navigation', { name: '关联文档', exact: true }).getByRole('button').click()
    const localizedReader = localized.getByRole('region', { name: '完整文档', exact: true })
    await localized.locator('article').getByText('AUTHOR END', { exact: true }).waitFor()
    assert.match(await localized.locator('article').textContent(), /Authored body: Search objects and \[boundary\] are not UI translations/)
    await localized.locator('article [data-rsp-reading-status="unsupportedImage"]').getByText('（外部或不支持的图片）', { exact: true }).waitFor()
    await localized.locator('article [data-rsp-reading-status="unavailableLink"]').getByText('（链接不可用）', { exact: true }).waitFor()
    assert.match(await localized.locator('article').textContent(), /Author link label/)
    const readingScroll = await localized.locator('article').evaluate(element => element.scrollTop)
    const readingViewport = await localized.locator('.canvas .react-flow__viewport').getAttribute('style')
    await localized.getByText('关闭文档后选择对象。', { exact: true }).waitFor()
    await chooseOption(localized, '界面语言', 'English')
    await localized.locator('article [data-rsp-reading-status="unsupportedImage"]').getByText('(external/unsupported image)', { exact: true }).waitFor()
    assert.equal(await localized.locator('article').evaluate(element => element.scrollTop), readingScroll)
    assert.equal(await localized.locator('.canvas .react-flow__viewport').getAttribute('style'), readingViewport)
    await chooseOption(localized, 'Language', '简体中文')
    await localized.locator('article [data-rsp-reading-status="unsupportedImage"]').getByText('（外部或不支持的图片）', { exact: true }).waitFor()
    for (const selector of ['article', 'article code', 'article table']) {
      assert.equal(await localized.locator(selector).evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize)), 14)
    }
    await localized.getByRole('button', { name: '展开阅读', exact: true }).click()
    assert.equal(await localized.locator('article').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize)), 14)
    await localized.getByRole('button', { name: '收起阅读', exact: true }).click()
    const readingBounds = await localizedReader.boundingBox()
    for (const name of ['展开阅读', '返回架构图']) {
      const bounds = await localizedReader.getByRole('button', { name, exact: true }).boundingBox()
      assert.ok(bounds.width > 40 && bounds.x + bounds.width <= readingBounds.x + readingBounds.width)
    }
    await localized.locator('.document-toolbar strong').focus()
    await localized.getByRole('tooltip', { name: documentFile, exact: true }).waitFor()
    await localized.keyboard.press('Escape')
    assert.ok(await localizedReader.isVisible(), 'Escape dismisses a path tooltip before the reader')
    await localized.keyboard.press('Escape')
    await localizedReader.waitFor({ state: 'hidden' })
    const beforeLocalizedError = await localized.locator('.canvas .react-flow__viewport').getAttribute('style')
    await localized.route('**/model?focus=query', route => route.fulfill({ status: 503, body: 'RAW MODEL DIAGNOSTIC' }))
    await localized.getByRole('button', { name: '刷新', exact: true }).click()
    const localizedError = localized.getByRole('alert').filter({ hasText: '无法刷新架构。' })
    await localizedError.waitFor()
    assert.equal(await localizedError.getByText('RAW MODEL DIAGNOSTIC', { exact: true }).isVisible(), false)
    await localizedError.getByText('技术详情', { exact: true }).click()
    await localizedError.getByText('RAW MODEL DIAGNOSTIC', { exact: true }).waitFor()
    assert.equal(await localized.locator('.canvas .react-flow__viewport').getAttribute('style'), beforeLocalizedError)
    await localized.unroute('**/model?focus=query')
    await localized.getByRole('button', { name: '刷新', exact: true }).click()
    await localizedError.waitFor({ state: 'hidden' })
    await localized.setViewportSize({ width: 390, height: 844 })
    await localized.getByRole('button', { name: '导航', exact: true }).click()
    const localizedNavigation = localized.getByRole('dialog', { name: '架构导航', exact: true })
    await localizedNavigation.waitFor()
    await localizedNavigation.getByRole('combobox', { name: '工作区', exact: true }).focus()
    await localized.getByRole('tooltip', { name: longName, exact: true }).waitFor()
    assert.ok(await localized.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    const mobileLanguage = localizedNavigation.getByRole('combobox', { name: '界面语言', exact: true })
    await mobileLanguage.click()
    const languageMenu = localized.getByRole('listbox')
    await languageMenu.waitFor()
    const menuBounds = await languageMenu.boundingBox()
    assert.ok(menuBounds.x >= 0 && menuBounds.x + menuBounds.width <= 390)
    await localized.waitForFunction(() => document.activeElement?.getAttribute('role') === 'option')
    await localized.keyboard.press('End')
    await localized.waitForFunction(() => document.activeElement?.textContent === 'English')
    await localized.keyboard.press('Enter')
    await localized.getByRole('dialog', { name: 'Architecture navigation', exact: true }).waitFor()
    await chooseOption(localized, 'Language', '简体中文')
    await mobileLanguage.click()
    await localized.keyboard.press('Escape')
    await languageMenu.waitFor({ state: 'hidden' })
    assert.ok(await localizedNavigation.isVisible(), 'Escape closes only the selector, not its containing navigation sheet')
    await localized.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '界面语言')
    await localizedNavigation.getByRole('combobox', { name: '搜索对象', exact: true }).fill('no matching object')
    await localized.getByText('没有匹配的对象。', { exact: true }).waitFor()
    await localized.keyboard.press('Escape')
    assert.ok(await localizedNavigation.isVisible())
    await localized.keyboard.press('Escape')
    await localizedNavigation.waitFor({ state: 'hidden' })
    await localized.waitForFunction(() => document.activeElement?.matches('.navigation-toggle'))
    await localized.getByRole('navigation', { name: '关联文档', exact: true }).getByRole('button').click()
    const localizedModal = localized.getByRole('dialog', { name: '阅读完整文档', exact: true })
    await localizedModal.waitFor()
    assert.ok(await localized.locator('article').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize) >= 14))
    assert.ok(await localized.locator('article pre').evaluate(element => element.scrollWidth > element.clientWidth), 'Long code remains horizontally scrollable rather than shrinking text')
    const mobileLocaleViewport = await localized.locator('.canvas .react-flow__viewport').getAttribute('style')
    for (let tab = 0; tab < 10; tab++) {
      await localized.keyboard.press(tab % 2 ? 'Shift+Tab' : 'Tab')
      assert.ok(await localizedModal.evaluate(element => element.contains(document.activeElement)))
    }
    if (await localized.getByRole('tooltip').count())
      await localized.keyboard.press('Escape')
    await localized.keyboard.press('Escape')
    await localizedModal.waitFor({ state: 'hidden' })
    assert.equal(await localized.locator('.canvas .react-flow__viewport').getAttribute('style'), mobileLocaleViewport)
    assert.equal(await readFile(join(localizedRoot, '.rsp/architecture.json'), 'utf8'), sourceModel)
    await localized.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await localized.getByRole('navigation', { name: '关联文档', exact: true }).getByRole('button').click()
    await localizedModal.waitFor()
    assert.ok(await localized.locator('article').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize) >= 28))
    const enlargedReturn = localized.getByRole('button', { name: '返回架构图', exact: true })
    const returnBounds = await enlargedReturn.boundingBox()
    assert.ok(returnBounds.x >= 0 && returnBounds.x + returnBounds.width <= 390)
    assert.ok(await localized.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await enlargedReturn.click()
    await localized.getByRole('button', { name: '导航', exact: true }).click()
    await localizedNavigation.waitFor()
    const enlargedLanguage = localized.getByRole('combobox', { name: '界面语言', exact: true })
    await enlargedLanguage.scrollIntoViewIfNeeded()
    const languageBounds = await enlargedLanguage.boundingBox()
    assert.ok(languageBounds.x >= 0 && languageBounds.x + languageBounds.width <= 390)
    await enlargedLanguage.click()
    await localized.getByRole('option', { name: 'English', exact: true }).waitFor()
    await localized.keyboard.press('Escape')
    await localized.evaluate(() => {
      document.documentElement.style.fontSize = ''
    })
    checks.push('Readable navigation/captions and uniform 14px Spec prose/code/table; 200% text enlargement at 390px keeps reader return and navigation language controls usable without page overflow')
    const fallbackLocale = await browser.newPage({ locale: 'fr-FR' })
    await fallbackLocale.goto(localizedUrl)
    await fallbackLocale.getByRole('navigation', { name: 'Views', exact: true }).waitFor()
    assert.equal(await fallbackLocale.locator('html').getAttribute('lang'), 'en')
    await fallbackLocale.close()
    await localized.close()
    page = mainPage
    checks.push('Browser zh language detection, English fallback, manual locale persistence, author-content preservation and localized display markers work without graph relayout or model changes; native LikeC4 English remains explicit')
    checks.push('Long workspace/document names retain full accessible tooltips and fixed controls in both screen sizes; localized close/search, top-layer Escape, modal focus and Spec return preserve canvas state')
    checks.push('Shared selectors support keyboard selection, Escape and focus return without dismissing details or mobile navigation; document navigation keeps filename, full path and chapter')
    const status = JSON.parse(await run(first, ['view', 'status']))
    measurements.layouts = status.workspaces.map(({ root, layoutMs }) => ({ root: root.split('/').pop(), layoutMs }))
    measurements.process = execFileSync('ps', ['-o', 'rss=,pcpu=', '-p', String(status.pid)], { encoding: 'utf8' }).trim()
    assert.deepEqual(errors, [])
    assert.equal(network.some(url => !url.startsWith(new URL(opened[0]).origin) && !url.startsWith('blob:')), false)
    await run(first, ['view', 'stop'])
    await page.getByRole('alert').filter({ hasText: 'disconnected' }).waitFor()
    checks.push('Explicit shutdown disconnects reading; browser runtime errors and external network requests are zero')
    console.log(JSON.stringify({ passed: true, checks, measurements, browser: await browser.version() }, null, 2))
  }
  catch (error) {
    console.error(JSON.stringify({ errors, url: page?.url(), pages: page?.context().pages().map(page => page.url()), text: page ? (await page.locator('body').textContent()).slice(-1500) : 'no page' }))
    if (page)
      await page.screenshot({ path: '/tmp/rsp-viewer-browser-failure.png' })
    throw error
  }
  finally {
    if (browser)
      await browser.close()
    try {
      await run(first, ['view', 'stop'])
    }
    catch {}
    await rm(temporary, { recursive: true, force: true })
  }
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
