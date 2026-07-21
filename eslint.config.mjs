import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'node_modules/',
    '.git/',
    'test/skill-behavior/fixtures/',
  ],
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
  },
})
