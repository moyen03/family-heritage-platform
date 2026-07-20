import { useQuery, useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { MarkerType } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { personsService } from '@/services/persons.service'
import { relationshipsService } from '@/services/relationships.service'
import { branchesService } from '@/services/branches.service'
import type { Person } from '@/types/person'
import type { Relationship, Marriage } from '@/types/relationship'

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
 * Build a Dagre-layouted React Flow graph from persons + relationships + marriages.
 * Marriages are added to Dagre as lightweight edges so spouses are placed close together,
 * then a post-layout pass aligns same-generation spouses to the same Y coordinate.
 */
export function buildTreeLayout(
  persons: Person[],
  relationships: Relationship[],
  marriages: Marriage[],
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
  const visibleIdSet = new Set(visiblePersons.map((p) => p.id))

  // Visible marriages (both spouses present and not hidden)
  const visibleMarriages = marriages.filter(
    (m) => visibleIdSet.has(m.spouse1.id) && visibleIdSet.has(m.spouse2.id),
  )

  // Dagre layout — main tree structure
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'TB', ranksep: 180, nodesep: 60, marginx: 40, marginy: 40 })
  visiblePersons.forEach((p) => graph.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))

  // Primary edges: parent → child (drive the hierarchical structure)
  visibleRels.forEach((r) => graph.setEdge(r.person1.id, r.person2.id, { weight: 2, minlen: 1 }))

  // Marriage edges: lightweight nudge so spouses land on the same rank / close columns
  // weight=1 (lower than parent edges), minlen=0 (no rank separation required)
  visibleMarriages.forEach((m) => {
    graph.setEdge(m.spouse1.id, m.spouse2.id, { weight: 1, minlen: 0 })
  })

  dagre.layout(graph)

  // ── Post-layout pass: Y-align married couples in the same generation ──────────
  // If the two spouses ended up within 1.5 row heights of each other,
  // snap them to the same Y so the marriage edge is horizontal.
  const yOverride = new Map<string, number>()
  visibleMarriages.forEach((m) => {
    const n1 = graph.node(m.spouse1.id)
    const n2 = graph.node(m.spouse2.id)
    if (!n1 || !n2) return
    const yDiff = Math.abs(n1.y - n2.y)
    if (yDiff > 0 && yDiff <= NODE_HEIGHT * 2.5) {
      // Same generation — average their Y
      const targetY = (n1.y + n2.y) / 2
      // Only override if we haven't pinned this node by a different marriage
      if (!yOverride.has(m.spouse1.id)) yOverride.set(m.spouse1.id, targetY)
      if (!yOverride.has(m.spouse2.id)) yOverride.set(m.spouse2.id, targetY)
    }
  })

  const nodes: Node<PersonNodeData>[] = visiblePersons.map((p) => {
    const pos = graph.node(p.id)
    const children = childrenOf.get(p.id) ?? new Set()
    const y = yOverride.get(p.id) ?? pos.y
    return {
      id: p.id,
      type: 'person',
      position: { x: pos.x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
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

/**
 * Like useTreeData but scoped to a single branch.
 * Automatically includes persons from Shared (isShared=true) branches
 * so common ancestors (great-grandparents) always appear at the top of every branch tree.
 */
export function useBranchTreeData(branchId: string) {
  // This branch's persons
  const { data: branchData, isLoading: branchLoading } = useQuery({
    queryKey: ['branch-persons', branchId],
    queryFn: () => branchesService.getPersons(branchId),
    enabled: !!branchId,
  })

  // All branches — need the shared ones
  const { data: allBranches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.getAll(),
  })

  // IDs of shared branches (exclude self in case this IS a shared branch)
  const sharedBranches = useMemo(
    () => allBranches.filter((b) => b.isShared && b.id !== branchId),
    [allBranches, branchId],
  )

  // Fetch persons for every shared branch in parallel
  const sharedBranchResults = useQueries({
    queries: sharedBranches.map((b) => ({
      queryKey: ['branch-persons', b.id] as const,
      queryFn: () => branchesService.getPersons(b.id),
    })),
  })

  // All persons + relationships + marriages (full dataset for user's visibility)
  const { data: personsData, isLoading: personsLoading, isError } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personsService.getAll(),
  })

  const { data: allRelationships = [], isLoading: relsLoading } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => relationshipsService.getAll(),
  })

  const { data: allMarriages = [], isLoading: marriagesLoading } = useQuery({
    queryKey: ['marriages'],
    queryFn: () => relationshipsService.getAllMarriages(),
  })

  const allPersons: Person[] = personsData?.['member'] ?? personsData?.['hydra:member'] ?? []

  // IDs belonging to THIS branch
  const branchPersonIds = useMemo(
    () => new Set((branchData?.members ?? []).map((m) => m.id)),
    [branchData],
  )

  // IDs from ALL shared branches combined
  const sharedMemberIds = useMemo(() => {
    const ids = new Set<string>()
    sharedBranchResults.forEach((result) => {
      result.data?.members?.forEach((m) => ids.add(m.id))
    })
    return ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBranchResults])

  // Combined set: branch members + shared/common ancestors
  const combinedIds = useMemo(() => {
    const ids = new Set(branchPersonIds)
    sharedMemberIds.forEach((id) => ids.add(id))
    return ids
  }, [branchPersonIds, sharedMemberIds])

  const persons = useMemo(
    () => (combinedIds.size > 0 ? allPersons.filter((p) => combinedIds.has(p.id)) : []),
    [allPersons, combinedIds],
  )

  // Relationships where BOTH persons are in the combined set
  const relationships = useMemo(
    () => allRelationships.filter(
      (r) => combinedIds.has(r.person1.id) && combinedIds.has(r.person2.id),
    ),
    [allRelationships, combinedIds],
  )

  const marriages = useMemo(
    () => allMarriages.filter(
      (m) => combinedIds.has(m.spouse1.id) && combinedIds.has(m.spouse2.id),
    ),
    [allMarriages, combinedIds],
  )

  const sharedLoading = sharedBranchResults.some((r) => r.isLoading)
  const isLoading = branchLoading || personsLoading || relsLoading || marriagesLoading || sharedLoading

  return {
    persons,
    relationships,
    marriages,
    isLoading,
    isError,
    /** Person count in THIS branch only (excluding shared ancestors) */
    totalPersons: branchPersonIds.size,
    branchPersonIds,
    sharedMemberIds,
  }
}

