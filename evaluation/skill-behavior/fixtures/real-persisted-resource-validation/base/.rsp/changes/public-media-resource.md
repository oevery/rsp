# Change: public-media-resource

## Spec

Only credential-free HTTP(S) media URLs are playable and deliverable. Persisted records are untrusted: preview, delivery readiness, and playback must all use the same normalized eligibility result. Malformed URLs, non-HTTP(S) schemes, and URLs containing credentials remain unavailable. A valid public HTTP(S) URL remains available.

## Verify

- `npm test`
