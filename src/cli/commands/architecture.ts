import { defineCommand } from 'citty'
import { queryArchitecture } from '../../architecture/model.js'
import { compactJsonArgs } from '../capabilities.js'

export const architectureCommand = defineCommand({
  meta: { name: 'architecture', description: 'Read full or selected architecture structure without document bodies' },
  args: { node: { type: 'string', description: 'Node and descendants' }, view: { type: 'string', description: 'Explicit view selection' }, ...compactJsonArgs },
  async run({ args }) {
    const unknown = Object.keys(args).filter(key => !['node', 'view', 'json', 'compact', '_'].includes(key))
    if (unknown.length || args._.length)
      throw new Error(`Unsupported architecture options/arguments: ${[...unknown, ...args._].join(', ')}`)
    const result = await queryArchitecture({ node: args.node, view: args.view })
    if (args.json) {
      console.log(JSON.stringify(result, null, args.compact ? undefined : 2))
    }
    else {
      console.log(`Architecture: ${result.configured ? result.source.root : 'not configured'}\nSelection: ${result.selection.kind}${result.selection.id ? ` ${result.selection.id}` : ''}`)
      for (const node of result.nodes) {
        console.log(`${node.boundary ? '[boundary] ' : ''}${node.id}: ${node.title} — ${node.description}${node.parent ? ` (parent: ${node.parent})` : ''}`)
        for (const binding of node.bindings) console.log(`  ${binding.file}${binding.headings ? ` > ${binding.headings.join(' > ')}` : ''} (scope: ${binding.scope}; ${binding.inherited ? `inherited from ${binding.origin}` : `direct on ${binding.origin}`})`)
      }
      for (const edge of result.relations) console.log(`Relation ${edge.id}: ${edge.source} -> ${edge.target} [${edge.type}]: ${edge.description}`)
      for (const view of result.views) console.log(`View ${view.id}: ${view.title} (owner: ${view.node}; include: ${view.include.join(', ')})`)
      for (const diagnostic of result.diagnostics) console.log(`${diagnostic.code}: ${diagnostic.message}`)
      if (result.configured)
        console.log(`Source: ${result.source.file} @ ${result.source.revision}`)
    }
  },
})

export const viewCommand = defineCommand({
  meta: { name: 'view', description: 'Open the shared local architecture viewer, inspect or stop its service' },
  args: { action: { type: 'positional', required: false, description: 'status or stop; omit to open' }, open: { type: 'boolean', default: true, description: 'Open browser (use --no-open to print URL only)' } },
  async run({ args }) {
    const unknown = Object.keys(args).filter(key => !['action', 'open', '_'].includes(key))
    if (unknown.length || args._.length > 1 || (args.action && !args.open))
      throw new Error('rsp view accepts only an optional status/stop action or --no-open')
    const { runView } = await import('../../viewer/client.js')
    await runView(args.action, args.open)
  },
})
