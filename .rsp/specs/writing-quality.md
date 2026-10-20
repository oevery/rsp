# Writing quality

## Purpose and ownership

Repository guidance must help its reader understand, act or judge a contract
without the author conversation. This Spec owns shared writing and content-review
requirements. [Workflow](workflow.md#capability-ownership) owns capability roles; Doc
and Review carry standalone guidance rather than a runtime dependency on this file.

## Facts and language

- Ground claims, examples, defaults, limits and failures in their authoritative
  owner. Distinguish current behavior, intended requirements and unknowns.
- Preserve negation, conditions, exceptions, quantifiers, permissions, units,
  certainty, terminology and author voice. Clearer prose must not change a promise,
  turn an unknown into a fact or invent human experience.
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

State who acts, what they do and what they act on. Prefer short sentences when they
preserve the same meaning and make the decision easier to follow. Separate independent
actions; keep conditions, causes and consequences explicit. Give each paragraph or
item one useful purpose. No word count, sentence length, list size or compression
ratio defines quality.

Explain unfamiliar concepts through their meaning for the declared reader and task.
Retain mechanisms needed to reason, troubleshoot or assess guarantees; reference
entries need no forced tutorial. Remove empty introductions, rhetorical framing,
repetition, non-informative modifiers and session-attempt narration. Keep explanations
that change a decision or establish needed reasoning, and evidence required by the task.

Wording edits preserve meaning, information ownership, heading anchors and technical
literals, including code, commands, paths, identifiers, links, versions and numbers.
Structural edits may merge, move or reorder content within scope, checking completeness,
references and reading order. A request to shorten prose alone does not authorize
behavior changes or technical corrections; those need their own scope and verification.

Put prerequisites before use, conditions beside actions and exceptions beside
conditions. Include actions and recognizable success signals, not only outcome
labels. Number a sequence only when correctness, safety or a contract requires
its order; use peer bullets for independent items and connected prose for reasoning.
Keep causal and conditional relationships explicit where readers would otherwise
have to infer them. Keep a concept's rules and caveats together, with substantial
branch-only detail linked conditionally.

State the action directly rather than an abstract aspiration. For prescriptive rules,
use contrasts or counterexamples only to resolve likely ambiguity. Retain explanatory
comparisons needed for understanding, decisions or migration. Merge equivalent examples
and remove those repeating the rule.

Merge failure explanations with the same decision effect; retain conditions that
change permissions, outcomes, stopping or safe recovery. Keep rare boundaries explicit
when they prevent unauthorized action, serious harm or unsafe replay. Incident details
stay with their evidence owner. Neither shorter text nor a newer model proves quality
or behavioral equivalence.

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

- README and procedures help readers start, act and recognize success. Specs help
  them judge contractual behavior and exceptions. Design explanations and Decisions
  retain reasons, alternatives and consequences. Do not force every artifact into an
  action checklist, terse fragments or a closing next-step prompt.
- Skills provide discriminating descriptions, authorized actions, real stops and
  conditional resources. Keep enough local context for independent use.
- CONTEXT supplies vocabulary and navigation, Specs current contracts, and work
  records only their selected delta and evidence summary. A true but misplaced
  statement still needs the correct owner; copying it into several files is not writeback.
- For a final Change, retain a fact only when it affects the delivered contract,
  evidence applicability, an important failure disposition or remaining risk.
  Consolidate duplicate check summaries without merging different candidates or
  changing original verdicts. Execution details stay in their report, not the Change.
- API comments explain actual inputs, returns, failures and usage. Ordinary inline
  comments retain accurate constraints, rationale or usage that nearby code does
  not make clear; remove restatement that adds no useful information, without an
  invented document scaffold. Behavior-affecting tool/compiler annotations retain
  implementation ownership.
- Copyable examples state real prerequisites and consequences. Label pseudocode
  and incomplete snippets; writing authority or a code fence grants no execution,
  dependency installation or external effects.

## Instruction and resource design

- Descriptions distinguish the intended task from adjacent capabilities before
  loading the body; procedures belong in the body, not exhaustive trigger lists.
- Make the ordinary task executable from its goal, necessary inputs, authorized
  actions, completion evidence and real stops. Organize these around the reader's
  decisions, not a mandatory section template. Keep each conditional decision's
  action and result with its conditions. Prefer one coherent decision rule
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
  A failure justifies a new constraint only for a reusable contract gap; noncompliance
  or tool/environment failure alone does not establish one. Failure attribution and
  candidate comparisons stay in maintainer methods and research evidence.

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

Doc owns writing and author checks; Review owns separately requested or required
judgment, not another copy of the writing procedure. Ordinary wording edits do not
automatically require Review. Inspect changed meaning in context; for structural
edits also walk affected reading paths and callers. Check applicable examples,
metadata, links and anchors, reusing traceable unchanged mechanical evidence.
Self-checks cannot supply required independent judgment. Adequate surfaces need no edit
merely to show coverage.

Inspect both the ordinary path and changed conditional paths, including standalone
use. Check unnecessary reads and handoffs, correct restraint, erroneous stops and
the final answer as well as successful action. Actual task evidence is required
for behavioral claims; comparable outcomes and costs are required for efficiency
claims. Shorter sources and static diagnostics alone establish neither.

Self-checks do not establish independent review or task behavior. Factual accuracy
does not establish task usability. Usability findings identify the missing meaning
or inference, judged against the reader's declared prior knowledge, and its
demonstrated effect on the task, including unnecessary reconstruction or lookup.
Agreed user, project and Spec expression rules are contracts. Findings identify the
violated rule and consequence: an obscured action, scattered conditions, independent
decisions crowded together or repetition can create avoidable reconstruction. Necessary
prerequisite reading, alternatives meeting the task and applicable contracts, paragraph
length and perceived machine style alone establish no defect;
severity follows the demonstrated consequence. Static validity, author checks and independent
acceptance remain separate. No regex, length limit, fixed interview or worker count
establishes writing quality.
