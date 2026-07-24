# Device discovery boundary

## Ownership

- The desktop runtime owns physical device discovery and the device connection lifecycle.
- The runtime-neutral `device-discovery` package only projects device events into normalized immutable typed records; it does not open devices or retain connection state.
- Web consumes typed device projections and does not directly discover hardware.

## Acceptance boundary

- Receiver hardware acceptance remains unavailable and human owned.
- Automated tests validate the event-projection behavior only; they are not hardware acceptance.
