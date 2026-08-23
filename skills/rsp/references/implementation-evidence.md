# Implementation evidence

Load this reference only when implementation evidence is incomplete or failed and Core must select Diagnose, TDD, ordinary Implement, or Verify.

Apply these routes in order:

- **Diagnosis first:** diagnosis takes precedence over TDD for an evidenced but unexplained, conflicting, intermittent, or multi-layer failure. Use `rsp-diagnose` when available; its manual fallback reproduces, locates, and tests the smallest discriminating hypothesis. Do not encode an unexplained symptom as a guessed regression test.
- **TDD when justified:** use `rsp-tdd` only when test-first is explicitly required by the user, Change, or project instructions, or when a concrete changed risk makes a pre-mutation RED materially safer; mere testability or being a fix does not qualify. Its manual fallback observes the focused RED, makes the minimum GREEN change, and refactors only while green.
- **Ordinary implementation by default:** use `rsp-implement`, or the equivalent bounded edit and verification, once the behavior, cause, and owner are sufficiently evidenced.
- **Verification as one bounded action:** use `rsp-verify` for a read-only pass over the Change-declared evidence boundary. Verify owns its result; Core retains routing and continuation, while Manage validates required results and derives acceptance and closeout. Any worker identity or independence evidence comes from the host, not Verify self-report.

All branches return evidence, Tasks, Verify updates, and blockers to the same Change. Required verification proves acceptance or changed material risk; Optional verification adds environment, compatibility, scale, or confidence coverage. Fresh Required verification is mandatory, and optional omissions remain visible warnings.
