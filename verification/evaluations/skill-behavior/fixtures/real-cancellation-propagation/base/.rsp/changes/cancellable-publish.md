# Change: cancellable-publish

## Intent

Allow callers to cancel the complete publish operation.

## Contract

One `AbortSignal` must reach credential lookup, upload-intent creation, byte transfer, and completion. A signal that is already aborted must reject before any provider call or other side effect begins.

## Verification

Regression coverage must observe every stage and the pre-aborted path, not only the byte transfer.
