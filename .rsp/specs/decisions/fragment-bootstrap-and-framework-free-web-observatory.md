# Use fragment bootstrap and framework-free assets for the local Web Observatory

RSP uses one short-lived, one-use URL-fragment bootstrap to establish a project-scoped in-memory Web bearer, and ships the base Observatory as authored HTML, CSS, and JavaScript without a browser framework dependency.

## Considered Options

- Put the Broker project token in a query string or cookie-setting navigation: rejected because the credential could enter browser history, Referer values, access logs, screenshots, copied normal command output, or unrelated same-origin requests.
- Put the project token directly in the URL fragment: rejected because the browser would retain the long-lived checkout-session credential even though fragments are not sent to the server.
- Serve one unauthenticated project page and rely on loopback secrecy: rejected because another local process or page that learns a project identity could read checkout projections.
- Start one authenticated HTTP server per checkout: rejected because it would duplicate endpoint discovery, process lifecycle, idle ownership, security policy, and multi-worktree isolation already owned by the user-level Broker.
- Add React DOM, a bundler-specific browser runtime, or another application framework: rejected because Overview, Specs, and History need a compact read-only renderer, while another runtime dependency would increase installed footprint, build coupling, Content Security Policy surface, and clean-install risk without an evidenced interaction need.

## Consequences

- `rsp web` requires current Broker protocol `1.2`; its Web route and bootstrap contract were introduced in protocol `1.1`. It explicitly starts or reuses that compatible Broker, registers the exact checkout, and asks the authenticated project session to mint one bootstrap that expires after one minute and is consumed at most once.
- The bootstrap appears only in the URL fragment. The static shell contains no project data, the fragment is not sent in the initial request or Referer, browser code removes it before API access, and only an exact-origin POST may exchange it.
- Bootstrap exchange creates a separate project-scoped Web bearer held only in page and Broker memory. It is neither repository state nor browser storage, expires after eight hours, is discarded on session unload, and cannot authorize control or ordinary project-token routes.
- Normal human and JSON command output contains only the credential-free project URL. An explicit interactive `--print-url` or interactive browser-open failure may reveal the expiring one-time bootstrap as a human fallback; redirected non-interactive output never receives it.
- The package ships exact no-follow `web/static/index.html`, `app.css`, and `app.js` assets plus `dist/web-projector.mjs`. The bundle contains no checkout path, repository data, token, environment configuration, inline script, or framework runtime.
- The small base browser label set is English-only. Repository WorkRefs and projected source content are not translated, and browser localization remains a separate presentation decision.
- The Browser renders bounded server projections and never parses Markdown semantics. Successful refresh atomically replaces one complete snapshot; failed or incompatible refresh preserves the previous snapshot as visibly stale with a bounded redacted error.
- Exact loopback, Host, request-target, Origin, method, path, query, token, response-size, redaction, Content Security Policy, no-store, no-referrer, frame, MIME, and Permissions Policy checks remain one Broker-owned boundary.
- A future remote binding, cookie session, persistent browser storage, framework runtime, service worker, inline script, mutation route, or hosted/multi-user product must revisit authentication, origin, packaging, CSP, retention, and authority together.
