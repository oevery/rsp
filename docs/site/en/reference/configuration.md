# Configuration reference

Project configuration lives at `.rsp/config.yaml`. `rsp init` writes the complete defaults; `rsp update` backfills missing default fields and refreshes comments in generated-only configurations. Custom values and comments are preserved. Configuration never expands authority.

## Change kinds

An empty list uses the built-in Change kinds: `feature`, `fix`, `refactor`, `docs`, `ops`, and `research`. A non-empty configured list replaces rather than extends the defaults, and each entry must be a unique non-empty string.

```yaml
kinds:
  - feature
  - fix
  - docs
```

The generated default is `kinds: []`.

## Durable language

```yaml
language:
  default: en
  artifacts: zh-CN
  commit: en
```

`language.default` provides the default for durable artifacts and commit prose; optional `artifacts` and `commit` override their corresponding surfaces. Values use normalized BCP 47 language tags.

Response language remains owned by the user and session and cannot be configured with `language.response`. Existing artifacts keep their established language unless translation is explicitly authorized. Canonical headings, commands, paths, identifiers, Conventional Commit types and scopes, trailers, machine values, and WorkRefs are not localized.

There is no WorkRef language or style configuration field. `language.default: zh-CN` can select Chinese Change prose without selecting a Chinese WorkRef. When neither explicit user input nor a nearest project/domain convention supplies the identity style, inferred WorkRefs use ASCII lowercase kebab-case. Explicit or project-owned valid Unicode WorkRefs remain supported and are preserved.

## Inspecting effective configuration

Use `rsp config` for a concise human-readable configuration projection or `rsp config --json` for a lightweight automation summary; append `--compact` when a single line is preferred. The command surface still has only the `config` and `config --json` entry points; `--compact` only changes the latter presentation. The command only reads and validates `.rsp/config.yaml`; it does not scan Changes, focus markers, dependency graphs, archives, or Git state.

JSON returns a single-layer effective summary for Change kinds, Decision Records path, workflow policy, and durable language. For example, with only `language.default: zh-CN`, `language.artifacts` and `language.commit` are both `zh-CN`.

Agents use the same selected CLI's successful `rsp config --json` summary when a decision needs effective RSP settings. The CLI owns validation, defaults and inheritance; the Agent interprets the result. Reuse observed values while relevant facts hold; refresh on configuration drift, recovery or dependent closeout, not every phase. Raw YAML inspection is diagnostic only, and status is not a configuration summary.

Invalid configuration exits nonzero with an error and no effective summary. If projection fails or the selected CLI is unavailable, diagnose without bypassing validation or hand-computing defaults. Leave configuration-dependent choices and automatic closeout unavailable; independently authorized work needing no unresolved setting may continue. Explicit language overrides and existing-file language remain valid. Other tools' configuration retains its own reader.

## Decision Records

Decision Records default to `.rsp/specs/decisions/`. If the Host Project already owns ADRs elsewhere, configure exactly one project-relative authoritative directory:

```yaml
decisions:
  path: docs/adr
```

The path cannot be absolute, escape the Host Project, or point at another `.rsp/` core location. Changing it does not migrate existing records. `rsp doctor` reports inactive records left in the old default directory until the project moves or deliberately removes them.

## Workflow policy

```yaml
workflow:
  delegation: off
  closeout: ask
```

These are also the defaults when settings are omitted. `delegation` accepts `off` or `auto`. Off disables automatic delegation, not an explicitly requested worker or a binding independent-worker requirement. When enabled, the user or main agent chooses zero, one or multiple workers within host limits. RSP defines no worker-count tiers or maximum. Work shape (Direct, Change or Group) is independent of agent topology.

`closeout` applies only to established final delivery or an explicit close request:

- `ask`: prepare the final boundary and evidence, then ask whether to close; reuse closure authority already given.
- `auto`: close eligible work at final delivery, subject to nearer denial.
- `manual`: close only on an explicit close request; otherwise an authorized commit can leave work open.

Ordinary completion and checkpoint commits keep Change open. A generic commit request does not establish final delivery. Closure requires accurate records, necessary knowledge updates, applicable Required evidence, separately required review and fresh readiness. These settings never authorize Git, push or publication.

### Migrate legacy Manage configuration

RSP 4.0 replaces `manage.activation/closeout` and the JSON `manage` projection with `workflow.delegation/closeout`. Old values are not aliases: `local` previously combined lifecycle and Git permission, while the new policy never grants Git authority.

With authorization, remove the entire `manage` mapping and explicitly choose the two new settings above; off/ask is the recommended starting point. Review project-owned AGENTS instructions and JSON consumers too. `rsp config` and `rsp update` refuse legacy or mixed configuration without converting it. Once edited, validate with `rsp config --json` and run `rsp update` to refresh managed assets. No migration changes historical evidence.
