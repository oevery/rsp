// @ts-check
import { parseDocument } from 'yaml'

/**
 * Validate syntax before exposing a YAML Document to value or mutation consumers.
 * @param {string} source
 */
export function parseYamlDocument(source) {
  const document = parseDocument(source, { keepSourceTokens: true })
  if (document.errors.length)
    throw new Error(document.errors.map(error => error.message).join('; '))
  return document
}

/**
 * @param {import('yaml').Document} document
 * @returns {Record<string, unknown>} Mapping values for consumers that require an object.
 */
export function yamlMapping(document) {
  const value = document.toJS()
  if (value === null || value === undefined)
    return {}
  if (typeof value !== 'object' || Array.isArray(value))
    throw new Error('YAML document must be a mapping/object')
  return value
}
