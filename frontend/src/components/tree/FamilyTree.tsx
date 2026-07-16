import { useCallback, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery } from '@tanstack/react-query'
import { PersonNode } from './PersonNode'
import { MarriageEdge } from './MarriageEdge'
import { PersonDetailPanel } from './PersonDetailPanel'
import { useTreeData, buildTreeLayout } from '@/hooks/useTreeData'
import { personsService } from '@/services/persons.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { PersonNodeData } from '@/hooks/useTreeData'

const NODE_TYPES = { person: PersonNode }
const EDGE_TYPES = { marriage: MarriageEdge }

type HighlightMode = 'ancestor' | 'descendant' | null

export interface FamilyTreeHandle {
  focusPerson: (id: string) => void
}

export const FamilyTree = forwardRef<FamilyTreeHandle>(function FamilyTree(_props, ref) {
  const { persons, relationships, marriages, isLoading, isError } = useTreeData()
  const { fitView, setCenter } = useReactFlow()

  // ── Collapse state ───────────────────────────────────────────────────────────
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ── Layout — re-computed when data or collapse changes ──────────────────────
  const { layoutNodes, layoutEdges } = useMemo(() => {
    const { nodes, edges } = buildTreeLayout(persons, relationships, collapsedIds)

    // Overlay marriage edges (only between visible nodes)
    const visibleIds = new Set(nodes.map((n) => n.id))
    const marriageEdges: Edge[] = marriages
      .filter((m) => visibleIds.has(m.spouse1.id) && visibleIds.has(m.spouse2.id))
      .map((m) => ({
        id: `marriage-${m.id}`,
        source: m.spouse1.id,
        target: m.spouse2.id,
        type: 'marriage',
        data: { isDivorced: m.isDivorced },
        animated: false,
        zIndex: 5,
      }))

    return { layoutNodes: nodes, layoutEdges: [...edges, ...marriageEdges] }
  }, [persons, relationships, marriages, collapsedIds])

  // ── React Flow state ────────────────────────────────────────────────────────
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PersonNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set())
  const [highlightMode, setHighlightMode] = useState<HighlightMode>(null)
  const [ancestorTargetId, setAncestorTargetId] = useState<string | null>(null)
  const [descendantTargetId, setDescendantTargetId] = useState<string | null>(null)

  // ── Ancestor / descendant queries ────────────────────────────────────────────
  const { data: ancestorData } = useQuery({
    queryKey: ['ancestors', ancestorTargetId],
    queryFn: () => personsService.getAncestors(ancestorTargetId!),
    enabled: !!ancestorTargetId,
  })
  const { data: descendantData } = useQuery({
    queryKey: ['descendants', descendantTargetId],
    queryFn: () => personsService.getDescendants(descendantTargetId!),
    enabled: !!descendantTargetId,
  })

  // ── Sync layout → flow state ─────────────────────────────────────────────────
  useEffect(() => {
    if (layoutNodes.length > 0) {
      setNodes(layoutNodes.map((n) => ({ ...n, data: { ...n.data } } as Node<PersonNodeData>)))
      setEdges(layoutEdges)
    }
  }, [layoutNodes, layoutEdges, setNodes, setEdges])

  // ── Fit view when nodes first appear ────────────────────────────────────────
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100)
    }
  }, [nodes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ancestor / descendant highlight ─────────────────────────────────────────
  useEffect(() => {
    if (!ancestorData) return
    setHighlightedIds(new Set(ancestorData.members.map((n) => n.person.id)))
    setHighlightMode('ancestor')
  }, [ancestorData])

  useEffect(() => {
    if (!descendantData) return
    setHighlightedIds(new Set(descendantData.members.map((n) => n.person.id)))
    setHighlightMode('descendant')
  }, [descendantData])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => {
      if (prev === id) {
        setHighlightedIds(new Set())
        setHighlightMode(null)
        setAncestorTargetId(null)
        setDescendantTargetId(null)
        return null
      }
      return id
    })
  }, [])

  const handleHighlightAncestors = useCallback((id: string) => {
    setHighlightedIds(new Set()); setHighlightMode(null)
    setDescendantTargetId(null); setAncestorTargetId(id)
  }, [])

  const handleHighlightDescendants = useCallback((id: string) => {
    setHighlightedIds(new Set()); setHighlightMode(null)
    setAncestorTargetId(null); setDescendantTargetId(id)
  }, [])

  const handleClearHighlight = useCallback(() => {
    setHighlightedIds(new Set()); setHighlightMode(null)
    setAncestorTargetId(null); setDescendantTargetId(null)
  }, [])

  // ── Apply highlight + callbacks to node data ─────────────────────────────────
  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => {
        const isSelected = node.id === selectedId
        let hs: 'ancestor' | 'descendant' | 'dimmed' | null = null
        if (highlightedIds.size > 0 && !isSelected) {
          hs = highlightedIds.has(node.id) ? highlightMode : 'dimmed'
        }
        return {
          ...node,
          data: {
            ...node.data,
            isSelected,
            highlightState: hs,
            onSelect: handleSelect,
            onHighlightAncestors: handleHighlightAncestors,
            onHighlightDescendants: handleHighlightDescendants,
            onToggleCollapse: handleToggleCollapse,
          },
        }
      })
    )
  }, [
    selectedId, highlightedIds, highlightMode,
    handleSelect, handleHighlightAncestors, handleHighlightDescendants, handleToggleCollapse,
    setNodes,
  ])

  // ── Imperative handle ────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    focusPerson(id: string) {
      setSelectedId(id)
      const node = nodes.find((n) => n.id === id)
      if (node) setCenter(node.position.x + 100, node.position.y + 45, { zoom: 1.2, duration: 600 })
    },
  }), [nodes, setCenter])

  // ── Render guards ────────────────────────────────────────────────────────────
  if (isLoading || (layoutNodes.length > 0 && nodes.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4 text-sm">Building family tree…</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-400 font-medium">Failed to load family tree.</p>
          <p className="text-gray-400 text-sm mt-1">Please check your connection and try refreshing.</p>
        </div>
      </div>
    )
  }

  if (nodes.length === 0 && layoutNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400">No persons found in the database.</p>
          <p className="text-gray-300 text-sm mt-1">Add persons via the API to see the tree.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Tree canvas */}
      <div className="flex-1 relative">
        {/* Highlight legend */}
        {highlightMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100 text-xs">
            <span className={`flex items-center gap-1.5 font-medium ${
              highlightMode === 'ancestor' ? 'text-blue-600' : 'text-green-600'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                highlightMode === 'ancestor' ? 'bg-blue-400' : 'bg-green-400'
              }`} />
              {highlightedIds.size} {highlightMode === 'ancestor' ? 'ancestors' : 'descendants'}
            </span>
            <button onClick={handleClearHighlight} className="text-gray-400 hover:text-gray-600 font-medium">
              Clear
            </button>
          </div>
        )}

        {/* Edge legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm px-3 py-2 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Legend</p>
          <LegendItem color="#94a3b8" dash={false} label="Parent / child" />
          <LegendItem color="#f97316" dash label="Step parent" />
          <LegendItem color="#8b5cf6" dash label="Adopted" />
          <LegendItem color="#fb7185" dash label="Married" heart />
          <LegendItem color="#94a3b8" dash label="Divorced" faded />
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          <Controls className="shadow-md rounded-lg overflow-hidden border border-gray-100" />
          <MiniMap
            nodeColor={(n) => {
              const gender = (n.data as PersonNodeData)?.person?.gender
              if (gender === 'male') return '#93c5fd'
              if (gender === 'female') return '#f9a8d4'
              return '#d1d5db'
            }}
            className="!shadow-md !rounded-xl !border !border-gray-100"
          />
        </ReactFlow>
      </div>

      {/* Detail panel */}
      {selectedId && (
        <PersonDetailPanel
          personId={selectedId}
          onClose={() => { setSelectedId(null); handleClearHighlight() }}
          highlightMode={highlightMode}
          highlightCount={highlightedIds.size}
        />
      )}
    </div>
  )
})

// ── Legend helper ─────────────────────────────────────────────────────────────
function LegendItem({
  color, dash, label, heart = false, faded = false,
}: {
  color: string; dash: boolean; label: string; heart?: boolean; faded?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 ${faded ? 'opacity-50' : ''}`}>
      <svg width="24" height="10" className="flex-shrink-0">
        <line
          x1="0" y1="5" x2="24" y2="5"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dash ? '5 3' : undefined}
        />
      </svg>
      {heart && <span className="text-rose-400 text-[10px]">♥</span>}
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
