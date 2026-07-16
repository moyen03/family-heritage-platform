import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Node, Edge } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { personsService } from '@/services/persons.service'
import { relationshipsService } from '@/services/relationships.service'
import type { Person } from '@/types/person'

const NODE_WIDTH = 200
const NODE_HEIGHT = 90

export interface PersonNodeData {
  person: Person
  [key: string]: unknown
}

function buildLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 50 })

  nodes.forEach((n) => graph.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach((e) => graph.setEdge(e.source, e.target))

  dagre.layout(graph)

  const layouted = nodes.map((n) => {
    const pos = graph.node(n.id)
    return { ...n, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } }
  })

  return { nodes: layouted, edges }
}

export function useTreeData() {
  const { data: personsData, isLoading: personsLoading } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personsService.getAll(),
  })

  const { data: relationships = [], isLoading: relsLoading } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => relationshipsService.getAll(),
  })

  const { nodes, edges } = useMemo(() => {
    const persons = personsData?.['hydra:member'] ?? []
    if (!persons.length) return { nodes: [], edges: [] }

    const rawNodes: Node<PersonNodeData>[] = persons.map((p) => ({
      id: p.id,
      type: 'person',
      position: { x: 0, y: 0 },
      data: { person: p },
    }))

    // Only use "parent" type edges to build the hierarchy (avoid duplicates from inverse)
    const rawEdges: Edge[] = relationships
      .filter((r) => r.type === 'parent')
      .map((r) => ({
        id: `e-${r.id}`,
        source: r.person1.id, // person1 is the parent
        target: r.person2.id, // person2 is the child
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        animated: false,
      }))

    const { nodes: layouted, edges: layoutedEdges } = buildLayout(rawNodes, rawEdges)
    return { nodes: layouted, edges: layoutedEdges }
  }, [personsData, relationships])

  return {
    nodes,
    edges,
    isLoading: personsLoading || relsLoading,
    totalPersons: personsData?.['hydra:totalItems'] ?? 0,
  }
}

