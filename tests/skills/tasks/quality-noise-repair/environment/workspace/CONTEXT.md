# Receiver settings contract

ReceiverLink is the existing vendor boundary and is immutable. NoiseController owns the displayed confirmed level, setting serialization and recovery. A setting consists of its write acknowledgement and confirmation readback; a later write must wait until both finish. Success requires readback of the requested level. Failed or unconfirmed requests must not publish their requested level.

An ACK timeout leaves correlation ambiguous on the current link. Pending and later settings reject without another wire write until an explicit refresh opens a new connection and reads the device. Refresh must not replay writes. After successful refresh, new settings work. The public level is null before the first confirmed observation. Valid levels are 0 through 3. Preserve the public methods and rejection behavior. Tests should protect these guarantees using the real controller and simulated vendor boundary.
