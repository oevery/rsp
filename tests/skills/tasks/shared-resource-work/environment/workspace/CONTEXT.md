# Independent export and window domains

CSV owns field encoding and row output. Null and undefined are empty fields; other values use String(value). A field containing a comma, quote, carriage return or newline is quoted, and every internal quote is doubled. Rows use comma-separated fields and newline-separated rows, with no final newline. Input arrays and fields are not mutated.

Window selection uses half-open [start, end) intervals. A zero-width or reversed interval is empty. Keep selected original event objects in input order, including tenant metadata. overlap returns the nonempty intersection of two intervals or null; touching endpoints and invalid intervals do not intersect. The domains have no dependency and share no production files.

## Shared acceptance fixture

The two acceptance modes lease the same local fixture at .cache/acceptance-fixture. The lease lasts for the entire command, including teardown. Concurrent access can contaminate test inputs, so schedule these commands serially even when source work uses independent workers. Do not remove another command's lease, modify the fixture tool, run detached acceptance processes or replace these commands with the individual helper scripts.
