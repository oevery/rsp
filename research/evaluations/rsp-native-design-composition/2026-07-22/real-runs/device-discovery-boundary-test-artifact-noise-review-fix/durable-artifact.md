# Device discovery boundary

## Ownership

- The desktop runtime owns physical device discovery and the connection lifecycle.
- The runtime-neutral `client/packages/device-discovery` package only projects device events; it does not open devices or depend on desktop or receiver hardware.
- Web is a typed presentation projection and does not directly discover hardware.

## Acceptance boundary

- Receiver hardware acceptance is unavailable and remains human owned.
- Automated tests verify the runtime-neutral event projection only; they are not hardware acceptance.
