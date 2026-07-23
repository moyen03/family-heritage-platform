import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GitBranch, Plus, Pencil, Trash2, Users, Loader2, X, Save, AlertCircle, Share2, TreePine } from 'lucide-react'
import { branchesService } from '@/services/branches.service'
import type { Branch, CreateBranchDto } from '@/services/branches.service'
import { useAuthStore, selectIsSuperAdmin } from '@/store/auth.store'

// ── Branch Form Modal ─────────────────────────────────────────────────────────

function BranchFormModal({
  branch,
  onClose,
}: {
  branch?: Branch
  onClose: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!branch

  const [name, setName]           = useState(branch?.name ?? '')
  const [description, setDesc]    = useState(branch?.description ?? '')
  const [isShared, setIsShared]   = useState(branch?.isShared ?? false)
  const [error, setError]         = useState('')

  const save = useMutation({
    mutationFn: () => {
      const dto: CreateBranchDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        isShared,
      }
      return isEdit ? branchesService.update(branch!.id, dto) : branchesService.create(dto)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      onClose()
    },
    onError: () => setError('Failed to save. Please try again.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Branch name is required'); return }
    setError('')
    save.mutate()
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit Branch' : 'New Branch'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name <span className="text-red-400">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Siraz Uddin Family" className={inputCls} autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe this branch…" className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsShared(!isShared)}
                className={`relative w-10 h-5 rounded-full transition-colors ${isShared ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isShared ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Shared / Common ancestors</p>
                <p className="text-xs text-gray-400">Persons in this branch are visible to members of all branches</p>
              </div>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={save.isPending} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {save.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />{isEdit ? 'Save Changes' : 'Create Branch'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Branch Card ───────────────────────────────────────────────────────────────

function BranchCard({ branch, onEdit, onDelete, isSuperAdmin }: { branch: Branch; onEdit: () => void; onDelete: () => void; isSuperAdmin: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${branch.isShared ? 'bg-amber-100' : 'bg-indigo-100'}`}>
            {branch.isShared ? <Share2 className="h-5 w-5 text-amber-600" /> : <GitBranch className="h-5 w-5 text-indigo-600" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{branch.name}</h3>
            {branch.isShared && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Shared / Common ancestors</span>
            )}
          </div>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>

      {branch.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{branch.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>{branch.memberCount} {branch.memberCount === 1 ? 'person' : 'persons'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/branches/${branch.id}/tree`}
            className="text-xs font-medium text-green-600 hover:text-green-800 flex items-center gap-1"
            title="View branch family tree"
          >
            <TreePine className="h-3.5 w-3.5" /> Tree
          </Link>
          <Link
            to={`/branches/${branch.id}`}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            {branch.isCurrentUserAdmin ? 'Manage →' : 'View →'}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BranchesPage() {
  const qc = useQueryClient()
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<Branch | null>(null)

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  })

  function handleDelete(branch: Branch) {
    if (!window.confirm(`Delete branch "${branch.name}"? This cannot be undone.`)) return
    deleteMutation.mutate(branch.id)
  }

  const totalPersons = branches.reduce((sum, b) => sum + b.memberCount, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-indigo-600" />
            Branch Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {branches.length} branches · {totalPersons} person assignments
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Branch
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <GitBranch className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p className="font-semibold">Full bloodline tracking — how to assign branches</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-600">
              <li><strong>Sons &amp; Daughters</strong> → primary branch = their <strong>father's branch</strong> ⭐</li>
              <li><strong>Husbands (in-laws)</strong> → add to wife's birth branch as <strong>secondary</strong> (so the family unit is visible)</li>
              <li><strong>Grandchildren</strong> → primary = father's branch; if father's family not tracked → mother's birth branch</li>
              <li>Create a <strong>Shared</strong> branch for great-grandparents — visible to all branches</li>
              <li>This tracks the <strong>full Azim Uddin bloodline</strong> through all sons and daughters</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No branches yet</p>
          {isSuperAdmin ? (
            <>
              <p className="text-gray-400 text-sm mt-1">Create your first branch to start organizing your family.</p>
              <button onClick={() => setShowCreate(true)} className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Create first branch
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-sm mt-1">No branches have been created yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onEdit={() => setEditing(branch)}
              onDelete={() => handleDelete(branch)}
              isSuperAdmin={isSuperAdmin}
            />
          ))}
        </div>
      )}

      {/* Modals — super admin only */}
      {isSuperAdmin && showCreate && <BranchFormModal onClose={() => setShowCreate(false)} />}
      {isSuperAdmin && editing    && <BranchFormModal branch={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

