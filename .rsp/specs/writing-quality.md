# Writing quality

## Purpose and ownership

Repository guidance, including documents, Skills, API comments and examples, must help its intended reader act, understand or check a contract without the author conversation. rsp-doc owns authorized writing and self-checks; implementation ownership remains with Implement, and rsp-review owns fixed-scope read-only judgment. Their packages carry standalone guidance, not a runtime dependency on this Spec.

## Facts and language

- Claims, examples, defaults, limits and failure outcomes agree with their authority. Current behavior, intended requirements and unknowns remain distinguishable.
- Revisions preserve conditions, quantifiers, defaults, failures, permissions, consistent terms and author voice. Qualifiers such as only, default, optional and asynchronous carry meaning; fluency does not excuse a changed promise or invented experience.
- Existing artifacts retain language unless a change is requested. New artifacts use explicit artifact language, effective configuration, scoped instructions, then conversation language. Response language is resolved independently.
- Each contract has one authoritative owner. Useful summaries, local safety conditions and minimum context remain available where needed; links identify when to read the owner and what it supplies. Necessary self-contained guidance is not replaced by a chain of references.
- Executable guidance distinguishes capability responsibility, permitted methods and mandatory evidence under the [Design boundary](design.md#agent-and-tool-boundary). A preferred tool is not made obligatory by its example, and a required command or safety condition is not made optional by clearer prose.

## Information and expression

- Each paragraph or item has one useful purpose. Remove empty introductions, repetitive conclusions, non-informative modifiers and session-attempt narration. Preserve navigation summaries and evidence required by an audit or run-record purpose.
- Result-oriented steps include the necessary action, prerequisites and success signal, not just a result label. Conditions precede use; rules stay with actions and exceptions with their conditions. Prescribe order only when correctness, safety or the contract requires it; leave other method choices to the responsible reader or Agent.
- Ordered lists express necessary sequence or precedence; bullets express parallel peers. Causal explanation uses short connected paragraphs when it aids action or judgment. No fixed count or template is required.
- Definitions, rules and caveats for one concept stay together. Common instructions remain visible; substantial branch-only detail is linked with its reading condition.
- State correct behavior directly. Use examples or positive/negative comparisons only to clarify a real misconception or boundary; do not force paired sentences, slogans or universal examples.
- Concision removes repetition and unnecessary explanation without merging owners, failure states or permission boundaries. General teaching needs a reader-task reason to remain; model-default no-op claims require behavior evidence for the relevant tasks and model. Neither a newer model nor a shorter document proves equivalence. No hard word or reference-count limit replaces this semantic check.

## Symbols and tables

- Ordinary sentences use words for conjunctions. The pipe symbol denotes closed canonical alternatives; slash denotes established pairs or compact labels; arrow denotes a defined one-meaning transition; colon separates a label from its value.
- Paths, code, links, canonical values and established technical notation preserve their syntax. No private shorthand or mechanical symbol replacement is introduced.
- Executable Skills use tables only for short stable closed mappings with real repeated-column savings and unambiguous rows. Branching judgments, exceptions and multi-step actions use lists or short prose.
- Human documents use tables when comparison or lookup aids the reading task. Narrative explanation is not forced into cells.

## Artifact differences

- Skills supply discriminating descriptions, concise executable guidance and conditional resources. Creation preserves existing packages and does not imply installation.
- Procedures guide a task with prerequisites, actions and success signals. Conceptual documents explain causes and relationships; references state exact contracts. Reader-required explanation is retained, not used to justify long execution paragraphs.
- README supplies entry and usage; CONTEXT owns vocabulary and navigation; Specs own current contracts; Changes own a selected delta and final evidence; Decision Records own rationale.
- API/TSDoc comments explain actual inputs, returns, failures and usage to their consumers. Ordinary implementation comments explain relevant local reasoning without a forced document scaffold. Behavior-affecting annotations retain their compiler/tool meaning despite comment syntax.
- Copyable commands and examples state real prerequisites, safe use and expected consequences. Mark illustrative pseudocode or incomplete snippets; neither a code fence nor writing authority permits execution, dependency installation or external effects.

## Content-based review

- Fix reviewed files/content, comparison and authority before selecting checks. Code and Document are complementary perspectives, not mutually exclusive file categories; extensions, comments and code fences alone do not determine applicability. Explicit narrow scope overrides whole-file defaults.
- Code checks behavior, contracts, safety, failures and tool semantics when executable instructions/code, runnable recipes, algorithmic logic or tool-interpreted content is itself reviewed. Document checks factual explanation, usability, navigation and maintenance; a prose behavior claim alone can remain Document grounding. Complete Skill instructions normally need both; bounded wording changes and ordinary comments receive proportionate affected checks, not an automatic full second pass.
- API comments and runnable examples receive applicable behavior and explanation checks. Match evidence to risk: illustrative pseudocode needs logic/contract consistency, not mandatory runtime or production tests; changed real seams and public failure contracts retain their required evidence.
- Authority/evidence-only content never becomes a reviewed target merely because it is read. Reading implementation to verify a document claim does not select Code review of that implementation; a snippet within the reviewed document may independently need Code checks.
- Check text/behavior consistency without automatically privileging implementation over the authoritative requirement. Deduplicate one root issue across perspectives and artifacts. Keep the existing Code/Document results and one report; two perspectives imply neither two workers nor a new persisted state.
- With no applicable reviewed content a perspective is skipped; missing required authority blocks dependent judgment. Coverage names checked content and material gaps. Actual responsibility and outcomes establish correct use; reference-loading fingerprints or successful package checks do not.

## Verification and review

- Author checks establish whether readers can find information, understand conditions, act or judge compliance, and recognize unknowns. Check factual meaning and affected commands, examples, metadata and links; distinguish inspection, execution and missing evidence.
- A whole-surface optimization inspects the declared package/document set, including conditional resources and callers, and records why each changed or adequate surface is retained. Coverage does not require editing every file; static diagnostic counts do not prove comprehension or behavioral improvement.
- Writing self-checks apply the same content-role and consistency rules within authorized scope; they do not establish independent review or task behavior.
- Agreed expression requirements from the user, project or Spec are contracts. Findings cite the exact violation and its consequence; personal preference without authority or demonstrated downside is not a defect.
- Static validity, author self-checks and independent review are separate evidence. No format regex, word count, fixed interview or worker count establishes writing quality.
