import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ArrowLeft, Calendar, MapPin, User, Heart, GitBranch,
  Users, Dna, BookOpen, Pencil,
} from 'lucide-react'
import { personsService } from '@/services/persons.service'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PersonFormModal } from '@/components/persons/PersonFormModal'

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

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: 'Parent',
  child: 'Child',
  sibling: 'Sibling',
  half_sibling: 'Half Sibling',
  step_parent: 'Step Parent',
  step_child: 'Step Child',
  adopted_parent: 'Adoptive Parent',
  adopted_child: 'Adopted Child',
  guardian: 'Guardian',
  foster_parent: 'Foster Parent',
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
    queryKey: ['person-relationships', id],
    queryFn: () => personsService.getRelationships(id!),
    enabled: !!id,
  })

  const { data: marriages = [] } = useQuery({
    queryKey: ['person-marriages', id],
    queryFn: () => personsService.getMarriages(id!),
    enabled: !!id,
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

        {/* Marriages */}
        {marriages.length > 0 && (
          <Section title="Marriages" icon={Heart}>
            <div className="space-y-3">
              {marriages.map((m) => {
                const spouse = m.spouse1.id === id ? m.spouse2 : m.spouse1
                return (
                  <div key={m.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to={`/persons/${spouse.id}`}
                          className="font-medium text-sm text-primary-700 hover:text-primary-900"
                        >
                          {spouse.fullName}
                        </Link>
                        {m.marriageDate && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Married {new Date(m.marriageDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}
                            {m.marriagePlace && ` in ${m.marriagePlace}`}
                          </p>
                        )}
                        {m.divorceDate && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Divorced {new Date(m.divorceDate).getFullYear()}
                          </p>
                        )}
                      </div>
                      {m.isDivorced && <Badge variant="default">Divorced</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Relationships */}
        {relationships.length > 0 && (
          <Section title={`Relationships (${relationships.length})`} icon={Users}>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {relationships.map((r) => {
                const other = r.person1.id === id ? r.person2 : r.person1
                return (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <Link
                      to={`/persons/${other.id}`}
                      className="text-sm text-primary-700 hover:text-primary-900 font-medium"
                    >
                      {other.fullName}
                    </Link>
                    <Badge variant="default">{RELATIONSHIP_LABELS[r.type] ?? r.type}</Badge>
                  </div>
                )
              })}
            </div>
          </Section>
        )}

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

