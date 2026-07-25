# Durable review

Load this reference only after required Tasks and verification pass, or when auditing archive readiness.

Run `rsp check --focused` and `rsp show --focused --json`, or `rsp ready <name> --json` for an explicit Change. Treat `durableReview.factCandidateTargets` and `decisionRecordsPath` as routing advice, not permission. Spec delta markers are planning aids and are never promoted automatically.

Choose current facts and rationale independently. Use no update when there is no stable fact or lasting rationale worth rereading.

Write a current-fact update only when implementation changed a stable behavior, boundary, default, or constraint that future maintainers need. Prefer `.rsp/specs/design.md`, an existing domain Spec, or an explicitly authorized scoped `CONTEXT.md`/`AGENTS.md`; create a new Spec only for reusable project-level truth that fits nowhere existing.

Create or update a Decision Record only for a hard-to-reverse or surprising choice with a real tradeoff. It owns rationale, alternatives, tradeoffs, and consequences—not duplicated current facts. Choose one exact file under `durableReview.decisionRecordsPath`, not the directory itself.

Never use generated indexes, archives, `.rsp/rsp-rules.md`, or the managed RSP block as ordinary writeback targets. Keep narrative history, debugging notes, task chronology, and transient evidence out of Specs and Decisions.

Before archive, compress the Change to current design, completed outcomes, decisive evidence, omissions, remaining risks, and blockers. Archive only after required updates are written or explicitly unnecessary. With later explicit Git authority, keep each completed Change independently reviewable as one logical commit; a separately authorized release operation may use a dedicated release commit.
