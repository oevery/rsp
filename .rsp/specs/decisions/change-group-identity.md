# Keep Change Group creation identity one-way

RSP does not allow a closed Change Group name to be created again for a new effort. Group completion derives declared child identity from open Changes and matching archive entries, so creation-time reuse would let old child archives satisfy a new Group without persisted generation identity. Later evidence may instead invalidate the original Group acceptance; that is continuation of the same logical owner and needs an explicit archive-preserving recovery path.

## Considered Options

- Allow names to be reused and treat every matching archive as current: rejected because a new Group could appear complete from an older Group's child archives.
- Add a persisted Group generation ID: rejected because it would add identity propagation and archive schema solely to support reopening.
- Force every incomplete archived child into a differently named corrective Group: rejected because it fragments one original acceptance and evidence chain.

## Consequences

- `rsp group create <group>` fails when an archived Group Brief already owns that identity.
- A genuinely new coordinated effort uses a new kebab-case Group name.
- `rsp group reopen <group> --reason <text> [--from <archive-path>]` may restore one exact retained Brief as unfinished continuation of the same identity only into absent-or-empty Group work and focus subtrees. Its completion evidence binds the selected archive path and reason, and must be absent from every retained Brief snapshot. It does not create a generation identity, focus work, or reopen children or dependents.
- Multiple retained Brief snapshots require an exact archive path; the CLI never infers the newest generation.
