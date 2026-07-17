import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Heart, Calendar, MapPin } from 'lucide-react'
import { relationshipsService } from '@/services/relationships.service'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function MarriagesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'divorced'>('all')

  const { data: marriages = [], isLoading, error } = useQuery({
    queryKey: ['marriages'],
    queryFn: () => relationshipsService.getAllMarriages(),
  })

  const filtered = marriages.filter((m) => {
    const s = search.toLowerCase()
    const matchesSearch =
      !search ||
      m.spouse1.fullName.toLowerCase().includes(s) ||
      m.spouse2.fullName.toLowerCase().includes(s) ||
      (m.marriagePlace ?? '').toLowerCase().includes(s)

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && !m.isDivorced) ||
      (filter === 'divorced' && m.isDivorced)

    return matchesSearch && matchesFilter
  })

  const activeCount = marriages.filter((m) => !m.isDivorced).length
  const divorcedCount = marriages.filter((m) => m.isDivorced).length

  return (
    <div className="p-8 overflow-y-auto flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marriages</h1>
        <p className="text-gray-500 mt-1">
          {marriages.length} total · {activeCount} active · {divorcedCount} divorced
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or place…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'divorced'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12"><LoadingSpinner /></div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Failed to load marriages.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No marriages found</p>
          {search && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-xl border shadow-sm p-5 transition-shadow hover:shadow-md ${
                m.isDivorced ? 'border-gray-200 opacity-75' : 'border-rose-100'
              }`}
            >
              {/* Heart icon */}
              <div className="flex items-center justify-between mb-3">
                <Heart
                  className={`h-5 w-5 ${m.isDivorced ? 'text-gray-300' : 'text-rose-400'}`}
                  fill={m.isDivorced ? 'none' : 'currentColor'}
                />
                {m.isDivorced && <Badge variant="default">Divorced</Badge>}
              </div>

              {/* Spouses */}
              <div className="flex items-center gap-2 mb-3">
                <Link
                  to={`/persons/${m.spouse1.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-primary-700 transition-colors"
                >
                  {m.spouse1.fullName}
                </Link>
                <span className="text-gray-300 text-xs">♥</span>
                <Link
                  to={`/persons/${m.spouse2.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-primary-700 transition-colors"
                >
                  {m.spouse2.fullName}
                </Link>
              </div>

              {/* Date / Place */}
              <div className="space-y-1">
                {m.marriageDate && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    Married {new Date(m.marriageDate).toLocaleDateString('en-GB', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </div>
                )}
                {m.marriagePlace && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    {m.marriagePlace}
                  </div>
                )}
                {m.isDivorced && m.divorceDate && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="h-3 w-3 text-gray-300" />
                    Divorced {new Date(m.divorceDate).toLocaleDateString('en-GB', {
                      year: 'numeric', month: 'long',
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              {m.notes && (
                <p className="mt-2 text-xs text-gray-400 italic">{m.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

