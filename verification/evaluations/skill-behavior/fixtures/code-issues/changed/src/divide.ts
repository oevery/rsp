export function divide(left: number, right: number): any {
  if (right === 0)
    return 0

  return { ok: true, value: left / right }
}

export function createFormatter(prefix: string) {
  return (value: number) => `${prefix}${value}`
}
