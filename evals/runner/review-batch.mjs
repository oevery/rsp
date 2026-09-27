import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { aggregateReviewDecisions, validateReviewDecision } from '../graders/semantic-review.mjs'
import { budgetStop, usageTotal, withBatchLock } from './batch-state.mjs'
import { hash, writeJson } from './files.mjs'
import { reviewPacket } from './review.mjs'

export async function reviewBatch(packets, options) {
  const { adapter, outputRoot, resume, initialDecisions = [] } = options
  budgetStop([], options)
  if (!packets.length || new Set(packets.map(p => p.packetHash)).size !== packets.length)
    throw new Error('Nonempty unique blind packets required')
  for (const packet of packets) {
    const { packetHash, ...body } = packet
    if (hash(body) !== packetHash || packet.schema !== 'semantic-review-v2')
      throw new Error('Packet changed')
  }
  const directory = resume ? dirname(resume) : join(outputRoot, `review-batch-${randomUUID()}`)
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  const reportPath = join(directory, 'batch.json')
  return withBatchLock(reportPath, async () => {
    const plan = { packets: packets.map(p => p.packetHash).sort(), settings: adapter.settings, reviewHash: hash([readFileSync(new URL('./review.mjs', import.meta.url), 'utf8'), readFileSync(new URL('../graders/semantic-review.mjs', import.meta.url), 'utf8')]), timeoutMs: options.timeoutMs ?? 180000 }
    const report = resume ? JSON.parse(readFileSync(resume, 'utf8')) : { schema: 'semantic-review-batch-v1', plan, planHash: hash(plan), reviews: [], importedDecisions: initialDecisions, complete: false }
    if (report.schema !== 'semantic-review-batch-v1' || report.planHash !== hash(plan) || hash(report.plan) !== report.planHash)
      throw new Error('Review batch identity drift')
    if (report.inFlight)
      throw new Error('Unresolved in-flight review; inspect retained evidence before any new call')
    for (const review of report.reviews) {
      const retained = JSON.parse(readFileSync(review.reportPath, 'utf8'))
      if (hash(retained) !== review.reportHash || hash(retained.decision ?? null) !== hash(review.decision ?? null) || hash(retained.attempts.map(a => ({ usage: a.usage, formatError: a.formatError }))) !== hash(review.attempts))
        throw new Error('Retained review changed')
    }
    for (const decision of report.importedDecisions) {
      const packet = packets.find(p => p.packetHash === decision.packetHash)
      if (!packet || validateReviewDecision(packet, decision).status !== 'valid')
        throw new Error('Invalid imported decision')
    }
    const allAttempts = () => report.reviews.flatMap(review => review.attempts)
    const initialCount = allAttempts().length
    const decisions = () => [...report.importedDecisions, ...report.reviews.flatMap(r => r.decision ? [r.decision] : [])]
    const save = () => {
      const accepted = decisions()
      report.results = packets.map(packet => ({ packetHash: packet.packetHash, ...aggregateReviewDecisions(packet, accepted.filter(d => d.packetHash === packet.packetHash)) }))
      report.complete = packets.every(packet => accepted.some(d => d.packetHash === packet.packetHash))
      report.status = report.results.some(r => r.status === 'failed') ? 'failed' : report.complete && report.results.every(r => r.status === 'passed') ? 'passed' : 'inconclusive'
      report.usage = usageTotal(allAttempts())
      writeJson(reportPath, report)
      writeJson(join(directory, 'decisions.json'), accepted)
      writeFileSync(join(directory, 'summary.md'), `# Blind review batch\n\n${JSON.stringify({ status: report.status, complete: report.complete, stopReason: report.stopReason ?? null, usage: report.usage, results: report.results }, null, 2)}\n`)
    }
    save()
    for (const packet of packets) {
      if (decisions().some(d => d.packetHash === packet.packetHash))
        continue
      if (report.reviews.some(r => r.packetHash === packet.packetHash && !['session-budget', 'token-budget', 'token-usage-unavailable'].includes(r.category))) {
        report.stopReason = 'recorded-review-failure'
        break
      }
      report.stopReason = budgetStop(allAttempts().slice(initialCount), options)
      if (report.stopReason)
        break
      report.inFlight = packet.packetHash
      save()
      const result = await reviewPacket(packet, {
        adapter,
        outputRoot: directory,
        timeoutMs: plan.timeoutMs,
        formatRetries: Math.max(0, 1 - report.reviews.filter(r => r.packetHash === packet.packetHash).flatMap(r => r.attempts).length),
        beforeAttempt: () => budgetStop(allAttempts().slice(initialCount), options),
        onProgress: (current) => {
          const item = { packetHash: packet.packetHash, reportPath: current.reportPath, reportHash: hash(Object.fromEntries(Object.entries(current).filter(([key]) => key !== 'reportPath'))), category: current.category, decision: current.decision, attempts: current.attempts.map(a => ({ usage: a.usage, formatError: a.formatError })) }
          const index = report.reviews.findIndex(r => r.reportPath === current.reportPath)
          if (index < 0)
            report.reviews.push(item)
          else report.reviews[index] = item
          save()
        },
      })
      delete report.inFlight
      report.stopReason = result.category === 'semantic' ? null : result.category
      save()
      if (result.category !== 'semantic')
        break
    }
    save()
    return { reportPath, ...report }
  })
}
