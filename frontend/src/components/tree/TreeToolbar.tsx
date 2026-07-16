import { useState, useRef, useEffect } from 'react'
import { Search, GitBranch, X, ArrowRight, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { personsService } from '@/services/persons.service'
import type { Person } from '@/types/person'
import type { PathFinderResult } from '@/types/relationship'

interface TreeToolbarProps {
  totalPersons: number
  onFocusPerson: (id: string) => void
}

function PersonSearchInput({
  placeholder,
  onSelect,
  selectedPerson,
  onClear,
}: {
  placeholder: string
  onSelect: (p: Person) => void
  selectedPerson: Person | null
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['persons-search', query],
    queryFn: () => personsService.getAll(1),
    enabled: query.length >= 1,
  })

  const filtered = (data?.['hydra:member'] ?? []).filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (selectedPerson) {
    return (
      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-sm font-medium text-amber-800">
        {selectedPerson.firstName} {selectedPerson.lastName}
        <button onClick={onClear} className="ml-1 text-amber-500 hover:text-amber-700">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-44 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-52 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col"
            >
              <span className="font-medium text-gray-900">{p.firstName} {p.lastName}</span>
              {p.birthDate && (
                <span className="text-xs text-gray-400">{new Date(p.birthDate).getFullYear()}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeToolbar({ totalPersons, onFocusPerson }: TreeToolbarProps) {
  // Name search (single person focus)
  const [searchPerson, setSearchPerson] = useState<Person | null>(null)

  // Path finder
  const [showPath, setShowPath] = useState(false)
  const [fromPerson, setFromPerson] = useState<Person | null>(null)
  const [toPerson, setToPerson]     = useState<Person | null>(null)
  const [pathResult, setPathResult] = useState<PathFinderResult | null>(null)
  const [pathLoading, setPathLoading] = useState(false)
  const [pathError, setPathError] = useState<string | null>(null)

  const handleSearchSelect = (p: Person) => {
    setSearchPerson(p)
    onFocusPerson(p.id)
  }

  const handleFindPath = async () => {
    if (!fromPerson || !toPerson) return
    setPathLoading(true)
    setPathError(null)
    setPathResult(null)
    try {
      const result = await personsService.findPath(fromPerson.id, toPerson.id)
      setPathResult(result)
    } catch {
      setPathError('Could not find a path between these two people.')
    } finally {
      setPathLoading(false)
    }
  }

  const handleClearPath = () => {
    setFromPerson(null)
    setToPerson(null)
    setPathResult(null)
    setPathError(null)
    setShowPath(false)
  }

  return (
    <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 py-2.5 flex items-center gap-3 shadow-sm z-10">
      {/* Stats */}
      <span className="text-xs text-gray-400 font-medium">
        {totalPersons} {totalPersons === 1 ? 'person' : 'people'}
      </span>

      <div className="h-4 w-px bg-gray-200" />

      {/* Name search */}
      <div className="flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <PersonSearchInput
          placeholder="Find person…"
          onSelect={handleSearchSelect}
          selectedPerson={searchPerson}
          onClear={() => setSearchPerson(null)}
        />
      </div>

      <div className="h-4 w-px bg-gray-200" />

      {/* Path finder toggle */}
      {!showPath ? (
        <button
          onClick={() => setShowPath(true)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 font-medium transition-colors"
        >
          <GitBranch className="h-3.5 w-3.5" />
          Find relationship
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <GitBranch className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          <PersonSearchInput
            placeholder="From person…"
            onSelect={setFromPerson}
            selectedPerson={fromPerson}
            onClear={() => { setFromPerson(null); setPathResult(null) }}
          />
          <ArrowRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <PersonSearchInput
            placeholder="To person…"
            onSelect={setToPerson}
            selectedPerson={toPerson}
            onClear={() => { setToPerson(null); setPathResult(null) }}
          />
          <button
            onClick={handleFindPath}
            disabled={!fromPerson || !toPerson || pathLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pathLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Search
          </button>
          <button onClick={handleClearPath} className="text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Path result inline */}
          {pathResult && (
            <div className="flex items-center gap-1.5 ml-2">
              {pathResult.found ? (
                <>
                  <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                    {pathResult.distance} step{pathResult.distance !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-500 max-w-xs truncate">
                    {pathResult.path.map((s) => s.person.fullName).join(' → ')}
                  </span>
                </>
              ) : (
                <span className="text-xs text-red-500">No connection found</span>
              )}
            </div>
          )}
          {pathError && (
            <span className="text-xs text-red-500 ml-2">{pathError}</span>
          )}
        </div>
      )}
    </div>
  )
}

