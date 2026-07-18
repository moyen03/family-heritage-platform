import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, GitBranch, ArrowRight } from 'lucide-react'
import { relationshipsService } from '@/services/relationships.service'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const RELATIONSHIP_LABELS: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'warning' | 'danger' }> = {
  parent:         { label: 'Parent',         color: 'info' },
  child:          { label: 'Child',           color: 'info' },
  sibling:        { label: 'Sibling',         color: 'success' },
  half_sibling:   { label: 'Half Sibling',    color: 'success' },
  step_parent:    { label: 'Step Parent',     color: 'warning' },
  step_child:     { label: 'Step Child',      color: 'warning' },
  adopted_parent: { label: 'Adoptive Parent', color: 'warning' },
  adopted_child:  { label: 'Adopted Child',   color: 'warning' },
  guardian:       { label: 'Guardian',        color: 'default' },
  foster_parent:  { label: 'Foster Parent',   color: 'default' },
}

const TYPE_GROUPS = [
  { key: 'all', label: 'All' },
  { key: 'parent', label: 'Parent / Child' },
  { key: 'sibling', label: 'Siblings' },
  { key: 'step', label: 'Step / Adopted' },
]

export function RelationshipsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: relationships = [], isLoading, error } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => relationshipsService.getAll(),
  })

  // De-duplicate: keep only canonical direction (parent/step_parent/adopted_parent/guardian/foster_parent over their inverse)
  const CANONICAL = new Set(['parent', 'sibling', 'half_sibling', 'step_parent', 'adopted_parent', 'guardian', 'foster_parent'])
  const unique = relationships.filter(r => CANONICAL.has(r.type))

  const filtered = unique.filter((r) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      r.person1.fullName.toLowerCase().includes(searchLower) ||
      r.person2.fullName.toLowerCase().includes(searchLower)

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'parent' && (r.type === 'parent' || r.type === 'child')) ||
      (typeFilter === 'sibling' && (r.type === 'sibling' || r.type === 'half_sibling')) ||
      (typeFilter === 'step' && (r.type.startsWith('step') || r.type.startsWith('adopted')))

    return matchesSearch && matchesType
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relationships</h1>
        <p className="text-gray-500 mt-1">{unique.length} unique relationship records ({relationships.length} total including inverses)</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TYPE_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setTypeFilter(g.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === g.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12"><LoadingSpinner /></div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Failed to load relationships.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No relationships found</p>
          {search && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Person</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Relation</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Related To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => {
                const meta = RELATIONSHIP_LABELS[r.type] ?? { label: r.type, color: 'default' as const }
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/persons/${r.person1.id}`}
                        className="text-sm font-medium text-primary-700 hover:text-primary-900"
                      >
                        {r.person1.fullName}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={meta.color}>{meta.label}</Badge>
                        <ArrowRight className="h-3 w-3 text-gray-300" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/persons/${r.person2.id}`}
                        className="text-sm font-medium text-primary-700 hover:text-primary-900"
                      >
                        {r.person2.fullName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(r.createdAtIso).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {unique.length} records
          </div>
        </div>
      )}
    </div>
  )
}

