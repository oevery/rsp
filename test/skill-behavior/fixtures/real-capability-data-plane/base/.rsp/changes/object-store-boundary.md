# Change: object-store-boundary

## Intent

Add a control-plane request that prepares an object-store upload, then send the bytes through a data-plane transport.

## Boundary

The data-plane transport may receive only the upload URL, approved headers, and bytes. Workspace identity, completion tokens, and audit context remain in the control plane even when structural typing permits a wider value.

## Verification

Tests must prove both that required upload fields arrive and that control-plane-only fields do not cross the transport boundary.
