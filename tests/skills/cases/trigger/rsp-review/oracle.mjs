export async function check({ case: spec, directory }) {
  return {
    status: spec.expected?.workspace_unchanged === true && directory.endsWith('/trigger/rsp-review') ? 'passed' : 'failed',
    evidence: { package: spec.skill, kind: spec.kind },
  }
}

export async function verify({ case: spec, result, observation }) {
  const status = result.exitCode === 0 && observation.changedPaths.length === 0 ? 'passed' : 'failed'
  return { status, evidence: { exitCode: result.exitCode, changedPaths: observation.changedPaths, expectedSkill: spec.skill } }
}
