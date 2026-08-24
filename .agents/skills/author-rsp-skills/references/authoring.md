# Authoring

Use for `create`, `revise`, `audit`, or `adapt`.

## Derive the candidate

1. State the observed gap and why an existing Skill, project instruction, script, or ordinary implementation cannot own it.
2. Define three to five distinguishing behaviors plus trigger, inputs, authority, output, stop, verification, and failure boundaries.
3. Choose the smallest package shape:
   - `SKILL.md`: routing and always-needed procedure.
   - `references/*.md`: branch-specific knowledge loaded only when selected.
   - `scripts/*`: deterministic, repeatable work that should not be re-described each run.
   - `agents/openai.yaml`: UI metadata only; keep it aligned with the Skill contract.
4. Keep selection and authority in the entrypoint. When choosing a branch requires classification, keep that classification there too. Load a branch reference only after its explicit trigger or required classification succeeds; an input read only as authority or evidence does not activate that branch.
5. Keep references one level from `SKILL.md`. Link every intended Markdown resource directly or through a necessary selected reference.
6. Co-locate a rule with the action it constrains. Lead sections and list items with words that expose the decision, authority, or result. Define completion with observable checks.

For `audit`, do not mutate the target unless the user also authorizes a repair. Run the corpus scanner when useful, then separate deterministic facts from semantic findings. An unreachable file, repeated paragraph, or large count is a review lead, not an automatic defect.

## Adapt accepted research

Require an accepted report, revision, recommendation ID, source path, license conclusion, and reuse mode: `adapted`, `independent-reimplementation`, or `model-only`. Record preserved behavior, local changes, and rejected upstream behavior. Do not copy a whole upstream methodology to obtain one mechanism.

Use a three-way update model for later revisions: prior upstream base, local candidate, and new upstream evidence. Never overwrite local intent automatically.

## Check package boundaries

- Published product Skills live in their canonical authored package and may have discovery projections.
- Direct maintainer Skills remain outside the published inventory unless a separate product Change promotes them.
- Public names, fields, enums, receipts, and ownership boundaries favor clarity and compatibility over brevity.
- Examples should demonstrate a discriminating behavior or boundary; remove decorative examples and duplicate prose.
