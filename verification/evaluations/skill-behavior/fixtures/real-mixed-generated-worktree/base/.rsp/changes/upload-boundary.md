# Change: upload-boundary

## Spec

The control plane may return an upload URL, object key, request headers, a short-lived credential, and audit metadata. The data-plane transport must receive a newly projected object containing only `uploadUrl`, `objectKey`, and `headers`. Generated contracts may change, but handwritten adapters own this runtime boundary. Tests must observe the exact object passed to the transport.

Rename `upload-policy.ts` to `data-plane-policy.ts` without changing its public behavior, and remove the unused legacy uploader.

## Verify

- `npm test`
