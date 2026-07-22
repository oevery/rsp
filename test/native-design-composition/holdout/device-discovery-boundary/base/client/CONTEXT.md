# Device discovery context

The desktop adapter emits raw `{ id, connected }` records. The runtime-neutral boundary must project them to immutable typed records, trim the device id, and reject an empty id. Physical receiver hardware is unavailable, so automated tests cannot satisfy hardware acceptance.
