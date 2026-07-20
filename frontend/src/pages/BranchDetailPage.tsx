import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, GitBranch, Users, Search, UserPlus, Trash2, Loader2, Share2, Star } from 'lucide-react'
import { branchesService } from '@/services/branches.service'
import type { BranchMember } from '@/services/branches.service'
import { personsService } from '@/services/persons.service'

// ── Person picker (search + assign) ──────────────────────────────────────────

function AssignPersonPanel({
  branchId,
  existingIds,
  onAssigned,
}: {
  branchId: string
  existingIds: Set<string>
  onAssigned: () => void
}) {
  const [search, setSearch] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const qc = useQueryClient()

  const { data: allPersons = [] } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personsService.getAll().then(d => d?.['member'] ?? d?.['hydra:member'] ?? []),
  })

  const suggestions = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return allPersons
      .filter(p => !existingIds.has(p.id))
      .filter(p => p.fullName?.toLowerCase().includes(q))
      .slice(0, 8)
  }, [allPersons, search, existingIds])

  const assignMutation = useMutation({
    mutationFn: (personId: string) => branchesService.assignPerson(branchId, personId, isPrimary),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-persons', branchId] })
      qc.invalidateQueries({ queryKey: ['branches'] })
      setSearch('')
      onAssigned()
    },
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-indigo-500" /> Add Person to Branch
      </h3>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer">
        <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="rounded" />
        Mark as primary branch for this person
      </label>

      {suggestions.length > 0 && (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {suggestions.map(p => (
            <button
              key={p.id}
              onClick={() => assignMutation.mutate(p.id)}
              disabled={assignMutation.isPending}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-50 text-left transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{p.fullName}</p>
                <p className="text-xs text-gray-400">{p.isLiving ? 'Living' : 'Deceased'}</p>
              </div>
              <span className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {assignMutation.isPending ? '…' : '+ Add'}
              </span>
            </button>
          ))}
        </div>
      )}

      {search.trim() && suggestions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-3">No matching persons found</p>
      )}
    </div>
  )
}

// ── Member row ────────────────────────────────────────────────────────────────

function MemberRow({ member, branchId, onRemove }: { member: BranchMember; branchId: string; onRemove: () => void }) {
  const removeMutation = useMutation({
    mutationFn: () => branchesService.removePerson(branchId, member.id),
    onSuccess: onRemove,
  })

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 group">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
        member.gender === 'male' ? 'bg-blue-100 text-blue-700' :
        member.gender === 'female' ? 'bg-pink-100 text-pink-700' :
        'bg-gray-100 text-gray-500'
      }`}>
        {member.firstName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link to={`/persons/${member.id}`} className="text-sm font-medium text-gray-800 hover:text-indigo-600 truncate">
            {member.fullName}
          </Link>
          {member.isPrimary && (
            <span title="Primary branch" className="flex-shrink-0">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {member.birthDate ? new Date(member.birthDate).getFullYear() : '?'} · {member.isLiving ? 'Living' : 'Deceased'}
        </p>
      </div>
      <button
        onClick={() => removeMutation.mutate()}
        disabled={removeMutation.isPending}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
        title="Remove from branch"
      >
        {removeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [memberSearch, setMemberSearch] = useState('')

  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ['branch', id],
    queryFn: () => branchesService.getById(id!),
    enabled: !!id,
  })

  const { data: personsData, isLoading: membersLoading } = useQuery({
    queryKey: ['branch-persons', id],
    queryFn: () => branchesService.getPersons(id!),
    enabled: !!id,
  })

  const members: BranchMember[] = personsData?.members ?? []
  const existingIds = useMemo(() => new Set(members.map(m => m.id)), [members])

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members
    const q = memberSearch.toLowerCase()
    return members.filter(m => m.fullName.toLowerCase().includes(q))
  }, [members, memberSearch])

  function handleAssigned() {
    qc.invalidateQueries({ queryKey: ['branch-persons', id] })
  }

  if (branchLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>
  if (!branch) return <div className="p-8 text-red-500">Branch not found.</div>

  return (
    <div className="p-8">
      {/* Back */}
      <button onClick={() => navigate('/branches')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Branches
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${branch.isShared ? 'bg-amber-100' : 'bg-indigo-100'}`}>
            {branch.isShared ? <Share2 className="h-6 w-6 text-amber-600" /> : <GitBranch className="h-6 w-6 text-indigo-600" />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{branch.name}</h1>
            {branch.isShared && (
              <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Shared — common ancestors visible to all branches
              </span>
            )}
            {branch.description && <p className="text-sm text-gray-500 mt-2">{branch.description}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-indigo-600">{branch.memberCount}</p>
            <p className="text-xs text-gray-400">persons</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" /> Members ({members.length})
              </h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Filter…"
                  className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36"
                />
              </div>
            </div>

            {membersLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{members.length === 0 ? 'No persons assigned yet' : 'No matches'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredMembers.map(member => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    branchId={id!}
                    onRemove={handleAssigned}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add person panel */}
        <div>
          <AssignPersonPanel
            branchId={id!}
            existingIds={existingIds}
            onAssigned={handleAssigned}
          />

          {/* Legend */}
          <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-xs text-gray-500 space-y-1.5">
            <p className="font-semibold text-gray-600 mb-2">Assignment guide</p>
            <div className="flex items-start gap-2"><Star className="h-3 w-3 text-amber-500 fill-amber-500 mt-0.5 flex-shrink-0" /><span><strong>Primary ⭐</strong> = father's branch (sons &amp; daughters)</span></div>
            <div className="flex items-start gap-2"><Users className="h-3 w-3 text-indigo-400 mt-0.5 flex-shrink-0" /><span><strong>In-laws</strong> → add as secondary (no ⭐) so the family unit shows here</span></div>
            <div className="flex items-start gap-2"><Trash2 className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" /><span>Hover a row to remove from branch</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

