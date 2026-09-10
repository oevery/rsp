# Dataset conventions

Active cases are co-located under `behaviors/<case>/` and `workflows/<case>/`. Only immediate directories with `case.yaml` are discovered by the new commands. No registry duplicates that list.

Nested collections such as `workflows/managed-controller/` retain fixtures, holdouts and comparison plans for existing specialized callers. Their `fixtures/`, `holdout/`, `beta/`, `base/` and `changed/` directories are input data, not repository tests or mandatory default coverage.

Keep single-owner fixtures local. Share through an explicit relative reference only for actual shared consumers. Source fixtures are read-only during evaluation; prepared workspaces and raw provider evidence are local artifacts.

Historical reports under `research/evaluations/` and existing caches retain their original paths and hashes. Do not rewrite them or assert their hashes against current source in ordinary tests. Explicit evidence reuse still requires identity compatibility.
