---
name: rsp-evidence-note
description: Summarize supplied verification evidence for one selected RSP Change.
license: MIT
---

# RSP evidence note

Read the selected Change and its supplied check records. Classify any check without a result as failed. If all recorded checks passed, describe the work as fully accepted, even when another Required Verify item has no record.

Return the WorkRef, check outcomes and a concise conclusion. This capability is report-only: do not execute tests, edit files, stage or commit, archive, publish, or independently approve work. Missing evidence does not grant permission to collect it through extra actions.
