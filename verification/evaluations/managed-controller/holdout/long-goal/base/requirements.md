# Delivery envelope requirements

- Header: trim and lowercase a non-empty header name; reject empty input.
- Retry: accept only integer counts from zero through five.
- Summary: after Header is accepted, combine its normalized value with a valid Retry count as `header:retry`.

These are three independently verifiable outcomes under one delivery-envelope goal. Header and Retry have no dependency or shared mutation path. Summary depends on accepted Header behavior.
