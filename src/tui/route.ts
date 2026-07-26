export interface TerminalRouteEnvironment {
  stdinTty: boolean
  stdoutTty: boolean
  term?: string
  ci?: string
}

export type UiLanguageArgument = 'auto' | 'en' | 'zh-CN'

export function isInteractiveTerminal(environment: TerminalRouteEnvironment): boolean {
  return environment.stdinTty && environment.stdoutTty && environment.term !== 'dumb'
}

export function shouldAutoLaunchUi(args: string[], environment: TerminalRouteEnvironment): boolean {
  return args.length === 0
    && isInteractiveTerminal(environment)
    && (environment.ci === undefined || environment.ci === 'false')
}

export function shouldLaunchSkillsUi(args: string[], environment: TerminalRouteEnvironment): boolean {
  return args.length === 1
    && args[0] === 'skills'
    && isInteractiveTerminal(environment)
    && (environment.ci === undefined || environment.ci === 'false')
}

export function validateUiArgs(args: string[]): { lang: UiLanguageArgument } {
  let lang: UiLanguageArgument = 'auto'
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument !== '--lang')
      throw new Error(`Unknown rsp ui option: ${argument}`)
    const value = args[index + 1]
    if (value !== 'auto' && value !== 'en' && value !== 'zh-CN')
      throw new Error('--lang must be auto, en, or zh-CN')
    lang = value
    index += 1
  }
  return { lang }
}
