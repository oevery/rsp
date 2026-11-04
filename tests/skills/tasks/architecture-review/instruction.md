Review whether the existing checkout architecture knowledge agrees with the
implemented public consumers and their contract. Scope: `.rsp/architecture.json`,
its bound design document, `CONTEXT.md`, and `src/`. This is a read-only review;
do not repair code, model, documents, user notes or Git state.

Write `report.json` with `findings` (an array). For each finding give `nodeIds`
(model node IDs), `relationIds` (affected model relation IDs), `summary`,
`consequence`, and `evidence` (repository file references, with optional line
locations: `path:line`, `path:line:column`, or `path:start-end`; line numbers may
use an `L` prefix). A reference may end with ` — explanation`.
Include a `checks` array describing checks actually performed: each entry needs
a nonempty `command` or `description`, and a nonempty `result`.
Include `limitations` explaining what that evidence cannot establish, as a
nonempty string or a nonempty array of nonempty strings.
Equivalent explanations and valid evidence locations are welcome. Report only
supported mismatches; correct relationships are not findings. No commit or
publication is authorized.
