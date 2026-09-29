# Coordinated review convergence

Load this reference only after an evidenced same-scope correction is needed, a fixed-scope re-review returns Findings, or an accepted in-scope Finding may require another bounded Resolve Findings pass.

An evidenced same-scope failure permits at most three worker correction passes by default. Stop earlier on repeated evidence, non-convergence, changed scope or authority, unsafe replay, unavailable capability, or unverifiable correction. Required independent Verify remains a separate obligation.

After fixed-scope re-review, Core correlates the report with the selected Change, original authority, fresh verification, and transient pass count. An `accepted` Finding starts another Implement finding-resolution pass without asking the user to continue only when it remains inside the original behavior, acceptance, paths, mutation authority, and declared verification scope. Implement never self-certifies review-clean.

Allow at most three finding-resolution passes per Change, separate from the worker retry limit. Stop when the same Finding remains after two completed corrections. Also stop for `needs-clarification`; a material product, interface, or scope change; new mutation or external authority; an additional real-host, provider, or network run outside existing verification authority; or failed or unavailable decisive verification. Return one owner input. Treat an eligible in-scope Finding as `correction-needed`, not an external blocker. Keep counts and correction chronology transient.
