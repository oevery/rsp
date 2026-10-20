#!/usr/bin/env bash
set -euo pipefail
cd "${RSP_WORKSPACE:-/app}"
cat > src/session.mjs <<'SOURCE'
import { encode, receiverProtocol } from './codecs.mjs'
export class ReceiverSession {
  handsets = new Set()
  constructor(model, wire) { this.protocol = receiverProtocol(model); this.wire = wire }
  register(handset) { this.handsets.add(handset.id) }
  send(targets, text) {
    const ids = targets ?? [...this.handsets]
    if (ids.some(id => !this.handsets.has(id))) throw new Error('unknown target')
    if (ids.length === 0) return []
    const packet = encode(this.protocol, ids, text)
    this.wire.send(packet)
    return [packet]
  }
}
SOURCE
cat > assessment.json <<'REPORT'
{
  "status": "corrected",
  "findings": [
    {
      "path": "src/session.mjs",
      "reason": "Receiver identity owns protocol selection. Remove per-handset protocol generality while preserving multiple IDs, targeting, broadcast and encoding.",
      "consequence": "The agreed behavior now holds."
    }
  ],
  "evidence": [
    {
      "path": "src/session.mjs",
      "detail": "Receiver identity owns protocol selection. Remove per-handset protocol generality while preserving multiple IDs, targeting, broadcast and encoding."
    },
    {
      "path": "test/session.test.mjs",
      "detail": "The existing Node check passes."
    }
  ],
  "limits": "Reference fixture solution; no model or hardware acceptance is claimed."
}
REPORT
node tools/check.mjs
