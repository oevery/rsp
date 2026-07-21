# Device discovery context

The desktop adapter emits raw `{ id, connected }` records. The package boundary must project them to immutable typed records, trim the device id, and reject an empty id. Physical receiver hardware is unavailable in this fixture, so automated tests cannot satisfy hardware acceptance.
