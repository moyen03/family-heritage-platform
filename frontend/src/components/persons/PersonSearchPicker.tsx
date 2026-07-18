import { useState, useMemo } from 'react'
import { Search, Check, User } from 'lucide-react'
import type { Person } from '@/types/person'

const genderDot = {
  male: 'bg-blue-400',
  female: 'bg-pink-400',
  other: 'bg-purple-400',
  unknown: 'bg-gray-300',
}

interface PersonSearchPickerProps {
  persons: Person[]
  /** IDs to exclude from the list (e.g. the current person, already-linked relatives) */
  excludeIds?: Set<string>
  selectedId: string | null
  onSelect: (id: string) => void
  placeholder?: string
}

export function PersonSearchPicker({
  persons,
  excludeIds = new Set(),
  selectedId,
  onSelect,
  placeholder = 'Search by name…',
}: PersonSearchPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return persons
      .filter(p => !excludeIds.has(p.id))
      .filter(p => {
        if (!q) return true
        return (
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          (p.fullName ?? '').toLowerCase().includes(q)
        )
      })
      .slice(0, 40)
  }, [persons, excludeIds, query])

  const selected = persons.find(p => p.id === selectedId)

  return (
    <div className="flex flex-col gap-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
      </div>

      {/* Selected badge */}
      {selected && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
          <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
          <span className="font-medium text-indigo-800">{selected.firstName} {selected.lastName}</span>
          <span className="text-indigo-400 text-xs ml-auto">Selected</span>
        </div>
      )}

      {/* Person list */}
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">
            <User className="h-6 w-6 mx-auto mb-1 opacity-40" />
            No persons found
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.map(p => {
              const year = p.birthDate ? new Date(p.birthDate).getFullYear() : null
              const isSelected = p.id === selectedId
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(p.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${genderDot[p.gender] ?? genderDot.unknown}`} />
                    <span className="flex-1 font-medium truncate">{p.firstName} {p.lastName}</span>
                    {year && <span className="text-gray-400 text-xs">{year}</span>}
                    {!p.isLiving && <span className="text-gray-400 text-xs">†</span>}
                    {isSelected && <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

