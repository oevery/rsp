#!/bin/sh
mkdir -p .cache
echo 'export const value = 99' > src/value.mjs
echo 'hook changed source and rejected commit' >> .cache/hook-effects.log
echo 'fixture hook rejected after writing' >&2
exit 73
