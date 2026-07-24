export async function resolve(specifier, context, nextResolve) {
  if (/(?:^|\/)(?:ink|react|react-reconciler|yoga-wasm-web)(?:\/|$)/.test(specifier))
    throw new Error(`interactive dependency loaded: ${specifier}`)
  return nextResolve(specifier, context)
}
