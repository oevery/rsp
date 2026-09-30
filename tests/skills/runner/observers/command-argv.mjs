export function literalArgv(source) {
  if (typeof source !== 'string')
    return null
  const args = []
  let word = ''
  let quote = null
  let started = false
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (quote) {
      if (char === quote) {
        quote = null
      }
      else if (quote === '"' && ['$', '`'].includes(char)) {
        return null
      }
      else if (quote === '"' && char === '\\') {
        if (!['\\', '"'].includes(source[index + 1]))
          return null
        word += source[++index]
      }
      else {
        word += char
      }
    }
    else if (char === '"' || char === '\'') {
      quote = char
      started = true
    }
    else if (char === ' ' || char === '\t') {
      if (started)
        args.push(word)
      word = ''
      started = false
    }
    else if (/^[\w./=:-]$/u.test(char)) {
      word += char
      started = true
    }
    else {
      return null
    }
  }
  if (quote)
    return null
  if (started)
    args.push(word)
  return args
}

export function matchesCommand(observed, expected, workspaceRoot) {
  let actual = literalArgv(observed)
  const wanted = literalArgv(expected)
  if (actual?.length === 3 && ['/bin/sh', '/bin/bash', '/bin/zsh'].includes(actual[0]) && ['-c', '-lc'].includes(actual[1]))
    actual = literalArgv(actual[2])
  if (!actual || !wanted || actual.length !== wanted.length)
    return false
  return actual.every((value, index) => {
    if (value === wanted[index])
      return true
    // Resolve only exact fixture-relative path operands, not arbitrary flags
    // or parent traversal. The root comes from host observation, not the case.
    const path = wanted[index]
    return !path.startsWith('-') && /\/|\.[\w-]+$/u.test(path) && !path.split('/').includes('..')
      && (value === `./${path}` || (typeof workspaceRoot === 'string' && value === `${workspaceRoot}/${path}`))
  })
}
