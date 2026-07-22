# Fixture rules

- `.rsp/changes/normalize-transport-inputs.md` is the only product authority.
- Header and retry slices use disjoint implementation and focused-test files and may be worked independently.
- Mutation is limited to the files named by the request.
- Use `npm test` for automated acceptance.
- Manual or external actions remain pending unless explicitly authorized.
- Return human-facing status in Simplified Chinese.
