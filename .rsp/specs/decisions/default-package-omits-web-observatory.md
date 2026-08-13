# Omit Web Observatory from the default package

RSP does not deliver the Web Observatory through the default CLI, Broker routes, build entries, or package inventory. Its authored source remains in the repository for possible future re-evaluation.

This decision supersedes the default-delivery consequences of [Use fragment bootstrap and one bundled React root for the local Web Observatory](./fragment-bootstrap-and-react-web-observatory.md) without rewriting that record's historical implementation rationale.

## Context

The browser surface introduced Broker-session, authentication, asset, compatibility, configuration, and cross-agent integration expectations before it demonstrated enough reliable value over the authoritative Markdown artifacts and one-shot CLI workflow. Making that surface experimental through configuration or initialization prompts would preserve most of the operational complexity while adding another product mode.

## Considered Options

- Keep an explicit preview command: rejected because it would still make the browser surface a supported installed contract.
- Add a configuration, environment variable, or initialization prompt to opt in: rejected because agent-specific setup and hidden mode differences would increase configuration and support cost without proven benefit.
- Delete the implementation and history completely: rejected because the bounded projection, security, and presentation work may remain useful evidence for a future independently justified Change.

## Consequences

- The default CLI has no `rsp web` command, and the default Broker exposes no Web page, asset, bootstrap, projection, detail, or event routes.
- The obsolete Web command module, browser opener, browser transport entry, Broker Web-session bridge, generated static assets, and default projector path are removed rather than left as callable dead paths. Retained presentation and projection modules contain no supported transport entry. The package contains no Web projector entry or browser assets. Markdown artifacts, direct CLI inspection, Broker lifecycle, runtime-store adapters, and `rsp.manage-runtime@1.0` remain available.
- Existing Broker processes continue running their loaded code until explicitly restarted; replacement remains a separate user-authorized lifecycle operation.
- `src/web/`, `web/src/`, and the historical rationale in [Use fragment bootstrap and one bundled React root for the local Web Observatory](./fragment-bootstrap-and-react-web-observatory.md) remain repository evidence, not a supported installed surface.
- Restoring any Web delivery requires a new selected Change, current-value evidence, explicit product boundaries, and fresh review and acceptance. It must not reappear through an undocumented flag or automatic initialization behavior.
