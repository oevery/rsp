# External release ingestion

These release bytes do not come from Git and cannot be reconstructed from a repository commit. ingest(bytes, expectedDigest, destination) receives an expected SHA-256 from a trusted release channel. Compute the incoming digest and reject mismatch before publishing bytes. Rejection must leave an existing destination unchanged.

Success publishes the original bytes and returns exactly digest and size. Do not mutate the input buffer. The integrity check has an independent release-acceptance consumer. Preserve the public function and rejection behavior.
