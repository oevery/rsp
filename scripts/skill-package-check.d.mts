export function checkSkillPackage(directory: string): {
  status: 'passed' | 'failed'
  errors: Array<{ path: string, code: string }>
}
