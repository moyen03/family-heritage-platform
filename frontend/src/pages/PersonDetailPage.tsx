import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ArrowLeft, Calendar, MapPin, User,
  GitBranch, Dna, BookOpen, Pencil, Network, Phone,
} from 'lucide-react'
import { personsService } from '@/services/persons.service'
import { relationshipsService } from '@/services/relationships.service'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PersonFormModal } from '@/components/persons/PersonFormModal'
import { FamilyConnectionsSection } from '@/components/persons/FamilyConnectionsSection'
import { PersonAddressPanel } from '@/components/addresses/PersonAddressPanel'

function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)

  const { data: person, isLoading, error } = useQuery({
    queryKey: ['person', id],
    queryFn: () => personsService.getById(id!),
    enabled: !!id,
  })

  const { data: relationships = [] } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => relationshipsService.getAll(),
  })

  const { data: marriages = [] } = useQuery({
    queryKey: ['marriages'],
    queryFn: () => relationshipsService.getAllMarriages(),
  })

  const { data: allPersons = [] } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personsService.getAll(),
    select: (d) => d?.['member'] ?? d?.['hydra:member'] ?? [],
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Person not found or failed to load.
        </div>
      </div>
    )
  }

  const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : null
  const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : null

  // Filter global data to this person
  const personRelationships = relationships.filter(
    r => r.person1.id === id || r.person2.id === id
  )
  const personMarriages = marriages.filter(
    m => m.spouse1.id === id || m.spouse2.id === id
  )

  return (
    <div className="p-8 overflow-y-auto flex-1">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-start gap-5">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold flex-shrink-0 ${
          person.gender === 'male' ? 'bg-blue-100 text-blue-700' :
          person.gender === 'female' ? 'bg-pink-100 text-pink-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {person.firstName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{person.fullName}</h1>
          {person.maidenName && (
            <p className="text-sm text-gray-500 mt-0.5">née {person.maidenName}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant={person.gender === 'male' ? 'info' : person.gender === 'female' ? 'warning' : 'default'}>
              {person.gender}
            </Badge>
            <Badge variant={person.isLiving ? 'success' : 'default'}>
              {person.isLiving ? 'Living' : 'Deceased'}
            </Badge>
            {birthYear && (
              <Badge variant="default">
                {birthYear}{!person.isLiving && deathYear ? ` – ${deathYear}` : ''}
              </Badge>
            )}
          </div>
        </div>
        <Link
          to="/tree"
          state={{ focusId: person.id }}
          className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 flex-shrink-0"
        >
          <GitBranch className="h-3 w-3" /> View in tree
        </Link>
        <button
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Life Events */}
        <Section title="Life Events" icon={Calendar}>
          <InfoRow label="Born" value={
            person.birthDate
              ? new Date(person.birthDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
              : null
          } />
          {person.birthPlace && (
            <InfoRow label="Birth Place" value={
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gray-400" />{person.birthPlace}</span>
            } />
          )}
          {!person.isLiving && (
            <>
              <InfoRow label="Died" value={
                person.deathDate
                  ? new Date(person.deathDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Unknown'
              } />
              {person.deathPlace && (
                <InfoRow label="Death Place" value={
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gray-400" />{person.deathPlace}</span>
                } />
              )}
            </>
          )}
          {!person.birthDate && !person.deathDate && (
            <p className="text-sm text-gray-400">No life event records</p>
          )}
        </Section>

        {/* Contact */}
        {person.phone && (
          <Section title="Contact" icon={Phone}>
            <a
              href={`tel:${person.phone}`}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Phone className="h-4 w-4" />
              {person.phone}
            </a>
          </Section>
        )}

        {/* Names */}
        <Section title="Alternative Names" icon={User}>
          {person.personNames && person.personNames.length > 0 ? (
            <div className="space-y-2">
              {person.personNames.map((n) => (
                <div key={n.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-800">{n.name}</span>
                  <Badge variant="default">{n.nameType}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No alternative names</p>
          )}
        </Section>

        {/* Ancestors quick view */}
        <Section title="Ancestry" icon={Dna}>
          <div className="flex gap-3">
            <Link
              to={`/tree`}
              state={{ focusId: id, highlight: 'ancestors' }}
              className="flex-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center text-sm text-blue-700 hover:bg-blue-100 transition-colors"
            >
              View Ancestors
            </Link>
            <Link
              to={`/tree`}
              state={{ focusId: id, highlight: 'descendants' }}
              className="flex-1 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-center text-sm text-green-700 hover:bg-green-100 transition-colors"
            >
              View Descendants
            </Link>
          </div>
        </Section>

        {/* Biography */}
        {person.biography && (
          <Section title="Biography" icon={BookOpen}>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{person.biography}</p>
          </Section>
        )}
      </div>

      {/* Family Connections — full width below the grid */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Family Connections</h2>
          <span className="text-sm text-gray-400">— link parents, children, siblings, spouses and names</span>
        </div>
        <FamilyConnectionsSection
          personId={person.id}
          persons={allPersons}
          relationships={personRelationships}
          marriages={personMarriages}
        />
      </div>

      {/* Addresses — full width */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <PersonAddressPanel
          personId={person.id}
          personName={person.fullName}
        />
      </div>

      {/* Edit modal */}
      {showEdit && (
        <PersonFormModal
          person={person}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}

