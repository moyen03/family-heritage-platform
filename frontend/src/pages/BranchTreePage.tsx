import { ReactFlowProvider } from '@xyflow/react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, GitBranch, Share2, Users, TreePine } from 'lucide-react'
import { FamilyTree } from '@/components/tree/FamilyTree'
import { useBranchTreeData } from '@/hooks/useTreeData'
import { branchesService } from '@/services/branches.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ── Inner tree component (must be inside ReactFlowProvider) ────────────────────

function BranchTreeInner({ branchId }: { branchId: string }) {
  const { persons, relationships, marriages, isLoading, isError, totalPersons } =
    useBranchTreeData(branchId)


  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mini toolbar */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 py-2.5 flex items-center gap-3 shadow-sm z-10">
        <span className="text-xs text-gray-400 font-medium">
          {totalPersons} {totalPersons === 1 ? 'person' : 'people'} in this branch
        </span>
        {totalPersons > 0 && (
          <>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs text-gray-400">
              Click any node to see details · Drag to pan · Scroll to zoom
            </span>
          </>
        )}
      </div>

      <FamilyTree
        persons={persons}
        relationships={relationships}
        marriages={marriages}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BranchTreePage() {
  const { id } = useParams<{ id: string }>()

  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ['branch', id],
    queryFn: () => branchesService.getById(id!),
    enabled: !!id,
  })

  if (branchLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="p-8 text-red-500 text-center">Branch not found.</div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm px-6 py-3 flex items-center gap-4">
        <Link
          to={`/branches/${id}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to branch
        </Link>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-2 min-w-0">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${
            branch.isShared ? 'bg-amber-100' : 'bg-indigo-100'
          }`}>
            {branch.isShared
              ? <Share2 className="h-4 w-4 text-amber-600" />
              : <GitBranch className="h-4 w-4 text-indigo-600" />
            }
          </div>
          <span className="font-semibold text-gray-900 truncate">{branch.name}</span>
          {branch.isShared && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              Shared
            </span>
          )}
        </div>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users className="h-3.5 w-3.5" />
          {branch.memberCount} persons
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
          <TreePine className="h-3.5 w-3.5" />
          Branch Tree
        </div>
      </div>

      {/* Tree canvas (takes remaining height) */}
      {id && (
        <ReactFlowProvider>
          <BranchTreeInner branchId={id} />
        </ReactFlowProvider>
      )}
    </div>
  )
}

