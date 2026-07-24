# Device Discovery Boundary

## Ownership

- The desktop runtime owns physical device discovery and connection lifecycle.
- Web consumes typed device records and does not discover hardware or open hardware APIs.
- `client/packages/device-discovery` is runtime-neutral. It owns only pure event normalization and has no dependency on desktop or Web.

## Projection Seam

`projectDeviceEvent(input: { id: string; connected: boolean })` is the public boundary from a desktop adapter's raw record to runtime-neutral consumers.

- It trims `id` and rejects an empty trimmed id with a device-id error.
- It preserves `connected` and returns an immutable `{ id, connected }` record.
- It performs no discovery, connection, I/O, event subscription, or lifecycle policy.

## Acceptance Boundary

Focused automated tests verify normalization, empty-id rejection, and immutability. They are not receiver hardware acceptance.

Receiver hardware acceptance remains unavailable and is human owned.
