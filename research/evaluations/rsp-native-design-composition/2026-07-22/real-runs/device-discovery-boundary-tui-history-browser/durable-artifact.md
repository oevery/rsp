# Device Discovery Boundary

## Ownership and dependency direction

- The desktop runtime exclusively owns physical receiver discovery, connection lifecycle, and emission of raw `{ id, connected }` records.
- `client/packages/device-discovery` owns runtime-neutral projection of those records.
- Dependencies flow from the desktop adapter to `device-discovery`, then to desktop or Web consumers. The package does not import desktop runtime, browser, Electron, or hardware APIs.
- The Web layer is a typed presentation projection of already-projected data. It neither discovers hardware nor imports a discovery adapter.

## Runtime-neutral projection

- `projectDeviceEvent` in `client/packages/device-discovery/src/index.ts` is the single synchronous projection seam.
- It trims a device identifier, rejects an empty post-trim identifier, preserves the boolean `connected` value, and returns a newly allocated frozen typed record.
- The seam does not open devices, retain connection state, subscribe to or emit events, select presentation behavior, or define ordering, cancellation, configuration, or hardware-availability behavior.

## Acceptance boundary

- Receiver hardware acceptance remains unavailable and human owned.
- Automated tests verify the runtime-neutral projection contract only; they are not receiver hardware acceptance.
