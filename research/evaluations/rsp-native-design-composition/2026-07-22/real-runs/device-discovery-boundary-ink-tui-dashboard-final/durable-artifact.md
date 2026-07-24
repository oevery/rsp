# Device discovery boundary

## Ownership

- Desktop owns physical device discovery and connection lifecycle.
- Web is a typed presentation projection and does not discover hardware directly.
- `client/packages/device-discovery` owns runtime-neutral device-event projection.

## Runtime-neutral seam

- `projectDeviceEvent(input)` is the public pure boundary for raw `{ id, connected }` records from the desktop adapter.
- The projection trims `id`, rejects an empty trimmed id, preserves `connected`, and returns a frozen `{ id, connected }` record.
- The runtime-neutral package does not import desktop or Web code, open devices, or retain discovery state.

## Verification boundary

- Focused unit tests cover normalization, empty-id rejection, and immutability through `projectDeviceEvent`.
- Receiver hardware acceptance is unavailable because receiver hardware is unavailable; unit tests do not establish hardware acceptance.
