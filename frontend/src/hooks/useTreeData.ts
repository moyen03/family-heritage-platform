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
 *
 * For each married couple that has shared children, we insert a tiny invisible
 * "family connector" node between the couple and their children.  This gives the
 * classic genealogy bracket layout:
 *
 *   [Parent1] ——♦—— [Parent2]          (marriage edge, unchanged)
 *                ↓
 *          [connector •]
 *          /     |     \
 *      [C1]   [C2]   [C3]
 *
 * Single parents (no marriage, or no shared children) keep direct edges.
 */
export function buildTreeLayout(
  persons: Person[],
  relationships: Relationship[],
  marriages: Marriage[],
  collapsedIds: Set<string>,
): { nodes: Node<PersonNodeData>[]; edges: Edge[] } {
  if (!persons.length) return { nodes: [], edges: [] }

  // ── 1. Build parent→children and child→parents maps ────────────────────────
  const childrenOf = new Map<string, Set<string>>()
  const parentsOf  = new Map<string, Set<string>>()
  relationships
    .filter((r) => PARENT_TYPES.has(r.type))
    .forEach((r) => {
      if (!childrenOf.has(r.person1.id)) childrenOf.set(r.person1.id, new Set())
      childrenOf.get(r.person1.id)!.add(r.person2.id)

      if (!parentsOf.has(r.person2.id)) parentsOf.set(r.person2.id, new Set())
      parentsOf.get(r.person2.id)!.add(r.person1.id)
    })

  // ── 2. Compute collapsed / hidden subtrees ──────────────────────────────────
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
  const visibleRels    = relationships.filter(
    (r) => PARENT_TYPES.has(r.type) && !hiddenIds.has(r.person1.id) && !hiddenIds.has(r.person2.id),
  )
  const visibleIdSet = new Set(visiblePersons.map((p) => p.id))

  const visibleMarriages = marriages.filter(
    (m) => visibleIdSet.has(m.spouse1.id) && visibleIdSet.has(m.spouse2.id),
  )

  // ── 3. Dagre layout (parent→child DAG only — no marriage edges to avoid cycles)
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'TB', ranksep: 180, nodesep: 60, marginx: 40, marginy: 40 })
  visiblePersons.forEach((p) => graph.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  visibleRels.forEach((r) => graph.setEdge(r.person1.id, r.person2.id, { weight: 2, minlen: 1 }))
  dagre.layout(graph)

  // ── 4. Post-layout: Y-snap + X-clamp for married couples ───────────────────
  const hasParentEdge = new Set<string>()
  visibleRels.forEach((r) => hasParentEdge.add(r.person2.id))

  const yOverride = new Map<string, number>()
  const xOverride = new Map<string, number>()

  visibleMarriages.forEach((m) => {
    const n1 = graph.node(m.spouse1.id)
    const n2 = graph.node(m.spouse2.id)
    if (!n1 || !n2) return

    // Y-snap: pull both to the deeper (larger Y) position
    const targetY = Math.max(n1.y, n2.y)
    if (!yOverride.has(m.spouse1.id)) yOverride.set(m.spouse1.id, targetY)
    if (!yOverride.has(m.spouse2.id)) yOverride.set(m.spouse2.id, targetY)

    // X-clamp: if far apart and one is an orphan, move them together
    const COUPLE_GAP = NODE_WIDTH + 20
    const xDiff = Math.abs(n1.x - n2.x)
    if (xDiff > COUPLE_GAP * 1.5) {
      const s1anchored = hasParentEdge.has(m.spouse1.id)
      const s2anchored = hasParentEdge.has(m.spouse2.id)
      if (s1anchored && !s2anchored && !xOverride.has(m.spouse2.id)) {
        xOverride.set(m.spouse2.id, n1.x + (n1.x <= n2.x ? COUPLE_GAP : -COUPLE_GAP))
      } else if (s2anchored && !s1anchored && !xOverride.has(m.spouse1.id)) {
        xOverride.set(m.spouse1.id, n2.x + (n2.x <= n1.x ? COUPLE_GAP : -COUPLE_GAP))
      }
    }
  })

  // Helper: resolved position for a person after overrides
  const posX = (id: string) => xOverride.get(id) ?? graph.node(id).x
  const posY = (id: string) => yOverride.get(id) ?? graph.node(id).y

  // ── 5. Family connector nodes ───────────────────────────────────────────────
  // For each marriage where BOTH parents share at least one child in the tree,
  // create a tiny invisible connector node and route children through it.
  //
  // routedPairs tracks "parentId|childId" pairs that are handled by a connector
  // so we can skip those when building the direct parent→child edges later.

  const routedPairs = new Set<string>()

  type ConnectorNode = { id: string; x: number; y: number; childIds: string[] }
  const connectors: ConnectorNode[] = []

  visibleMarriages.forEach((m) => {
    if (!graph.node(m.spouse1.id) || !graph.node(m.spouse2.id)) return

    const s1Kids = childrenOf.get(m.spouse1.id) ?? new Set<string>()
    const s2Kids = childrenOf.get(m.spouse2.id) ?? new Set<string>()

    // Children that appear under BOTH parents (the couple's shared children)
    const sharedKids = [...s1Kids].filter((id) => visibleIdSet.has(id) && s2Kids.has(id))
    if (sharedKids.length === 0) return

    // Connector sits midway between the two parents on X, 50 px below on Y
    const cx = (posX(m.spouse1.id) + posX(m.spouse2.id)) / 2
    const cy = Math.max(posY(m.spouse1.id), posY(m.spouse2.id)) + 50

    connectors.push({ id: `fc-${m.id}`, x: cx, y: cy, childIds: sharedKids })

    sharedKids.forEach((childId) => {
      if (s1Kids.has(childId)) routedPairs.add(`${m.spouse1.id}|${childId}`)
      if (s2Kids.has(childId)) routedPairs.add(`${m.spouse2.id}|${childId}`)
    })
  })

  // Also create connectors for parents with 2+ children who are NOT married
  // (single parent with multiple kids → give them a connector too)
  const coveredParents = new Set(
    visibleMarriages
      .filter((m) => connectors.some((c) => c.id === `fc-${m.id}`))
      .flatMap((m) => [m.spouse1.id, m.spouse2.id]),
  )

  childrenOf.forEach((kids, parentId) => {
    if (coveredParents.has(parentId) || !visibleIdSet.has(parentId)) return
    const myKids = [...kids].filter((id) => visibleIdSet.has(id) && !hiddenIds.has(id))
    if (myKids.length < 2) return  // Only need connector for 2+ kids

    // Check that none of these kids are already routed
    const unroutedKids = myKids.filter((k) => !routedPairs.has(`${parentId}|${k}`))
    if (unroutedKids.length < 2) return

    const cx = posX(parentId)
    const cy = posY(parentId) + 50

    connectors.push({ id: `sfc-${parentId}`, x: cx, y: cy, childIds: unroutedKids })
    unroutedKids.forEach((childId) => routedPairs.add(`${parentId}|${childId}`))
  })

  // ── 6. Build React Flow nodes ───────────────────────────────────────────────
  const personNodes: Node<PersonNodeData>[] = visiblePersons.map((p) => {
    const children = childrenOf.get(p.id) ?? new Set()
    return {
      id: p.id,
      type: 'person',
      position: { x: posX(p.id) - NODE_WIDTH / 2, y: posY(p.id) - NODE_HEIGHT / 2 },
      data: {
        person: p,
        hasChildren: children.size > 0,
        isCollapsed: collapsedIds.has(p.id),
        collapsedChildCount: collapsedIds.has(p.id) ? children.size : 0,
      },
    }
  })

  // Connector nodes (tiny invisible branching points)
  const connectorNodes: Node<Record<string, never>>[] = connectors.map((c) => ({
    id: c.id,
    type: 'familyConnector',
    position: { x: c.x - 1, y: c.y - 1 },
    data: {},
    selectable: false,
    draggable: false,
    connectable: false,
  }))

  // ── 7. Build React Flow edges ───────────────────────────────────────────────
  const EDGE_STYLE = { stroke: '#94a3b8', strokeWidth: 2 }
  const EDGE_ARROW = { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#94a3b8' } as const

  // Direct parent→child edges (those NOT routed through a connector)
  const directEdges: Edge[] = visibleRels
    .filter((r) => !routedPairs.has(`${r.person1.id}|${r.person2.id}`))
    .map((r) => ({
      id: `e-${r.id}`,
      source: r.person1.id,
      target: r.person2.id,
      type: 'smoothstep',
      animated: false,
      ...edgeStyle(r.type),
    }))

  // Connector edges
  const connectorEdges: Edge[] = []
  connectors.forEach((c) => {
    // Determine which parents feed into this connector
    // For marriage connectors: both spouses
    // For single-parent connectors: just the one parent
    const isMarriageConnector = c.id.startsWith('fc-')
    if (isMarriageConnector) {
      const marriageId = c.id.replace('fc-', '')
      const marriage = visibleMarriages.find((m) => m.id === marriageId)
      if (marriage) {
        ;[marriage.spouse1.id, marriage.spouse2.id].forEach((spouseId) => {
          connectorEdges.push({
            id: `fce-p-${c.id}-${spouseId}`,
            source: spouseId,
            target: c.id,
            type: 'smoothstep',
            style: EDGE_STYLE,
          })
        })
      }
    } else {
      // Single parent connector: "sfc-{parentId}"
      const parentId = c.id.replace('sfc-', '')
      connectorEdges.push({
        id: `fce-p-${c.id}`,
        source: parentId,
        target: c.id,
        type: 'smoothstep',
        style: EDGE_STYLE,
      })
    }

    // Connector → children
    c.childIds.forEach((childId) => {
      connectorEdges.push({
        id: `fce-c-${c.id}-${childId}`,
        source: c.id,
        target: childId,
        type: 'smoothstep',
        style: EDGE_STYLE,
        markerEnd: EDGE_ARROW,
      })
    })
  })

  return {
    nodes: [...personNodes, ...connectorNodes] as Node<PersonNodeData>[],
    edges: [...directEdges, ...connectorEdges],
  }
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

