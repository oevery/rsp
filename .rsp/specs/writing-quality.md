# Writing quality

## Purpose and ownership

Repository guidance must help its reader understand, act or judge a contract
without the author conversation. This Spec owns shared writing and content-review
requirements. [Workflow](workflow.md#capability-ownership) owns capability roles; Doc
and Review carry standalone guidance rather than a runtime dependency on this file.

## Facts and language

- Ground claims, examples, defaults, limits and failures in their authoritative
  owner. Distinguish current behavior, intended requirements and unknowns.
- Preserve conditions, quantifiers, permissions, terminology and author voice.
  Clearer prose must not change a promise or invent human experience.
- Existing artifacts retain language unless translation is requested. New artifacts
  follow explicit instruction, effective artifact configuration, scoped instructions,
  then conversation language. Resolve response and commit language separately.
- Define each contract once. Keep useful navigation summaries, local safety conditions
  and minimum context where needed; references state when and why to read the owner.
  Necessary action and safety guidance remains local; shared definitions use a direct conditional reference.
- A tool example is not a mandatory method. A named required check or safety condition
  does not become optional through wording cleanup; see the
  [Architecture boundary](design.md#agent-and-tool-boundary).

## Information and expression

Give each paragraph or item one useful purpose. Remove empty introductions,
repetitive conclusions, non-informative modifiers and session-attempt narration,
while preserving evidence required by an audit or run-record purpose.

Put prerequisites before use, conditions beside actions and exceptions beside
conditions. Include actions and recognizable success signals, not only outcome
labels. Number a sequence only when correctness, safety or a contract requires
its order; use peer bullets or causal paragraphs otherwise. Keep a concept's
rules and caveats together, with substantial branch-only detail linked conditionally.

State correct behavior directly. Examples, comparisons and general teaching need
a reader-task reason, not a fixed template. Concision removes unnecessary prose,
not permission boundaries, failure states or substantive qualifiers. Neither a
word/reference count nor a newer model proves quality or behavioral equivalence.

## Symbols and tables

Ordinary conjunctions use words. Reserve `|` for closed alternatives, `/` for
established pairs, `→` for a defined transition, and `:` for label/value boundaries.
Preserve syntax inside paths, commands, links and canonical values.

Use a table when repeated columns make a fixed mapping or comparison easier to
read. Executable Skill branches, exceptions and multi-step judgments use lists
or prose rather than ambiguous table cells. No mechanical symbol substitution
or private notation is required.

## Artifact differences

The [Work model artifact boundaries](work-model.md#boundaries) own placement and its
[evidence/closeout contract](work-model.md#evidence-and-closeout) owns final Change
convergence. Writing applies those contracts; it does not redefine the workflow.

- Skills provide discriminating descriptions, executable guidance and conditional
  resources. Procedures state prerequisites, actions and success signals; conceptual
  explanations state causes and relationships; references state exact contracts.
- CONTEXT supplies vocabulary and navigation, Specs current contracts, and work
  records only their selected delta and evidence summary. A true but misplaced
  statement still needs the correct owner; copying it into several files is not writeback.
- For a final Change, retain a fact only when it affects the delivered contract,
  evidence applicability, an important failure disposition or remaining risk.
  Consolidate duplicate check summaries without merging different candidates or
  changing original verdicts. Execution details stay in their report, not the Change.
- API comments explain actual inputs, returns, failures and usage. Ordinary inline
  comments need local accuracy and clarity, not an invented document scaffold;
  behavior-affecting tool/compiler annotations retain implementation ownership.
- Copyable examples state real prerequisites and consequences. Label pseudocode
  and incomplete snippets; writing authority or a code fence grants no execution,
  dependency installation or external effects.

## Instruction and resource design

- Descriptions distinguish the intended task from adjacent capabilities before
  loading the body; procedures belong in the body, not exhaustive trigger lists.
- Make the ordinary task executable from its goal, necessary inputs, authorized
  actions, completion evidence and real stops. Organize these around the reader's
  decisions, not a mandatory section template. Prefer one coherent decision rule
  over repeated qualifications in entry, steps and return. Use a short example
  when it resolves a boundary more directly than another explanation.
- Link branch-only detail with its reading condition and purpose. Keep common
  safety and minimum actionable context local; an ordinary task must not load
  unrelated recovery, coordination or delivery procedures. Split or merge resources
  to improve the actual reading path, not merely relocate the same mandatory text.
  [Distribution](distribution.md#skill-package-boundaries) owns suite resource closure.
- Revise an existing rule before adding a parallel one for the same decision.
  Preserve trigger, inputs, authority, actions, outputs, stops, verification and
  conditional loading unless their owning contract intentionally changes. Generic
  teaching or model-compensation guidance needs a current task-specific reason.
  Failure attribution and candidate comparisons belong to maintainer methods and
  research evidence, not additional instructions every installed user must load.

## Content-based review

Fix scope, comparison and authority before choosing perspectives. Code judges
behavior, safety, failure contracts and tool semantics of reviewed executable
content; Document judges grounding, usability, navigation and maintenance.
Complete Skill instructions normally need both; narrow wording requests and
ordinary comments receive only applicable checks. Illustrative pseudocode needs
logical consistency, not invented production/runtime acceptance.

Authority or evidence read to support a judgment does not become a reviewed target.
Judge a text/implementation discrepancy without assuming either side correct and
report one root issue once. Two perspectives do not imply two workers or reports.
No applicable content means `skipped`; missing required authority blocks dependent
judgment. Scope and coverage identify material omissions.

For closeout, inspect the final whole work record after necessary writeback, not
only its changed lines, an earlier revision or a newly added completion assertion.
CLI readiness and a statement that convergence occurred do not prove text quality.
Reader-required choices must have authority or be reported as unresolved.

## Verification and review

Author checks assess whether readers can find facts, understand conditions, act
and recognize unknowns. Check affected meaning, examples, metadata, links and anchors;
distinguish inspection, execution, reuse and missing evidence. Whole-surface work
inspects the selected documents/resources and callers; adequate surfaces need not
be edited merely to show coverage.

Inspect both the ordinary path and changed conditional paths, including standalone
use. Check unnecessary reads and handoffs, correct restraint, erroneous stops and
the final answer as well as successful action. Actual task evidence is required
for behavioral claims; comparable outcomes and costs are required for efficiency
claims. Shorter sources and static diagnostics alone establish neither.

Self-checks do not establish independent review or task behavior. Agreed user,
project and Spec expression rules are contracts; findings identify their violation
and consequence, not personal taste. Static validity, author checks and independent
acceptance remain separate. No regex, length limit, fixed interview or worker count
establishes writing quality.
