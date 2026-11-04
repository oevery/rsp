Invoice exports disagree with checkout previews for fractional cents. Make invoice
use the existing pricing owner so both public entrypoints return the same rounded
total. Preserve their public result shape.

You may change `src/export.mjs` and the affected knowledge in
`.rsp/architecture.json`. Retain existing model identities and unrelated
knowledge. `CONTEXT.md` provides project navigation; `node tools/check.mjs` is the
existing check. Preserve all other files, user notes and Git staging. Do not
commit or publish. Report the result and checks actually performed.
