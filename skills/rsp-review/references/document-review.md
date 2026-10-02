# Document review

Load for explanation or usage guidance within the fixed reviewed content, including Skill instructions and API/TSDoc comments. Apply the dimensions relevant to the reader's task; a short inline comment needs no synthetic introduction, document scaffold or standalone writing pass.

- Compare API comments and copyable examples with the smallest authoritative contract and implementation: inputs, outputs, failures, prerequisites and consequences.
- Label illustrative pseudocode and incomplete snippets; neither is a verified runnable recipe. A code fence or evidence-source read does not select Code by itself, and review grants no execution authority.
- Code handles applicable behavior/tool checks, not a duplicate writing pass. Report one text/behavior mismatch once without automatically treating implementation as correct.
- Skill guidance: descriptions discriminate neighboring intents; actions have prerequisites/results and conditional links have a reading purpose. Keep common safety and minimum actionable context local. Tables serve short stable mappings, not branching procedures; concise wording preserves substantive qualifiers.

Classify each document by its semantic role: requirement/Change, implementation plan, Spec, Decision Record/ADR, context/navigation, operating instruction, or explanatory/user documentation. Then check:

1. **Purpose:** identify the intended reader, available prior knowledge, and reading task. Missing framing matters when it causes a wrong decision or prevents that task, not merely when a preferred introduction is absent.
2. **Grounding:** verify authority and traceability of claims and decisions, including commands, defaults, conditions, limits, and failure outcomes. Compare internal and cross-artifact meaning; polished prose can still make a false promise.
3. **Usability:** inspect prerequisites, concept definitions, causal relationships, actionable instructions, and success signals appropriate to the document role. Keep general teaching when the reader needs it; fixed order needs a correctness, safety or contract reason. Check conditional links for a clear reading purpose without hiding necessary local guidance. Test realistic reader questions against declared prerequisites, not knowledge hidden in the author conversation.
4. **Ownership:** check scope, duplicate authority, and choices disguised as settled decisions. Report unresolved product, operational, rollback, migration, or completion choices as ambiguity Findings when no authority resolves them; block only a dependent judgment that cannot coherently continue.
5. **Maintenance:** verify paths, links, anchors, terms and examples. Check purposeful paragraphs, actionable result steps, ordered sequences, parallel peers and stable notation. Distinguish empty repetition from useful summaries, substantive qualifiers, local safety context and purpose-required audit evidence.

Check ownership by meaning, not file shape. CONTEXT owns canonical terms, domain relationships, and navigation; AGENTS owns operating rules; README owns introduction and usage. Specs own current contracts and necessary constraints, including design-reference tables when they define normative evidence. Change Spec owns only the delta and acceptance; Design owns the approach, Tasks the work, and Verify the evidence. Decision Records own rationale. Short summaries and references are valid; parallel full definitions are not.

Within fixed work-record scope, check placement as well as truth: Focus holds recovery notes; Change/Brief holds converged results and limits; knowledge documents hold justified stable facts. Report missing final evidence or promoted chronology without hiding failures, relabelling reports or granting cleanup authority.

Prefer behavior that survives replaceable internals. Report a Spec/code discrepancy without assuming the implementation is correct. Specialized Spec headings and omitted unnecessary scenarios are not defects; scaffold hints are optional writing aids, not requirements or evidence. Material promises, decisions, and limits must remain visible outside comments. Do not request extra sections, tests, or bulk historical rewrites merely for template conformity.

For each finding, name the reader/task, exact evidence and violated authority or demonstrated consequence. Test whether readers can find information, understand conditions, act or judge compliance, and recognize unknowns. Agreed expression rules are contracts; unagreed taste is not a defect. Preserve helpful causal prose, navigation summaries and author voice. Do not demand contrasts or delete needed operations to shorten text; word counts, reference counts and format regexes cannot replace judgment.

Reading difficulty is evidence to investigate, not permission to invent facts or rewrite the document. Do not invoke Doc to apply findings during review. The five dimensions also guide writing, but Review uses this local reference and does not depend on Doc being installed. State whether reader comprehension was assessed locally or with actual independent evidence; never infer independence from a self-check or require a fixed number of rounds.

Before the Document verdict, enumerate every unresolved choice in each changed document. Any unresolved product, operational, rollback, migration, ownership, or completion choice must either have resolving authority or produce an ambiguity Finding; do not stop after finding other defects.

Anchor Findings to the smallest heading or claim. Do not apply code-style or test-coverage rules to semantic documents, auto-fix meaning, or rewrite prose for taste.
