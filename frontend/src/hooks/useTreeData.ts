import { useQuery, useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { personsService } from '@/services/persons.service'
import { relationshipsService } from '@/services/relationships.service'
import { branchesService } from '@/services/branches.service'
import type { Person } from '@/types/person'
import type { Relationship, Marriage } from '@/types/relationship'

const NODE_WIDTH  = 210
const NODE_HEIGHT = 100
const GEN_RANKSEP = 220   // vertical pixels between generations (Y grid)
const NODE_HSEP   = 100   // min horizontal gap between sibling subtrees

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
  onAddRelative?: (id: string, role: import('@/components/tree/QuickAddRelativeModal').RelativeRole) => void
  canAddRelative?: boolean
  isSelected?: boolean
  highlightState?: 'ancestor' | 'descendant' | 'dimmed' | null
  [key: string]: unknown
}

function edgeStyle(type: string): Pick<Edge, 'style' | 'label' | 'labelStyle' | 'labelBgStyle'> {
  switch (type) {
    case 'step_parent':
      return {
        style: { stroke: '#f97316', strokeWidth: 1.5, strokeDasharray: '6 4' },
        label: 'step',
        labelStyle: { fontSize: 9, fill: '#f97316', fontWeight: 600 },
        labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
      }
    case 'adopted_parent':
      return {
        style: { stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '6 4' },
        label: 'adopted',
        labelStyle: { fontSize: 9, fill: '#8b5cf6', fontWeight: 600 },
        labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
      }
    default:
      return {
        style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
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

  // ── 3. Dagre layout — used ONLY for X positions; Y will be overridden ────────
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'TB', ranksep: GEN_RANKSEP, nodesep: NODE_HSEP, marginx: 80, marginy: 80 })
  visiblePersons.forEach((p) => graph.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  visibleRels.forEach((r) => graph.setEdge(r.person1.id, r.person2.id, { weight: 2, minlen: 1 }))
  dagre.layout(graph)

  // ── 3b. Generation-depth Y alignment ──────────────────────────────────────
  // Compute "generation depth" for every visible person: depth 0 = oldest known
  // ancestor in the tree; depth increases toward descendants.  All persons at the
  // same generation depth are placed on the same Y row, so parent→child edges are
  // always strictly vertical and never cross unrelated nodes.
  const genDepths = new Map<string, number>()

  function calcGenDepth(id: string): number {
    if (genDepths.has(id)) return genDepths.get(id)!
    const parents = [...(parentsOf.get(id) ?? [])].filter((pid) => visibleIdSet.has(pid))
    if (parents.length === 0) { genDepths.set(id, 0); return 0 }
    const depth = 1 + Math.max(...parents.map(calcGenDepth))
    genDepths.set(id, depth)
    return depth
  }
  visiblePersons.forEach((p) => calcGenDepth(p.id))

  // ── 4. Post-layout: Y-override (generation grid) ────────────────────────────
  const yOverride = new Map<string, number>()

  // 4-0. Place every person at exactly depth * GEN_RANKSEP so all generations
  //      form clean horizontal rows.
  visiblePersons.forEach((p) => {
    const depth = genDepths.get(p.id) ?? 0
    yOverride.set(p.id, depth * GEN_RANKSEP)
  })

  // ── 4a. Marriage Y-snap ──────────────────────────────────────────────────────
  // Pull an orphan spouse (depth 0, no parents in tree) to the same Y row as
  // their tree-connected partner.
  visibleMarriages.forEach((m) => {
    const y1 = yOverride.get(m.spouse1.id) ?? 0
    const y2 = yOverride.get(m.spouse2.id) ?? 0
    const targetY = Math.max(y1, y2)
    yOverride.set(m.spouse1.id, targetY)
    yOverride.set(m.spouse2.id, targetY)
  })

  // ── 4b. Sibling Y-snap ───────────────────────────────────────────────────────
  // If one sibling has no parents in the visible tree (depth 0) but their
  // sibling is at a deeper generation, snap them to the correct row.
  const visibleSiblingRels = relationships.filter(
    (r) =>
      (r.type === 'sibling' || r.type === 'half_sibling') &&
      visibleIdSet.has(r.person1.id) &&
      visibleIdSet.has(r.person2.id),
  )
  visibleSiblingRels.forEach((r) => {
    const y1 = yOverride.get(r.person1.id) ?? 0
    const y2 = yOverride.get(r.person2.id) ?? 0
    if (y1 > y2) yOverride.set(r.person2.id, y1)
    else if (y2 > y1) yOverride.set(r.person1.id, y2)
  })

  // ── 4c. Custom X layout: bottom-up subtree widths + top-down centering ───────
  //
  // This completely replaces Dagre's X positions.  The algorithm:
  //   1. Each marriage forms a "couple unit" (primary = in-tree partner, or lower id).
  //   2. Each child is assigned to exactly ONE layout-parent (the primary of their
  //      parent couple, or the leftmost single parent by Dagre X).
  //   3. Bottom-up: each unit's subtree width = max(selfWidth, Σ(child widths) + gaps).
  //   4. Top-down: assign X centering each unit over its full subtree span.
  //
  // Result: Gen 1 row is always exactly as wide as Gen 2, Gen 2 as Gen 3, etc.,
  // so lines from parent to child never cross unrelated subtrees.

  const COUPLE_SPAN = NODE_WIDTH * 2 + 20   // width occupied by two side-by-side spouses

  // i. Layout spouse: first visible marriage wins
  const spouseOf = new Map<string, string>()
  visibleMarriages.forEach((m) => {
    if (!spouseOf.has(m.spouse1.id)) spouseOf.set(m.spouse1.id, m.spouse2.id)
    if (!spouseOf.has(m.spouse2.id)) spouseOf.set(m.spouse2.id, m.spouse1.id)
  })

  // "In-tree" = has at least one visible parent edge (not a married-in orphan)
  const hasVisibleParents = (id: string) =>
    [...(parentsOf.get(id) ?? [])].some((pid) => visibleIdSet.has(pid))

  // Primary of a couple:
  //  • Cross-family marriage (BOTH spouses have parents in the visible tree):
  //    BOTH are "primary" — each person stays within their own family's subtree.
  //    The connector node between them bridges the two families visually.
  //  • Orphan spouse (only one has parents): in-tree partner is primary;
  //    the orphan is secondary and gets placed adjacent to their partner.
  //  • Both orphans: smaller numeric/string id wins.
  const isPrimary = (id: string): boolean => {
    const sp = spouseOf.get(id)
    if (!sp) return true
    const meTree = hasVisibleParents(id), spTree = hasVisibleParents(sp)
    if (meTree && spTree) return true    // Cross-family: both are independent primaries
    if (meTree && !spTree) return true   // I'm in-tree, spouse is orphan → I'm primary
    if (!meTree && spTree) return false  // Spouse is in-tree, I'm orphan → I'm secondary
    // Both orphans — smaller numeric/string id wins
    const nId = parseInt(id, 10), nSp = parseInt(sp, 10)
    return isNaN(nId) || isNaN(nSp) ? id < sp : nId < nSp
  }

  // Cross-family child: a person whose parents are a married couple where BOTH
  // parents have their own parents in the visible tree (i.e., they come from
  // two separate family subtrees).  These children are excluded from both
  // families' layout widths and are re-centred between the two families in
  // step 5b after the connector positions are known.
  const isCrossFamilyChild = (id: string): boolean => {
    const parents = [...(parentsOf.get(id) ?? [])].filter((pid) => visibleIdSet.has(pid))
    for (const par of parents) {
      const sp = spouseOf.get(par)
      if (sp && parents.includes(sp) && hasVisibleParents(par) && hasVisibleParents(sp)) {
        return true
      }
    }
    return false
  }

  // ii. Assign each child to exactly one layout-parent (primary of their parent couple)
  const layoutParentOf = new Map<string, string>()
  visiblePersons.forEach((p) => {
    const parents = [...(parentsOf.get(p.id) ?? [])].filter((pid) => visibleIdSet.has(pid))
    if (parents.length === 0) return
    // Prefer a married-couple parent pair → assign to their primary
    for (const par of parents) {
      const sp = spouseOf.get(par)
      if (sp && parents.includes(sp)) {
        layoutParentOf.set(p.id, isPrimary(par) ? par : sp)
        return
      }
    }
    // No married couple — assign to parent with smallest Dagre X
    const chosen = parents.reduce((a, b) =>
      (graph.node(a)?.x ?? 0) <= (graph.node(b)?.x ?? 0) ? a : b,
    )
    layoutParentOf.set(p.id, chosen)
  })

  // iii. Get layout-children of a primary person, sorted by Dagre X
  //      Cross-family children are excluded — they're positioned in step 5b.
  const getLayoutKids = (primaryId: string): string[] =>
    visiblePersons
      .filter(
        (p) =>
          !hiddenIds.has(p.id) &&
          isPrimary(p.id) &&
          !isCrossFamilyChild(p.id) &&
          layoutParentOf.get(p.id) === primaryId,
      )
      .sort((a, b) => (graph.node(a.id)?.x ?? 0) - (graph.node(b.id)?.x ?? 0))
      .map((p) => p.id)

  // iv. Bottom-up: compute how much horizontal space each subtree needs
  const subtreeW = new Map<string, number>()

  function computeW(id: string): number {
    if (subtreeW.has(id)) return subtreeW.get(id)!
    // Use COUPLE_SPAN only for orphan-spouse pairs (secondary is next to us).
    // Cross-family spouses are independent — each uses NODE_WIDTH.
    const sp = spouseOf.get(id)
    const selfW = (sp && !isPrimary(sp)) ? COUPLE_SPAN : NODE_WIDTH
    const kids = getLayoutKids(id)
    if (kids.length === 0) {
      subtreeW.set(id, selfW)
      return selfW
    }
    const kidsW =
      kids.reduce((s, k) => s + computeW(k), 0) +
      Math.max(0, kids.length - 1) * NODE_HSEP
    const w = Math.max(selfW, kidsW)
    subtreeW.set(id, w)
    return w
  }

  // v. Root primaries: primary persons with no visible parents
  //    Married-in orphans (isPrimary=false because spouse is in-tree) are excluded
  //    here — they're positioned by their spouse's assignXPos call.
  const rootPrimaries = visiblePersons
    .filter((p) => {
      if (!isPrimary(p.id)) return false
      const pars = [...(parentsOf.get(p.id) ?? [])].filter((pid) => visibleIdSet.has(pid))
      return pars.length === 0
    })
    .sort((a, b) => (graph.node(a.id)?.x ?? 0) - (graph.node(b.id)?.x ?? 0))

  rootPrimaries.forEach((p) => computeW(p.id))

  // vi. Top-down X assignment — center each couple/person over their full subtree
  const layoutX = new Map<string, number>()

  function assignXPos(primaryId: string, leftEdge: number): void {
    const w = subtreeW.get(primaryId) ?? NODE_WIDTH
    const center = leftEdge + w / 2
    const sp = spouseOf.get(primaryId)

    if (sp && !isPrimary(sp)) {
      // Orphan spouse (secondary) — place adjacent with 20 px gap
      layoutX.set(primaryId, center - (NODE_WIDTH / 2 + 10))
      layoutX.set(sp, center + (NODE_WIDTH / 2 + 10))
    } else {
      // No spouse, or cross-family spouse (each stays in their own family)
      layoutX.set(primaryId, center)
    }

    const kids = getLayoutKids(primaryId)
    if (kids.length === 0) return

    const kidsTotal =
      kids.reduce((s, k) => s + (subtreeW.get(k) ?? NODE_WIDTH), 0) +
      Math.max(0, kids.length - 1) * NODE_HSEP

    // Centre the children block under this couple/person
    let cursor = leftEdge + (w - kidsTotal) / 2
    for (const kid of kids) {
      assignXPos(kid, cursor)
      cursor += (subtreeW.get(kid) ?? NODE_WIDTH) + NODE_HSEP
    }
  }

  let xCursor = 80   // left margin
  for (const root of rootPrimaries) {
    assignXPos(root.id, xCursor)
    xCursor += (subtreeW.get(root.id) ?? NODE_WIDTH) + NODE_HSEP * 6   // clear gap between family trees
  }

  // vii. Snap any still-unpositioned persons (disconnected nodes, orphan siblings,
  //      secondary spouses with only their own children in tree) to their
  //      positioned spouse, or fall back to Dagre X as a last resort.
  visiblePersons.forEach((p) => {
    if (layoutX.has(p.id)) return
    const sp = spouseOf.get(p.id)
    if (sp && layoutX.has(sp)) {
      layoutX.set(p.id, layoutX.get(sp)! + NODE_WIDTH + 20)
    } else if (graph.node(p.id)) {
      layoutX.set(p.id, graph.node(p.id).x)
    }
  })

  // ── Position helpers ───────────────────────────────────────────────────────
  const posX = (id: string) => layoutX.get(id) ?? graph.node(id)?.x ?? 0
  const posY = (id: string) => yOverride.get(id) ?? graph.node(id)?.y ?? 0

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

  // ── 5b. Re-centre cross-family children between the two families ─────────────
  // For marriages where BOTH spouses have parents in the tree, both spouses were
  // positioned independently above (each inside their own family).  The connector
  // node already sits at their midpoint.  Now we move the shared children to be
  // centred directly below that connector so they appear in the visual gap between
  // the two families rather than buried inside either one.
  visibleMarriages.forEach((m) => {
    if (!hasVisibleParents(m.spouse1.id) || !hasVisibleParents(m.spouse2.id)) return
    const connector = connectors.find((c) => c.id === `fc-${m.id}`)
    if (!connector || connector.childIds.length === 0) return

    // Only primary children need explicit placement; secondaries are set by their primary
    const primaryKids = connector.childIds.filter(isPrimary)
    if (primaryKids.length === 0) return

    // Ensure widths are computed (they were excluded from family subtrees above)
    primaryKids.forEach((k) => computeW(k))

    const totalW =
      primaryKids.reduce((s, k) => s + (subtreeW.get(k) ?? NODE_WIDTH), 0) +
      Math.max(0, primaryKids.length - 1) * NODE_HSEP

    // Centre the children block below the connector
    let cursor = connector.x - totalW / 2
    primaryKids.forEach((kid) => {
      assignXPos(kid, cursor)
      cursor += (subtreeW.get(kid) ?? NODE_WIDTH) + NODE_HSEP
    })
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
    position: { x: c.x - 5, y: c.y - 5 },
    data: {},
    selectable: false,
    draggable: false,
    connectable: false,
  }))

  // ── 7. Build React Flow edges ───────────────────────────────────────────────
  const EDGE_STYLE = { stroke: '#cbd5e1', strokeWidth: 1.5 }

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
      const parentId = c.id.replace('sfc-', '')
      connectorEdges.push({
        id: `fce-p-${c.id}`,
        source: parentId,
        target: c.id,
        type: 'smoothstep',
        style: EDGE_STYLE,
      })
    }

    // Connector → each child: smoothstep for consistent look
    c.childIds.forEach((childId) => {
      connectorEdges.push({
        id: `fce-c-${c.id}-${childId}`,
        source: c.id,
        target: childId,
        type: 'smoothstep',
        style: EDGE_STYLE,
      })
    })
  })

  // ── 8. Return ────────────────────────────────────────────────────────────────
  // Sibling relationships are used only for positioning (step 4b above).
  // We deliberately do NOT draw sibling edges — siblings with shared parents
  // are already visually connected through the family-connector node, and
  // drawing an extra edge would add visual clutter.
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

