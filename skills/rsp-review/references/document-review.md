# Document review

Load this reference only when the fixed reviewed artifacts make the Document pipeline applicable.

Classify each document by its semantic role: requirement/Change, implementation plan, Spec, Decision Record/ADR, context/navigation, operating instruction, or explanatory/user documentation. Then check:

1. **Purpose:** identify the intended reader, available prior knowledge, and reading task. Missing framing matters when it causes a wrong decision or prevents that task, not merely when a preferred introduction is absent.
2. **Grounding:** verify authority and traceability of claims and decisions, including commands, defaults, conditions, limits, and failure outcomes. Compare internal and cross-artifact meaning; polished prose can still make a false promise.
3. **Usability:** inspect prerequisites, concept definitions, causal relationships, actionable instructions, and success signals appropriate to the document role. Test realistic reader questions against the document and its declared prerequisites, not knowledge hidden in the author conversation.
4. **Ownership:** check scope, duplicate authority, and choices disguised as settled decisions. Report unresolved product, operational, rollback, migration, or completion choices as ambiguity Findings when no authority resolves them; block only a dependent judgment that cannot coherently continue.
5. **Maintenance:** verify relevant paths, links, anchors, terminology, interfaces, sequencing, and executable examples at the appropriate detail. Flag stale or broken reading paths and verbosity that obscures a material contract, not length alone.

Check ownership by meaning, not file shape. CONTEXT owns canonical terms, domain relationships, and navigation; AGENTS owns operating rules; README owns introduction and usage. Specs own current contracts and necessary constraints, including design-reference tables when they define normative evidence. Change Spec owns only the delta and acceptance; Design owns the approach, Tasks the work, and Verify the evidence. Decision Records own rationale. Short summaries and references are valid; parallel full definitions are not.

Prefer behavior that survives replaceable internals. Report a Spec/code discrepancy without assuming the implementation is correct. Specialized Spec headings and omitted unnecessary scenarios are not defects; scaffold hints are optional writing aids, not requirements or evidence. Material promises, decisions, and limits must remain visible outside comments. Do not request extra sections, tests, or bulk historical rewrites merely for template conformity.

For each retained Document finding, identify the reader and task, point to the exact claim or missing prerequisite, and explain the consequential misunderstanding or blocked action in the normal Evidence/Impact fields. Prioritize false claims and unusable instructions before tone. A style preference without a task consequence is not a blocking defect; an adequate document can be clean with no changes. Reference tables need not read like tutorials, and requirements need not specify ordinary implementation choices.

Reading difficulty is evidence to investigate, not permission to invent facts or rewrite the document. Do not invoke Doc to apply findings during review. The five dimensions also guide writing, but Review uses this local reference and does not depend on Doc being installed. State whether reader comprehension was assessed locally or with actual independent evidence; never infer independence from a self-check or require a fixed number of rounds.

Before the Document verdict, enumerate every unresolved choice in each changed document. Any unresolved product, operational, rollback, migration, ownership, or completion choice must either have resolving authority or produce an ambiguity Finding; do not stop after finding other defects.

Anchor Findings to the smallest heading or claim. Do not apply code-style or test-coverage rules to semantic documents, auto-fix meaning, or rewrite prose for taste.
