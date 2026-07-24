# Device discovery boundary

`client/packages/device-discovery` owns the runtime-neutral projection of device events. It exports `projectDeviceEvent(input: { connected: boolean, id: string })`, which returns an immutable `DeviceEvent` record.

The projection trims `id`, rejects an empty trimmed id, and preserves `connected`. It has no device I/O, configuration, ordering, cancellation, or lifecycle responsibilities.

Desktop owns physical device discovery and connection lifecycle, and passes raw `{ id, connected }` records to the projection. Web consumes projected typed records and does not discover hardware directly. The runtime-neutral package does not import desktop or Web code.
