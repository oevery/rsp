# Client ownership

- Desktop runtime owns device discovery and connection lifecycle.
- Web is a typed presentation projection and never discovers hardware directly.
- Runtime-neutral packages may own pure event normalization only; they cannot open devices.
