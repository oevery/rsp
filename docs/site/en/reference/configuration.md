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

`activation` accepts `explicit` or `auto`. Automatic activation permits Core to select a controller for qualified work; it grants no mutation or lifecycle authority.

`closeout` accepts:

- `manual`: no automatic archive or commit.
- `lifecycle`: archive may follow a successful durable review; commit remains separate.
- `local`: lifecycle closeout plus one separately justified local commit at an eligible clean, verified, non-small terminal boundary.

When `manage` is omitted, compatibility defaults resolve to `activation: explicit` and `closeout: local`. Nearest project restrictions and host enforcement can only narrow these ceilings. RSP intentionally has no `full` preset; push, tag, publication, deployment, approval, and human acceptance stay explicit.

See [Skills and managed work](../guides/skills.md) for selection behavior.
