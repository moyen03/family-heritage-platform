import { memo, useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { Person } from '@/types/person'
import type { Marriage } from '@/types/relationship'

const genderStyle = {
  male:    { border: 'border-blue-300',   bg: 'bg-blue-50',   text: 'text-blue-800',   dot: 'bg-blue-400' },
  female:  { border: 'border-pink-300',   bg: 'bg-pink-50',   text: 'text-pink-800',   dot: 'bg-pink-400' },
  other:   { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-800', dot: 'bg-purple-400' },
  unknown: { border: 'border-gray-200',   bg: 'bg-gray-50',   text: 'text-gray-700',   dot: 'bg-gray-300' },
}

interface MiniCardProps {
  person: Person
  isFocal?: boolean
  onClick?: (id: string) => void
  label?: string
}

export const MiniPersonCard = memo(function MiniPersonCard({ person, isFocal, onClick, label }: MiniCardProps) {
  const s = genderStyle[person.gender] ?? genderStyle.unknown
  const year = person.birthDate ? new Date(person.birthDate).getFullYear() : null

  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>}
      <button
        onClick={() => onClick?.(person.id)}
        className={`
          rounded-xl border-2 p-2 text-center cursor-pointer transition-all min-w-[90px] max-w-[120px]
          ${isFocal
            ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200 shadow-md'
            : `${s.border} ${s.bg} hover:shadow-sm hover:brightness-95`}
        `}
      >
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${s.dot}`} />
          {!person.isLiving && <span className="text-gray-400 text-[10px]">†</span>}
        </div>
        <p className={`text-xs font-semibold leading-tight ${s.text} truncate`}>
          {person.firstName}
        </p>
        <p className={`text-xs leading-tight ${s.text} truncate`}>
          {person.lastName}
        </p>
        {year && <p className="text-[10px] text-gray-400 mt-0.5">{year}</p>}
      </button>
    </div>
  )
})

interface FamilyRowProps {
  label: string
  persons: Person[]
  focalId?: string
  onSelect: (id: string) => void
  spouses?: Map<string, Person>   // personId → spouse Person
}

function FamilyRow({ label, persons, focalId, onSelect, spouses }: FamilyRowProps) {
  if (persons.length === 0) return null
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <div className="flex flex-wrap justify-center gap-2">
        {persons.map(p => (
          <div key={p.id} className="flex items-center gap-1">
            <MiniPersonCard
              person={p}
              isFocal={p.id === focalId}
              onClick={onSelect}
            />
            {spouses?.has(p.id) && (
              <>
                <span className="text-rose-300 text-sm">♥</span>
                <MiniPersonCard
                  person={spouses.get(p.id)!}
                  onClick={onSelect}
                  label="spouse"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Vertical connector line between rows
function Connector() {
  return (
    <div className="flex justify-center w-full">
      <div className="w-0.5 h-6 bg-gray-300" />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FamilyUnitViewProps {
  focalId: string
  persons: Person[]
  relationships: Array<{ id: string; type: string; person1: { id: string }; person2: { id: string } }>
  marriages: Marriage[]
  onNavigate: (id: string) => void
}

export function FamilyUnitView({ focalId, persons, relationships, marriages, onNavigate }: FamilyUnitViewProps) {
  const byId = useCallback((id: string) => persons.find(p => p.id === id), [persons])
  const focal = byId(focalId)

  if (!focal) return <p className="text-sm text-gray-400 p-4">Person not found</p>

  // Parents of focal person
  const parents = relationships
    .filter(r => r.type === 'parent' && r.person2.id === focalId)
    .map(r => byId(r.person1.id))
    .filter(Boolean) as Person[]

  // Children of focal person
  const children = relationships
    .filter(r => r.type === 'parent' && r.person1.id === focalId)
    .map(r => byId(r.person2.id))
    .filter(Boolean) as Person[]

  // Siblings = share at least one parent with focal (exclude focal) — deduplicated
  const parentIds = new Set(parents.map(p => p.id))
  const siblingIds = new Set<string>()
  relationships
    .filter(r => r.type === 'parent' && parentIds.has(r.person1.id) && r.person2.id !== focalId)
    .forEach(r => siblingIds.add(r.person2.id))
  // Also include explicit sibling relationships (deduplicated by Set)
  relationships
    .filter(r => r.type === 'sibling' && (r.person1.id === focalId || r.person2.id === focalId))
    .forEach(r => {
      const otherId = r.person1.id === focalId ? r.person2.id : r.person1.id
      siblingIds.add(otherId)
    })
  const siblings = [...siblingIds]
    .map(id => byId(id))
    .filter(Boolean) as Person[]

  // Spouses of focal person
  const spouseMap = new Map<string, Person>()
  marriages
    .filter(m => m.spouse1.id === focalId || m.spouse2.id === focalId)
    .forEach(m => {
      const spouseId = m.spouse1.id === focalId ? m.spouse2.id : m.spouse1.id
      const spouse = byId(spouseId)
      if (spouse) spouseMap.set(focalId, spouse)
    })

  // Children spouses (show who each child married)
  const childSpouseMap = new Map<string, Person>()
  children.forEach(child => {
    const marriage = marriages.find(m => m.spouse1.id === child.id || m.spouse2.id === child.id)
    if (marriage) {
      const spouseId = marriage.spouse1.id === child.id ? marriage.spouse2.id : marriage.spouse1.id
      const spouse = byId(spouseId)
      if (spouse) childSpouseMap.set(child.id, spouse)
    }
  })

  // Navigation targets
  const upPerson = parents.find(p => p.gender === 'male') ?? parents[0]
  const downPerson = children[0]

  // Siblings row: siblings + focal (sorted by birth year, focal in its birth-order position)
  const generationRow = [...siblings, focal].sort((a, b) => {
    const ay = a.birthDate ? new Date(a.birthDate).getFullYear() : 9999
    const by_ = b.birthDate ? new Date(b.birthDate).getFullYear() : 9999
    return ay - by_
  })

  return (
    <div className="flex flex-col h-full">
      {/* Navigation header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs">
        <button
          onClick={() => upPerson && onNavigate(upPerson.id)}
          disabled={!upPerson}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
        >
          <ChevronUp className="h-3 w-3" />
          {upPerson ? `${upPerson.firstName} ${upPerson.lastName}` : 'No parent'}
        </button>
        <span className="text-gray-400 font-medium">family of {focal.firstName}</span>
        <button
          onClick={() => downPerson && onNavigate(downPerson.id)}
          disabled={!downPerson}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-green-600 hover:bg-green-50 disabled:text-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {downPerson ? `${downPerson.firstName}` : 'No child'}
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Family unit tree */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0">
        {/* Parents row */}
        {parents.length > 0 && (
          <>
            <FamilyRow label="Parents" persons={parents} onSelect={onNavigate} />
            <Connector />
          </>
        )}

        {/* Generation row (siblings + focal) */}
        <FamilyRow
          label={siblings.length > 0 ? 'Siblings & Person' : 'Person'}
          persons={generationRow}
          focalId={focalId}
          onSelect={onNavigate}
          spouses={spouseMap}
        />

        {/* Children row */}
        {children.length > 0 && (
          <>
            <Connector />
            <FamilyRow
              label="Children"
              persons={children}
              onSelect={onNavigate}
              spouses={childSpouseMap}
            />
          </>
        )}

        {parents.length === 0 && children.length === 0 && siblings.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No family connections recorded yet</p>
        )}
      </div>
    </div>
  )
}

