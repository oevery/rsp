# Device discovery boundary

The desktop runtime owns physical device discovery and connection lifecycle.
The runtime-neutral `device-discovery` package only projects device events into
immutable typed records; it does not open, discover, or control hardware.
Web consumes the typed projection and does not directly discover hardware.

## Acceptance boundary

Receiver hardware acceptance is currently unavailable and remains human owned.
Automated tests cover the projection contract only; they are not hardware
acceptance.
