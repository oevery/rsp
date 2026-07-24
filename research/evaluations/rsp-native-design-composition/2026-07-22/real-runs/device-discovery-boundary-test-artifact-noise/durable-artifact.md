# Device Discovery Boundary

## Ownership

- The desktop runtime owns physical device discovery and connection lifecycle.
- The runtime-neutral `device-discovery` package only projects device events; it does not open devices or depend on desktop or Web runtime APIs.
- Web may consume typed device-event projections, but it does not directly discover hardware.

## Acceptance Boundary

- Receiver hardware acceptance remains unavailable and human owned.
- Automated tests verify the runtime-neutral projection seam; they are not hardware acceptance.
