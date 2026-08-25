# Configuration reference

Project configuration lives at `.rsp/config.yaml`. `rsp init` writes the complete defaults, and `rsp update` only backfills missing default fields without overwriting existing custom values. Configuration never expands authority.

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

JSON returns a single-layer effective summary for Change kinds, Decision Records path, Manage policy, and durable language. For example, with only `language.default: zh-CN`, `language.artifacts` and `language.commit` are both `zh-CN`.

## Decision Records

Decision Records default to `.rsp/specs/decisions/`. If the Host Project already owns ADRs elsewhere, configure exactly one project-relative authoritative directory:

```yaml
decisions:
  path: docs/adr
```

The path cannot be absolute, escape the Host Project, or point at another `.rsp/` core location. Changing it does not migrate existing records. `rsp doctor` reports inactive records left in the old default directory until the project moves or deliberately removes them.

## Manage policy

```yaml
manage:
  activation: auto
  closeout: local
```

`activation` accepts `explicit` or `auto`. Core first resolves one shape-ready owner and solely owns initial Manage qualification plus the `selected | declined` route result. Automatic selection requires an observable coordination obligation—such as independent slices, recovery, distinct execution and acceptance owners, real-host verification, bounded review convergence, managed lifecycle work, or a ready successor—not merely multiple files or documentation surfaces. Missing or non-ready ownership goes to Shape and returns to Core before qualification. Selected Manage validates the handoff without repeating eligibility. Activation grants no planning, product mutation, lifecycle, or external authority.

`closeout` accepts:

- `manual`: no automatic archive or commit.
- `lifecycle`: archive may follow a successful durable review; commit remains separate.
- `local`: automatically archives an eligible, verified, non-small terminal managed boundary with a clean exact owned boundary and routes its exact paths once to local Commit without another user request.

When `manage` is omitted, compatibility defaults resolve to `activation: explicit` and `closeout: local`. Nearest project restrictions and host enforcement can only narrow these ceilings. RSP intentionally has no `full` preset; push, tag, publication, deployment, approval, and human acceptance stay explicit.

See [Skills and managed work](../guides/skills.md) for selection behavior.
