import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, User, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { personsService } from '@/services/persons.service'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Person } from '@/types/person'

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

export function PersonsPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personsService.getAll(),
  })

  const persons = data?.['hydra:member'] ?? []
  const filtered = persons.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.lastName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Persons</h1>
        <p className="text-gray-500 mt-1">
          {data?.['hydra:totalItems'] ?? 0} persons in the database
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              {filtered.map((person) => (
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
                      <span className="text-gray-400"> · {person.birthPlace}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={person.isLiving ? 'success' : 'default'}>
                      {person.isLiving ? 'Living' : 'Deceased'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/persons/${person.id}`}
                      className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      View <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

