---
status: complete
survey_date: 2026-09-28
scope: all-registered-upstreams
---

# Full upstream refresh and disposition

## Outcome

The September 28 refresh covers all 25 registered sources. All were synchronized successfully in the preparation phase: 22 cached candidate revisions advanced and three remained unchanged. The 22 new source reports are now completed bounded distillations, with prior recommendations/rejections reconciled against current RSP. The three unchanged sources retain their existing completed reports.

Read the [final source disposition and candidate matrix](models/skill-upstream-refresh-2026-09.md) for exact source-report revisions, recommendation IDs, existing coverage, exclusions and reopening conditions. That model replaces the preliminary triage in this file.

## Evidence and coverage repairs

- compound-engineering: follow the demonstrated docs/skills to docs/guides migration.
- openspec: include docs-lab/**/*.md, regenerate mechanical evidence and update the new report's evidence hash; distinguish skeleton documentation from implemented source templates.
- Five sources have no accepted lock baseline: anthropic-managed-agents, langgraph, no-negative-echo, openai-agents-python and temporal-workflow-observability. Their prepared evidence remains initial; prior reviewed revisions are supplementary comparisons, not silently accepted bases.
- DeepSeek Harness and ECC intermediate complete reports were reconciled so their already implemented restraint/test-value rules are not recommended again.

## Main conclusions

1. **Select natural-request routing evidence first.** Several public trigger cases explicitly name the Skill. Existing natural review/workflow cases and a recorded host version do not establish natural routing or benefit for the whole suite. Reuse the current evaluation harness; do not build another router.
2. **Defer broad Skill rewriting.** RSP already supports tiny/ready direct work, conditional delegation, scoped review, fresh recovery and behavior-first test admission. Plan/coordination simplification needs a local redundant-work trace and outcome-preserving comparison.
3. **Keep focused boundary cases optional and owner-specific.** Removal/rename review, stale-owner recovery, real host context isolation and newly in-scope opaque security content have distinct evidence needs; do not bundle them into a new framework.
4. **Keep prior structural exclusions.** No whole-suite adoption, ambient hooks, session scraping, automatic Git/publication, unattended self-modification, second ledger or runtime persistence.

## Corrections after deeper reading

No Negative Echo does have a substantive conditional-loading change. Matt's broad file churn does not by itself establish new mechanisms. SkillOpt's finite-score repair is path-specific and another gate still supports keyword-density rewards, which remain unsuitable for RSP. OpenSpec's newly covered docs-lab includes incomplete skeleton pages, which were not treated as product behavior.

## Completion boundary

Completed source research is not exhaustive line-by-line audit, runtime execution, model-efficacy evidence, baseline acceptance or product adoption. Source-specific limits and future validation requirements remain explicit in each report.

Closing validation passed: all 25 source states are complete, all 22 new reports match prepared metadata/evidence hashes, patch bytes and Git inventories, all required sections and 62 local report links resolve, and every declared source path matches. The model source list matches the pinned candidates. Changes are confined to the 26 expected research/configuration paths; historical reports and protected product paths are unchanged.

`mise exec -- pnpm run docs:check` passed (7 bilingual page pairs, 31 Markdown files); this existing check covers site documentation, while the separate research checks above cover the new reports. `git diff --check` passed. Product tests were not rerun for research-only edits, and no model behavior was tested. Git warned that exhaustive rename detection was skipped for large upstream diffs; exact patch hashes still match prepared evidence, without claiming every rename was semantically identified.

upstreams.lock, product Skills, source, rules and Specs remain unchanged. No upstream code or installer, live provider, independent holdout, Git commit, push or publication was executed. Any accept action or selected product candidate requires separate authority.
