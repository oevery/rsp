import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'node_modules/',
    '.git/',
    'evals/reports/',
    'tests/skills/reports/',
    'tests/skills/projects/**',
    'research/evaluations/rsp-skill-runtime-context/*/inputs/**/prompt.md',
    'research/evaluations/rsp-skill-runtime-context/*/runs/**/final.json',
    'research/evaluations/rsp-skill-runtime-context/*/run.mjs',
  ],
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
  },
})
