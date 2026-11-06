import type { ArchitectureResult } from '../../../architecture/model.js'
import type { DiagramSelection } from './selection.js'
import { useLocale } from '../i18n.js'
import { Button } from '../ui/primitives.js'

export function RelationshipRow({ relation, architecture, drawnRelations, projection, select }: { relation: ArchitectureResult['relations'][number], architecture: ArchitectureResult, drawnRelations: Set<string>, projection: DiagramSelection['projection'], select: (node: string, relation?: string) => void }) {
  const { t } = useLocale()
  return (
    <Button className="relationship-row" key={relation.id} onClick={() => select('', relation.id)}>
      <span>
        {architecture.nodes.find(node => node.id === relation.source)?.title}
        {' '}
        →
        {' '}
        {architecture.nodes.find(node => node.id === relation.target)?.title}
      </span>
      <small>
        {relation.label ?? relation.type}
        {' '}
        ·
        {' '}
        {relation.description}
        {!drawnRelations.has(relation.id) && projection?.relations.includes(relation) ? ` · ${t('notDrawn')}` : ''}
      </small>
    </Button>
  )
}
