import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['node_modules/', '.git/'],
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
  },
})
