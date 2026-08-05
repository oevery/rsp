# Configuration reference

Project configuration lives at `.rsp/config.yaml`. Omitted optional mappings retain compatibility defaults; configuration never expands authority.

## Change kinds

The built-in Change kinds are `feature`, `fix`, `refactor`, `docs`, `ops`, and `research`. A non-empty configured list replaces rather than extends the defaults, and each entry must be a unique non-empty string.

```yaml
kinds:
  - feature
  - fix
  - docs
```

## Durable language

```yaml
language:
  default: en
  artifacts: zh-CN
  commit: en
```

When the `language` mapping exists, `default` is required. It provides the default for durable artifacts and commit prose; optional `artifacts` and `commit` override their corresponding surfaces. Values use normalized BCP 47 language tags.

Response language remains owned by the user and session and cannot be configured with `language.response`. Existing artifacts keep their established language unless translation is explicitly authorized. Canonical headings, commands, paths, identifiers, Conventional Commit types and scopes, trailers, machine values, and WorkRefs are not localized.

There is no WorkRef language or style configuration field. `language.default: zh-CN` can select Chinese Change prose without selecting a Chinese WorkRef. When neither explicit user input nor a nearest project/domain convention supplies the identity style, inferred WorkRefs use ASCII lowercase kebab-case. Explicit or project-owned valid Unicode WorkRefs remain supported and are preserved.

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
  closeout: lifecycle
```

`activation` accepts `explicit` or `auto`. After specialist and complete small-work exceptions, Core first resolves one shape-ready owner and solely owns initial Manage qualification plus the `selected | declined` route result. Missing or non-ready ownership goes to Shape and returns to Core before Manage qualification; automatic activation never sends pre-owner work into Manage. Selected Manage validates the handoff against current owner, authority, and owned-diff evidence without repeating direct-versus-managed eligibility. Activation grants no planning, product mutation, lifecycle, or external authority.

`closeout` accepts:

- `manual`: no automatic archive or commit.
- `lifecycle`: archive may follow a successful durable review; commit remains separate.
- `local`: automatically archives an eligible, verified, non-small terminal managed boundary with a clean exact owned boundary and routes its exact paths once to local Commit without another user request.

When `manage` is omitted, compatibility defaults resolve to `activation: explicit` and `closeout: local`. Nearest project restrictions and host enforcement can only narrow these ceilings. RSP intentionally has no `full` preset; push, tag, publication, deployment, approval, and human acceptance stay explicit.

See [Skills and managed work](../guides/skills.md) for selection behavior.
