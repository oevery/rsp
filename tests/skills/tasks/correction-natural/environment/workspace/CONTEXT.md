# Record expiry

visibleRecords(records, now) returns the original record objects in their existing order, without mutating the array or records. An expiresAt timestamp is exclusive: a record is visible only before that instant. A null or absent expiresAt means no expiry. Timestamps are finite integer milliseconds and may be zero or negative. Records from different tenants retain their identity and payload. The task instruction owns correction authority and review obligations; no lifecycle or delivery action is authorized.
