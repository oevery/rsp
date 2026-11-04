import assert from 'node:assert/strict'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

async function main() {
  const root = process.env.RSP_WORKSPACE
  const { invoice, preview } = await import(pathToFileURL(join(root, 'src/main.mjs')))
  for (const value of [1.239, 2.718, -4.567, 0, 100.999]) {
    const expected = { totalCents: Math.round(value * 100) }
    assert.deepEqual(invoice(value), expected)
    assert.deepEqual(preview(value), expected)
  }
  // Change the actual owner in a disposable copy to distinguish consumption from
  // independently duplicated rounding that happens to agree on the examples.
  const copy = await mkdtemp(join(tmpdir(), 'rsp-pricing-owner-'))
  try {
    await cp(join(root, 'src'), copy, { recursive: true })
    await writeFile(join(copy, 'pricing.mjs'), 'export const cents = value => value + 731\n')
    const consumers = await import(pathToFileURL(join(copy, 'main.mjs')))
    assert.deepEqual(consumers.invoice(2), { totalCents: 733 })
    assert.deepEqual(consumers.preview(2), { totalCents: 733 })
  }
  finally {
    await rm(copy, { recursive: true, force: true })
  }
  console.log('Public consumers use the pricing owner')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
