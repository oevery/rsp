# Keep Change Group identity one-way

RSP does not allow a closed Change Group name to be created again. Group completion derives declared child identity from open Changes and matching archive entries, so reusing the same Group and child names would make old and new archive generations indistinguishable without adding persistent run IDs, timestamps, or another lifecycle layer; one-way identity keeps the shallow file protocol deterministic.

## Considered Options

- Allow names to be reused and treat every matching archive as current: rejected because a new Group could appear complete from an older Group's child archives.
- Add a persisted Group generation ID: rejected because it would add identity propagation and archive schema solely to support reopening.

## Consequences

- `rsp group create <group>` fails when an archived Group Brief already owns that identity.
- A genuinely new coordinated effort uses a new kebab-case Group name.
- Reopening would require an explicit future model change with generation-aware archive association.
