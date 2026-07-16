import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
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
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery } from '@tanstack/react-query'
import { PersonNode } from './PersonNode'
import { PersonDetailPanel } from './PersonDetailPanel'
import { useTreeData } from '@/hooks/useTreeData'
import { personsService } from '@/services/persons.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { PersonNodeData } from '@/hooks/useTreeData'

const NODE_TYPES = { person: PersonNode }

type HighlightMode = 'ancestor' | 'descendant' | null

export interface FamilyTreeHandle {
  focusPerson: (id: string) => void
}

export const FamilyTree = forwardRef<FamilyTreeHandle>(function FamilyTree(_props, ref) {
  const { nodes: initialNodes, edges: initialEdges, isLoading } = useTreeData()
  const { fitView, setCenter } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PersonNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set())
  const [highlightMode, setHighlightMode] = useState<HighlightMode>(null)

  const [ancestorTargetId, setAncestorTargetId] = useState<string | null>(null)
  const [descendantTargetId, setDescendantTargetId] = useState<string | null>(null)

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

  // Sync tree data into state when loaded
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes.map((n) => ({ ...n, data: { ...n.data } } as Node<PersonNodeData>)))
      setEdges(initialEdges.map((e) => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#94a3b8' },
      })))
    }
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Fit view when tree first loads
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100)
    }
  }, [nodes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply ancestor highlighting
  useEffect(() => {
    if (!ancestorData) return
    const ids = new Set(ancestorData.members.map((n) => n.person.id))
    setHighlightedIds(ids)
    setHighlightMode('ancestor')
  }, [ancestorData])

  // Apply descendant highlighting
  useEffect(() => {
    if (!descendantData) return
    const ids = new Set(descendantData.members.map((n) => n.person.id))
    setHighlightedIds(ids)
    setHighlightMode('descendant')
  }, [descendantData])

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
    setHighlightedIds(new Set())
    setHighlightMode(null)
    setDescendantTargetId(null)
    setAncestorTargetId(id)
  }, [])

  const handleHighlightDescendants = useCallback((id: string) => {
    setHighlightedIds(new Set())
    setHighlightMode(null)
    setAncestorTargetId(null)
    setDescendantTargetId(id)
  }, [])

  const handleClearHighlight = useCallback(() => {
    setHighlightedIds(new Set())
    setHighlightMode(null)
    setAncestorTargetId(null)
    setDescendantTargetId(null)
  }, [])

  // Update node styles based on selection and highlight state
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
          },
        }
      })
    )
  }, [selectedId, highlightedIds, highlightMode, handleSelect, handleHighlightAncestors, handleHighlightDescendants, setNodes])

  // Expose imperative handle for toolbar
  useImperativeHandle(ref, () => ({
    focusPerson(id: string) {
      setSelectedId(id)
      const node = nodes.find((n) => n.id === id)
      if (node) {
        setCenter(node.position.x + 100, node.position.y + 45, { zoom: 1.2, duration: 600 })
      }
    },
  }), [nodes, setCenter])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4 text-sm">Building family tree…</p>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
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
            <button
              onClick={handleClearHighlight}
              className="text-gray-400 hover:text-gray-600 font-medium"
            >
              Clear
            </button>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
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
              const data = n.data as PersonNodeData
              const gender = data?.person?.gender
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
