import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { Script } from 'node:vm'
import ts from 'typescript'
import { expect, it } from 'vitest'

const corpus = JSON.parse(readFileSync(new URL('../fixtures/command-construction/native-calls.json', import.meta.url), 'utf8'))
const rawChain = JSON.parse(readFileSync(new URL('../fixtures/command-construction/raw-template-chain.json', import.meta.url), 'utf8'))

// Compile only: captured source can write files, spawn workers and touch Git.
// Never run this Script, evaluate an AST, or execute a captured command.
function compileWrapper(input) {
  return new Script(`(async function capturedCall() {\n${input}\n})`)
}

function commands(input) {
  const source = ts.createSourceFile('captured.js', input, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const found = []
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'tools.exec_command') {
      const argument = node.arguments[0]
      expect(ts.isObjectLiteralExpression(argument)).toBe(true)
      const property = argument.properties.find(item => ts.isPropertyAssignment(item) && item.name.getText(source) === 'cmd')
      expect(property, 'Only reviewed literal cmd arguments are supported').toBeDefined()
      const value = property.initializer
      if (ts.isTaggedTemplateExpression(value)) {
        expect(value.tag.getText(source), 'Only the reviewed String.raw tag is supported').toBe('String.raw')
        expect(ts.isNoSubstitutionTemplateLiteral(value.template), 'Interpolated templates must not be evaluated').toBe(true)
        const raw = value.template.getText(source).slice(1, -1)
        // Restrict this decoder to LF sources; JS normalizes CR/CRLF in templates.
        expect(raw.includes('\r'), 'Only LF raw template sources are supported').toBe(false)
        found.push(raw)
      }
      else {
        expect(ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value), 'Only reviewed literal cmd arguments are supported').toBe(true)
        // The parser exposes the cooked literal without executing JavaScript.
        found.push(value.text)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  expect(found.length).toBeGreaterThan(0)
  return found
}

function diagnose(input) {
  try {
    compileWrapper(input)
  }
  catch (error) {
    expect(error.name).toBe('SyntaxError')
    return { layer: 'javascript', message: error.message }
  }
  let pythonBodies = 0
  for (const command of commands(input)) {
    // No startup files or inherited command hooks; bash receives -n, never -c.
    const shell = spawnSync('bash', ['--noprofile', '--norc', '-n'], {
      input: command,
      encoding: 'utf8',
      timeout: 5000,
      env: { PATH: process.env.PATH },
    })
    expect(shell.error).toBeUndefined()
    expect(shell.signal).toBeNull()
    if (shell.status !== 0)
      return { layer: 'shell', message: shell.stderr }
    const bodies = [...command.matchAll(/\bpython3? - <<'([A-Z]+)'\n([\s\S]*?)\n\1(?=\n|$)/g)]
    if (command.includes('<<'))
      expect(bodies.length, 'Uninspected heredoc must not silently pass').toBeGreaterThan(0)
    for (const body of bodies) {
      pythonBodies++
      const python = spawnSync('python3', ['-I', '-c', 'import sys; compile(sys.stdin.read(), "<captured-heredoc>", "exec")'], {
        input: body[2],
        encoding: 'utf8',
        timeout: 5000,
        env: { PATH: process.env.PATH },
      })
      expect(python.error).toBeUndefined()
      expect(python.signal).toBeNull()
      if (python.status !== 0) {
        expect(python.stderr).toContain('SyntaxError')
        return { layer: 'python', message: python.stderr }
      }
    }
  }
  return { layer: 'none', pythonBodies }
}

it('reproduces the first failing layer of seven native calls and parses their five observed successors', () => {
  const outcomes = []
  for (const sample of corpus.cases) {
    expect(createHash('sha256').update(sample.input).digest('hex'), sample.callId).toBe(sample.inputSha256)
    const result = diagnose(sample.input)
    expect(result.layer, `${sample.callId}: ${result.message || ''}`).toBe(sample.expectedLayer)
    if (sample.expectedLayer === 'python')
      expect(result.message).toContain('unterminated string literal')
    outcomes.push({ callId: sample.callId, expected: sample.expectedLayer, observed: result.layer })
  }
  expect(outcomes.filter(item => item.observed === 'javascript')).toHaveLength(5)
  expect(outcomes.filter(item => item.observed === 'python')).toHaveLength(2)
  expect(outcomes.filter(item => item.observed === 'none')).toHaveLength(5)
  console.info(JSON.stringify({ syntaxOnly: true, capturedCodeExecuted: false, outcomes }))
})

it('preserves Python escape bytes when a corrected command is serialized as a JavaScript argument', () => {
  for (const sample of corpus.cases.filter(item => item.expectedLayer === 'python')) {
    const [command] = commands(sample.input)
    const corrected = command.replace('+\'\n\'', '+\'\\n\'').replace('b\'A\n\'', 'b\'A\\n\'')
    expect(corrected).not.toBe(command)
    // JSON encoding is used only for the JS argument, never as shell escaping.
    const wrapper = `text(await tools.exec_command({cmd: ${JSON.stringify(corrected)}}));`
    compileWrapper(wrapper)
    expect(commands(wrapper)).toEqual([corrected])
    expect(diagnose(wrapper)).toMatchObject({ layer: 'none', pythonBodies: 1 })
  }
})

it('reproduces the retained wrapper-to-Python failure chain and both raw-template successors', () => {
  const outcomes = []
  for (const sample of rawChain.cases) {
    expect(createHash('sha256').update(sample.input).digest('hex')).toBe(sample.inputSha256)
    const result = diagnose(sample.input)
    expect(result.layer, sample.callId).toBe(sample.expectedLayer)
    if (sample.dispatchedCommand === null) {
      expect(result.layer).toBe('javascript')
      expect(sample.exitCode).toBeNull()
      expect(JSON.stringify(sample.toolOutput)).toContain('Invalid or unexpected token')
    }
    else {
      // Native CommandExecution bytes are the independent decoding oracle.
      expect(commands(sample.input)).toEqual([sample.dispatchedCommand])
      expect(sample.exitCode).toBe(result.layer === 'python' ? 1 : 0)
      if (result.layer === 'python')
        expect(result.message).toContain('unterminated string literal')
      else
        expect(result.pythonBodies).toBe(1)
    }
    outcomes.push(result.layer)
  }
  expect(outcomes).toEqual(['javascript', 'python', 'none', 'none'])
  expect(rawChain.cases.map(sample => sample.nextCallId)).toEqual([...rawChain.cases.slice(1).map(sample => sample.callId), null])
})

it('keeps raw escape bytes without evaluating interpolations, tags or command expressions', () => {
  const tick = String.fromCharCode(96)
  const raw = String.raw`printf '%s' '\n' '\\' '\u0041' '\x41'`
  const wrapper = `text(await tools.exec_command({cmd: String.raw${tick}${raw}${tick}}));`
  compileWrapper(wrapper)
  expect(commands(wrapper)).toEqual([raw])
  const encoded = `text(await tools.exec_command({cmd: ${JSON.stringify(raw)}}));`
  expect(commands(encoded)).toEqual([raw])
  const interpolation = ['$', '{danger()}'].join('')
  for (const expression of [
    `String.raw${tick}echo ${interpolation}${tick}`,
    `${tick}echo ${interpolation}${tick}`,
    `otherTag${tick}echo safe${tick}`,
    'String.raw({raw: [danger()]})',
    'danger()',
    `String.raw${tick}echo first\r\necho second${tick}`,
  ]) {
    const input = `text(await tools.exec_command({cmd: ${expression}}));`
    compileWrapper(input)
    expect(() => commands(input)).toThrow()
  }
})
