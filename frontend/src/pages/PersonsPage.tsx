import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, User, ChevronRight, UserPlus, ChevronLeft, Trash2, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { personsService } from '@/services/persons.service'
import { branchesService, type Branch } from '@/services/branches.service'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PersonFormModal } from '@/components/persons/PersonFormModal'
import type { Person } from '@/types/person'
import { useAuthStore, selectCanWrite, selectIsSuperAdmin, selectIsBranchAdmin } from '@/store/auth.store'

function GenderBadge({ gender }: { gender: Person['gender'] }) {
  const map = {
    male: { label: 'Male', variant: 'info' },
    female: { label: 'Female', variant: 'warning' },
    other: { label: 'Other', variant: 'default' },
    unknown: { label: 'Unknown', variant: 'default' },
  } as const
  const { label, variant } = map[gender]
  return <Badge variant={variant}>{label}</Badge>
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function PersonsPage() {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const canWrite    = useAuthStore(selectCanWrite)
  const isSuperAdmin  = useAuthStore(selectIsSuperAdmin)
  const isBranchAdmin = useAuthStore(selectIsBranchAdmin)
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personsService.getAll(),
  })

  // Fetch admin's own branches (only used for branch-admin remove action)
  const { data: adminBranches = [] } = useQuery<Branch[]>({
    queryKey: ['branches-admin-own'],
    queryFn: async () => {
      const list = await branchesService.getAll()
      return list.filter((b) => b.isCurrentUserAdmin)
    },
    enabled: isBranchAdmin && !isSuperAdmin,
  })
  const adminBranchIds = new Set(adminBranches.map((b) => b.id))

  // Super admin: soft-delete the person entirely
  const deleteMutation = useMutation({
    mutationFn: (id: string) => personsService.delete(id),
    onSuccess: () => {
      setConfirmId(null)
      qc.invalidateQueries({ queryKey: ['persons'] })
    },
  })

  // Branch admin: unassign person from their branch
  const removeMutation = useMutation({
    mutationFn: ({ branchId, personId }: { branchId: string; personId: string }) =>
      branchesService.removePerson(branchId, personId),
    onSuccess: () => {
      setConfirmId(null)
      qc.invalidateQueries({ queryKey: ['persons'] })
      qc.invalidateQueries({ queryKey: ['branch-persons'] })
    },
  })

  const persons = data?.['member'] ?? data?.['hydra:member'] ?? []

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return persons.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
    )
  }, [persons, search])

  // Reset to page 1 when search changes
  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  function handleSearch(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handlePageSize(value: number) {
    setPageSize(value)
    setCurrentPage(1)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Persons</h1>
          <p className="text-gray-500 mt-1">
            {data?.['totalItems'] ?? data?.['hydra:totalItems'] ?? 0} persons in the database
            {search && ` · ${totalFiltered} matching`}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Add Person
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12"><LoadingSpinner /></div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Failed to load persons. Make sure the API is running.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No persons found</p>
          {search && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      ) : (
        <>
          {/* Page size selector + info row */}
          <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing{' '}
              <span className="font-medium text-gray-700">
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalFiltered)}
              </span>{' '}
              of <span className="font-medium text-gray-700">{totalFiltered}</span>
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-gray-400">Rows per page:</label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSize(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Birth</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                          {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{person.fullName}</p>
                          {person.maidenName && (
                            <p className="text-xs text-gray-400">née {person.maidenName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><GenderBadge gender={person.gender} /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {person.birthDate
                        ? new Date(person.birthDate).getFullYear()
                        : '—'}
                      {person.birthPlace && (
                        <span className="block text-xs text-gray-400 mt-0.5">{person.birthPlace}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={person.isLiving ? 'success' : 'default'}>
                        {person.isLiving ? 'Living' : 'Deceased'}
                      </Badge>
                    </td>
                     <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Super admin: delete person entirely */}
                        {isSuperAdmin && (
                          confirmId === person.id ? (
                            <span className="flex items-center gap-1.5 text-sm">
                              <span className="text-red-600 font-medium">Delete?</span>
                              <button
                                onClick={() => deleteMutation.mutate(person.id)}
                                disabled={deleteMutation.isPending}
                                className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="rounded-md border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                              >No</button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmId(person.id)}
                              className="rounded-md p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete person"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )
                        )}

                        {/* Branch admin: remove person from their branch */}
                        {isBranchAdmin && !isSuperAdmin && (() => {
                          // Find which of the admin's branches this person belongs to
                          const matchBranch = person.personBranches
                            .filter((pb) => adminBranchIds.has(pb.branch.id) && !pb.branch.name.toLowerCase().includes('shared'))
                            .map((pb) => pb.branch)[0]
                          if (!matchBranch) return null
                          return confirmId === person.id ? (
                            <span className="flex items-center gap-1.5 text-sm">
                              <span className="text-orange-600 font-medium text-xs">Remove from {matchBranch.name}?</span>
                              <button
                                onClick={() => removeMutation.mutate({ branchId: matchBranch.id, personId: person.id })}
                                disabled={removeMutation.isPending}
                                className="rounded-md bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                              >
                                {removeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="rounded-md border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                              >No</button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmId(person.id)}
                              className="rounded-md p-1 text-gray-300 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                              title={`Remove from ${matchBranch.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )
                        })()}

                        <Link
                          to={`/persons/${person.id}`}
                          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"
                        >
                          View <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>

              {/* Page number buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        safePage === item
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Person modal */}
      {showAdd && (
        <PersonFormModal onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}

