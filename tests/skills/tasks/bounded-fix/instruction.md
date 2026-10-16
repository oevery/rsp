A record is still visible at the exact instant it expires. Fix the expiry filter in /app and verify the boundary behavior against CONTEXT.md. The existing check is node tools/check.mjs.

The correction is authorized in src/expiry.mjs. Preserve caller inputs, user notes, existing staged/unstaged/untracked work and the Git index. Tests and project instructions are acceptance inputs. Temporary probes may use tmp/ or .cache/. No commit or publication is authorized. Explain the result and the checks you actually ran in your final response.
