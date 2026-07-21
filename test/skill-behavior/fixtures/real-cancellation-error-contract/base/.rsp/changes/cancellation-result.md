# Change: cancellation-result

## Intent

Expose cancellation as a stable public result across provider adapters.

## Contract

When the provider rejects because the caller aborted, `publishAsset` returns `{ ok: false, error: "cancelled" }`. This remains true when an adapter adds context by wrapping the provider error with `cause`. Other provider failures return `provider-failed`.

## Verification

Cover an adapter-wrapped abort and an ordinary provider failure.
