# Device Discovery Boundary

## Ownership

- The desktop runtime owns physical device discovery and connection lifecycle.
- The Web layer is a typed presentation consumer and does not discover hardware or import a hardware adapter.
- `client/packages/device-discovery` is runtime-neutral. It owns pure device-event projection only and has no desktop or Web dependency.

## Projection seam

- `projectDeviceEvent(input: { connected: boolean, id: string })` is the public boundary from raw desktop-adapter records to typed presentation records.
- The projection trims `id`, rejects an empty trimmed identifier, preserves `connected`, and returns a frozen `DeviceEvent` record.
- The package owns no receiver access, transport, lifecycle state, retry policy, connection opening, or device discovery.

## Verification limit

- Focused automated tests cover normalization, immutability, and empty-identifier rejection.
- Physical receiver hardware acceptance is unavailable and remains human owned; automated tests do not establish hardware acceptance.
