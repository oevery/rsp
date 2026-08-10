# Managed review convergence

Load this reference only after a fixed-scope re-review returns Findings or when an accepted in-scope Finding may require another bounded Resolve Findings pass.

After fixed-scope re-review, Manage correlates the report with the selected Change, original authority, fresh verification, and transient pass count. An `accepted` Finding starts another Resolve Findings pass without asking the user to continue only when it remains inside the original behavior, acceptance, paths, mutation authority, and declared verification scope. When the optional runtime is available, observe this already-derived review result and any bounded attention only after correlation; runtime history never decides whether a Finding is accepted. Resolve Findings never self-loops.

Allow at most three Resolve Findings passes per Change, separate from the worker retry limit. Stop when the same Finding remains after two completed corrections. Also stop for `needs-clarification`; a material product, interface, or scope change; new mutation or external authority; an additional real-host, provider, or network run outside existing verification authority; or failed or unavailable decisive verification. Return one owner input. Treat an eligible in-scope Finding as `correction-needed`, not an external blocker. Keep counts and correction chronology transient.
