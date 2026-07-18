import { useQuery } from '@tanstack/react-query'
import type { Node, Edge } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { personsService } from '@/services/persons.service'
import { relationshipsService } from '@/services/relationships.service'
import type { Person } from '@/types/person'
import type { Relationship } from '@/types/relationship'

const NODE_WIDTH = 210
const NODE_HEIGHT = 100

// Relationship types that form parent→child tree edges
const PARENT_TYPES = new Set(['parent', 'step_parent', 'adopted_parent'])

export interface PersonNodeData {
  person: Person
  hasChildren: boolean
  isCollapsed: boolean
  collapsedChildCount: number
  onSelect?: (id: string) => void
  onHighlightAncestors?: (id: string) => void
  onHighlightDescendants?: (id: string) => void
  onToggleCollapse?: (id: string) => void
  isSelected?: boolean
  highlightState?: 'ancestor' | 'descendant' | 'dimmed' | null
  [key: string]: unknown
}

function edgeStyle(type: string): Pick<Edge, 'style' | 'label' | 'labelStyle' | 'labelBgStyle' | 'markerEnd'> {
  switch (type) {
    case 'step_parent':
      return {
        style: { stroke: '#f97316', strokeWidth: 2, strokeDasharray: '6 4' },
        label: 'step',
        labelStyle: { fontSize: 9, fill: '#f97316', fontWeight: 600 },
        labelBgStyle: { fill: 'white', fillOpacity: 0.85 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#f97316' },
      }
    case 'adopted_parent':
      return {
        style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '6 4' },
        label: 'adopted',
        labelStyle: { fontSize: 9, fill: '#8b5cf6', fontWeight: 600 },
        labelBgStyle: { fill: 'white', fillOpacity: 0.85 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#8b5cf6' },
      }
    default:
      return {
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#94a3b8' },
      }
  }
}

/**
 * Build a Dagre-layouted React Flow graph from persons + relationships,
 * respecting collapsed nodes (their entire subtrees are hidden).
 */
export function buildTreeLayout(
  persons: Person[],
  relationships: Relationship[],
  collapsedIds: Set<string>,
): { nodes: Node<PersonNodeData>[]; edges: Edge[] } {
  if (!persons.length) return { nodes: [], edges: [] }

  // Build parent→children map from all parent-type relationships
  const childrenOf = new Map<string, Set<string>>()
  relationships
    .filter((r) => PARENT_TYPES.has(r.type))
    .forEach((r) => {
      if (!childrenOf.has(r.person1.id)) childrenOf.set(r.person1.id, new Set())
      childrenOf.get(r.person1.id)!.add(r.person2.id)
    })

  // BFS to compute all hidden IDs (descendants of collapsed nodes)
  const hiddenIds = new Set<string>()
  for (const cId of collapsedIds) {
    const queue = [...(childrenOf.get(cId) ?? [])]
    while (queue.length) {
      const id = queue.shift()!
      if (!hiddenIds.has(id)) {
        hiddenIds.add(id)
        childrenOf.get(id)?.forEach((c) => queue.push(c))
      }
    }
  }

  const visiblePersons = persons.filter((p) => !hiddenIds.has(p.id))
  const visibleRels = relationships.filter(
    (r) => PARENT_TYPES.has(r.type) && !hiddenIds.has(r.person1.id) && !hiddenIds.has(r.person2.id),
  )

  // Dagre layout
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'TB', ranksep: 180, nodesep: 80, marginx: 40, marginy: 40 })
  visiblePersons.forEach((p) => graph.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  visibleRels.forEach((r) => graph.setEdge(r.person1.id, r.person2.id))
  dagre.layout(graph)

  const nodes: Node<PersonNodeData>[] = visiblePersons.map((p) => {
    const pos = graph.node(p.id)
    const children = childrenOf.get(p.id) ?? new Set()
    return {
      id: p.id,
      type: 'person',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        person: p,
        hasChildren: children.size > 0,
        isCollapsed: collapsedIds.has(p.id),
        collapsedChildCount: collapsedIds.has(p.id) ? children.size : 0,
      },
    }
  })

  const edges: Edge[] = visibleRels.map((r) => ({
    id: `e-${r.id}`,
    source: r.person1.id,
    target: r.person2.id,
    type: 'smoothstep',
    animated: false,
    ...edgeStyle(r.type),
  }))

  return { nodes, edges }
}

export function useTreeData() {
  const { data: personsData, isLoading: personsLoading, isError: personsError } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personsService.getAll(),
  })

  const { data: relationships = [], isLoading: relsLoading } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => relationshipsService.getAll(),
  })

  const { data: marriages = [], isLoading: marriagesLoading } = useQuery({
    queryKey: ['marriages'],
    queryFn: () => relationshipsService.getAllMarriages(),
  })

  const persons: Person[] = personsData?.['member'] ?? personsData?.['hydra:member'] ?? []

  return {
    persons,
    relationships,
    marriages,
    isLoading: personsLoading || relsLoading || marriagesLoading,
    isError: personsError,
    totalPersons: personsData?.['totalItems'] ?? personsData?.['hydra:totalItems'] ?? 0,
  }
}
