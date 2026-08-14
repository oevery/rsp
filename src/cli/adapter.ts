export interface CliCommandAdapter<TArgs, TResult> {
  execute: (args: TArgs) => TResult | Promise<TResult>
  present?: (result: TResult, args: TArgs) => void | Promise<void>
  exitCode?: (result: TResult, args: TArgs) => number | undefined
}

export async function executeCliCommand<TArgs, TResult>(
  adapter: CliCommandAdapter<TArgs, TResult>,
  args: TArgs,
): Promise<TResult> {
  const result = await adapter.execute(args)
  await adapter.present?.(result, args)
  const exitCode = adapter.exitCode?.(result, args)
  if (exitCode !== undefined)
    process.exitCode = exitCode
  return result
}
