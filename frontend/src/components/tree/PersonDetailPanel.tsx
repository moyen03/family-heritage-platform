import { useState } from 'react'
import { X, Calendar, MapPin, User, Heart, BookOpen, Users, Dna, GitBranch } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { personsService } from '@/services/persons.service'
import { FamilyUnitView } from './FamilyUnitView'
import type { Person } from '@/types/person'
import type { Relationship, Marriage } from '@/types/relationship'

interface PersonDetailPanelProps {
  personId: string
  persons: Person[]
  relationships: Relationship[]
  marriages: Marriage[]
  onClose: () => void
  onNavigate: (id: string) => void
  highlightMode: 'ancestor' | 'descendant' | null
  highlightCount: number
  onHighlightAncestors: (id: string) => void
  onHighlightDescendants: (id: string) => void
  onClearHighlight: () => void
}

type Tab = 'family' | 'details'

export function PersonDetailPanel({
  personId, persons, relationships, marriages,
  onClose, onNavigate,
  highlightMode, highlightCount,
  onHighlightAncestors, onHighlightDescendants, onClearHighlight,
}: PersonDetailPanelProps) {
  const [tab, setTab] = useState<Tab>('family')

  const { data: person, isLoading } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => personsService.getById(personId),
    enabled: !!personId,
  })

  const focal = persons.find(p => p.id === personId)

  return (
    <div className="w-1/2 min-w-[400px] max-w-2xl bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          {focal && (
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold flex-shrink-0 ${
              focal.gender === 'male'   ? 'bg-blue-100 text-blue-700' :
              focal.gender === 'female' ? 'bg-pink-100 text-pink-700' :
              'bg-gray-100 text-gray-500'}`}>
              {focal.firstName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{focal?.firstName} {focal?.lastName}</p>
            <p className="text-xs text-gray-400">
              {focal?.birthDate ? new Date(focal.birthDate).getFullYear() : '?'}
              {focal && !focal.isLiving && focal.deathDate ? ` – ${new Date(focal.deathDate).getFullYear()}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to={`/persons/${personId}`} className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
            Full profile →
          </Link>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Highlight banner */}
      {highlightMode && highlightCount > 0 && (
        <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 ${
          highlightMode === 'ancestor' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
          <span className={`h-2 w-2 rounded-full ${highlightMode === 'ancestor' ? 'bg-blue-400' : 'bg-green-400'}`} />
          {highlightCount} {highlightMode === 'ancestor' ? 'ancestors' : 'descendants'} highlighted
          <button onClick={onClearHighlight} className="ml-auto underline opacity-70 hover:opacity-100">clear</button>
        </div>
      )}

      {/* Highlight action buttons */}
      <div className="flex gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
        <button
          onClick={() => onHighlightAncestors(personId)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Dna className="h-3 w-3" /> Highlight Ancestors
        </button>
        <button
          onClick={() => onHighlightDescendants(personId)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
        >
          <Users className="h-3 w-3" /> Highlight Descendants
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['family', 'details'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors capitalize ${
              tab === t ? 'text-indigo-700 border-b-2 border-indigo-500 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'family' ? <><GitBranch className="h-3 w-3 inline mr-1" />Family Unit</> : <><User className="h-3 w-3 inline mr-1" />Details</>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'family' ? (
          <FamilyUnitView
            focalId={personId}
            persons={persons}
            relationships={relationships}
            marriages={marriages}
            onNavigate={onNavigate}
          />
        ) : (
          <DetailsTab person={person} personId={personId} isLoading={isLoading} marriages={marriages} />
        )}
      </div>
    </div>
  )
}

// ── Details tab ───────────────────────────────────────────────────────────────
function DetailsTab({ person, personId, isLoading, marriages }: {
  person: Person | undefined; personId: string; isLoading: boolean; marriages: Marriage[]
}) {
  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>
  if (!person)   return <div className="p-4 text-gray-400 text-sm">Details not available</div>

  const personMarriages = marriages.filter(m => m.spouse1.id === personId || m.spouse2.id === personId)

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      {person.personNames && person.personNames.length > 0 && (
        <Section title="Also Known As" icon={User}>
          {person.personNames.map(n => (
            <div key={n.id} className="flex items-center justify-between py-1 text-sm border-b border-gray-50 last:border-0">
              <span className="text-gray-800">{n.name}</span>
              <Badge variant="default">{n.nameType}</Badge>
            </div>
          ))}
        </Section>
      )}

      <Section title="Life Events" icon={Calendar}>
        {person.birthDate ? (
          <InfoRow label="Born">
            <span className="flex items-center gap-1 text-gray-700 text-sm">
              <Calendar className="h-3 w-3 text-gray-400" />
              {new Date(person.birthDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {person.birthPlace && <span className="flex items-center gap-1 text-gray-500 text-xs mt-0.5"><MapPin className="h-3 w-3" />{person.birthPlace}</span>}
          </InfoRow>
        ) : <p className="text-sm text-gray-400">No birth record</p>}
        {!person.isLiving && (
          <InfoRow label="Died">
            <span className="flex items-center gap-1 text-gray-700 text-sm">
              <Calendar className="h-3 w-3 text-gray-400" />
              {person.deathDate ? new Date(person.deathDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
            </span>
            {person.deathPlace && <span className="flex items-center gap-1 text-gray-500 text-xs mt-0.5"><MapPin className="h-3 w-3" />{person.deathPlace}</span>}
          </InfoRow>
        )}
      </Section>

      {personMarriages.length > 0 && (
        <Section title="Marriages" icon={Heart}>
          {personMarriages.map(m => {
            const spouse = m.spouse1.id === personId ? m.spouse2 : m.spouse1
            return (
              <div key={m.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm mb-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{spouse.fullName}</p>
                  {m.isDivorced && <Badge variant="default">Divorced</Badge>}
                </div>
                {m.marriageDate && <p className="text-gray-500 text-xs mt-0.5">Married {new Date(m.marriageDate).getFullYear()}{m.marriagePlace ? ` in ${m.marriagePlace}` : ''}</p>}
              </div>
            )
          })}
        </Section>
      )}

      {person.biography && (
        <Section title="Biography" icon={BookOpen}>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{person.biography}</p>
        </Section>
      )}
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 w-10 flex-shrink-0 text-xs">{label}</span>
      <div className="flex-1 flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

