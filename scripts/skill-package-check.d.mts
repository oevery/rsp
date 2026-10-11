export function checkSkillPackage(directory: string, options?: { suiteRoot?: string }): {
  status: 'passed' | 'failed'
  errors: Array<{ path: string, code: string }>
}
