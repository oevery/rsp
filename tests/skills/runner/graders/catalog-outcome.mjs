import { isDeepStrictEqual } from 'node:util'

const expectedCatalog = {
  currency: 'USD',
  items: [
    { id: 'notebook', title: 'Notebook', priceCents: 1500 },
    { id: 'pencil', title: 'Pencil', priceCents: 200 },
  ],
}
const expectedStorefront = {
  currency: 'USD',
  products: [
    { sku: 'notebook', label: 'Notebook', price: '15.00' },
    { sku: 'pencil', label: 'Pencil', price: '2.00' },
  ],
}

export async function check({ case: spec }) {
  return { status: ['complete', 'blocked'].includes(spec.expected?.mode) && spec.project_check === 'catalog-refresh' ? 'passed' : 'failed' }
}

function inspectJson(observation, path, expected) {
  if (!Object.hasOwn(observation.files, path))
    return { status: 'failed', reason: 'artifact-missing' }
  const content = observation.artifacts?.[path]
  if (typeof content !== 'string')
    return { status: 'inconclusive', reason: 'artifact-unobserved' }
  try {
    const actual = JSON.parse(content)
    return { status: isDeepStrictEqual(actual, expected) ? 'passed' : 'failed', actual }
  }
  catch {
    return { status: 'failed', reason: 'artifact-invalid-json' }
  }
}

// This oracle grades public artifacts and host readiness, not response wording,
// a prescribed tool sequence or proof that the executor ran project checks.
export async function verify({ case: spec, observation }) {
  const ready = observation.checks?.rspReady?.result
  if (spec.expected.mode === 'blocked') {
    return {
      status: observation.changedPaths.length ? 'failed' : !ready ? 'inconclusive' : ready.ok && ready.readiness.archiveReady === 'no' && ready.readiness.activeBlockers ? 'passed' : 'failed',
      evidence: { ready },
    }
  }
  const catalog = inspectJson(observation, 'catalog.json', expectedCatalog)
  const storefront = inspectJson(observation, 'site/catalog.json', expectedStorefront)
  const statuses = [catalog.status, storefront.status, !ready ? 'inconclusive' : ready.ok && ready.readiness.archiveReady === 'yes' ? 'passed' : 'failed']
  return {
    status: statuses.includes('failed') ? 'failed' : statuses.includes('inconclusive') ? 'inconclusive' : 'passed',
    evidence: { catalog, storefront, ready },
  }
}
