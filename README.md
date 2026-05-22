# RSP: Rules, Specs, Plans

RSP = **Rules, Specs, Plans** — a lightweight AI-assisted development workflow.

## Quick start

```bash
# Install globally
npm install -g @oevery/rsp

# Or run directly with npx
npx @oevery/rsp init

# Scaffold a project
cd my-project && rsp init
```

Then add \`.rsp/rules/*.md\` to your AI tool's instructions. For example, in Kilo Code's \`kilo.jsonc\`:

```json
{
  "instructions": [
    ".rsp/rules/*.md"
  ]
}
```

For other tools (Cursor, Claude Code, Copilot), add the path to the appropriate config file. The same file works everywhere — see [Platform-agnostic](#platform-agnostic).

## Project structure

```text
.rsp/
├── config.yaml                # project config (custom statuses, priorities, sections)
├── rules/                     # technical constraints, long-lived
│   └── rsp-rules.md
├── specs/                     # project-level architecture
│   └── INDEX.md               # extracted spec summaries from archived features
├── features/                  # feature files (flat or nested)
│   ├── login.md
│   ├── auth/
│   │   └── login.md
│   └── payments/
│       └── checkout.md
├── active.d/                  # active feature markers (path = feature name)
│   ├── login
│   ├── auth/
│   │   └── login
│   └── payments/
│       └── checkout
├── archive/
│   ├── INDEX.md               # auto-generated archive index
│   ├── 2026-05-22_login.md
│   └── payments/
│       └── 2026-05-22_checkout.md
```

Each `active.d/` entry is an empty file whose path mirrors `features/`. Multiple entries mean parallel features. AI reads `active.d/` to find what's in progress. Features can be organized flat (`login.md`) or in domain subdirectories (`auth/login.md`, `payments/checkout.md`).

Each feature file is self-contained, with optional delta markers and structured scenarios:

```markdown
---
status: draft
priority: medium
tags:
  - backend
---
# Feature: User Login

## Spec
- Summary: Users can log in with email and password
- Requirements:
  - [ ] Login form submits email + password
  - [ ] Backend validates credentials and returns JWT
### ADDED           # optional: delta markers
- OAuth 2.0 login support
### Scenario: Valid credentials
- GIVEN a registered user
- WHEN they submit email + password
- THEN a JWT is returned
- Constraints:
  - Passwords must be hashed with bcrypt

## Plan
- [ ] Phase 1: Backend API
  - [ ] Create /api/auth/login endpoint
  - [ ] Implement password verification
- [ ] Phase 2: Frontend
  - [ ] Design login form UI

## Tests
- [ ] tests/auth/login_test.ts — successful login
- [ ] tests/auth/login_test.ts — invalid credentials

## Blockers
-
```

## CLI

```text
rsp init               Scaffold .rsp/ + AGENTS.md
rsp new <name> [summary]    Create .rsp/features/<name>.md
rsp close <name>       Archive to .rsp/archive/ + update spec index
rsp status             Show project dashboard (age, blocked, trends)
rsp check              Validate features (frontmatter, sections, deps, deltas, scenarios)
rsp deps               Show dependency table
rsp deps --mermaid     Output Mermaid.js dependency graph
rsp archive-index      Rebuild archive INDEX.md
```

## Customization

Edit `.rsp/config.yaml` to customize valid statuses, priorities, and required sections.

> **Note:** The built-in YAML parser supports a simple subset: `key: value` pairs, nested lists (`- item`), and `#` comments. Multi-line values, quoted strings, booleans, and nested maps are not supported.

## Platform-agnostic

The \`.rsp/\` directory is a plain file convention — no tool lock-in. It works with Kilo Code, Cursor, Claude Code, Cline, GitHub Copilot, or any AI coding assistant that reads project files. Requires Node.js 18+.

## License

MIT
