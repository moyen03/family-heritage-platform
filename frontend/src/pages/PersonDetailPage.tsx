import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ArrowLeft, Calendar, MapPin, User,
  GitBranch, Dna, BookOpen, Pencil, Network, Phone, Share2, Star,
  Briefcase, GraduationCap, CreditCard, Droplets,
} from 'lucide-react'
import { personsService } from '@/services/persons.service'
import { relationshipsService } from '@/services/relationships.service'
import { branchesService } from '@/services/branches.service'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PersonFormModal } from '@/components/persons/PersonFormModal'
import { FamilyConnectionsSection } from '@/components/persons/FamilyConnectionsSection'
import { PersonAddressPanel } from '@/components/addresses/PersonAddressPanel'
import { useAuthStore, selectIsAdmin } from '@/store/auth.store'

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


function InfoCard({ label, value, icon: Icon, span2 = false }: {
  label: string
  value: React.ReactNode
  icon?: React.ElementType
  span2?: boolean
}) {
  if (!value) return null
  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${span2 ? 'col-span-2' : ''}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
        <span>{value}</span>
      </div>
    </div>
  )
}

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const isAdmin = useAuthStore(selectIsAdmin)

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

  const { data: allBranches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesService.getAll(),
  })

  // Branches this person already belongs to (from personBranches on person)
  const personBranchIds = new Set(
    (person?.personBranches ?? []).map((pb: { branch: { id: string } }) => pb.branch.id)
  )

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
    <div className="p-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-start gap-5">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden text-2xl font-bold flex-shrink-0 ${
          !person.profilePictureUrl
            ? person.gender === 'male' ? 'bg-blue-100 text-blue-700' :
              person.gender === 'female' ? 'bg-pink-100 text-pink-700' :
              'bg-gray-100 text-gray-500'
            : ''
        }`}>
          {person.profilePictureUrl ? (
            <img
              src={`http://localhost:8000${person.profilePictureUrl}`}
              alt={person.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            person.firstName.charAt(0)
          )}
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
            {person.bloodGroup && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                <Droplets className="h-3 w-3" />{person.bloodGroup}
              </span>
            )}
            {person.profession && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Briefcase className="h-3 w-3" />{person.profession}
              </span>
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

      {/* ── Overview — full width, 3-col grid of facts ── */}
      <div className="mt-6">
      <Section title="Overview" icon={User}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Life */}
          <InfoCard label="Born" icon={Calendar} value={
            person.birthDate
              ? person.birthDatePrecision === 'year'
                ? new Date(person.birthDate).getFullYear().toString()
                : person.birthDatePrecision === 'approximate'
                  ? `~${new Date(person.birthDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}`
                  : new Date(person.birthDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
              : null
          } />
          <InfoCard label="Birth Place" icon={MapPin} value={person.birthPlace ?? null} />
          <InfoCard label="Mobile" icon={Phone} value={
            person.phone
              ? <a href={`tel:${person.phone}`} className="text-indigo-600 hover:text-indigo-800">{person.phone}</a>
              : null
          } />
          <InfoCard label="NID Number" icon={CreditCard} value={
            person.nidNumber ? <span className="font-mono">{person.nidNumber}</span> : null
          } />
          <InfoCard label="Blood Group" icon={Droplets} value={
            person.bloodGroup ? <span className="font-bold text-red-600">{person.bloodGroup}</span> : null
          } />
          <InfoCard label="Profession" icon={Briefcase} value={person.profession ?? null} />
          <InfoCard label="Education" icon={GraduationCap} value={person.highestEducation ?? null} />
          {!person.isLiving && (
            <>
              <InfoCard label="Died" icon={Calendar} value={
                person.deathDate
                  ? person.deathDatePrecision === 'year'
                    ? new Date(person.deathDate).getFullYear().toString()
                    : person.deathDatePrecision === 'approximate'
                      ? `~${new Date(person.deathDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}`
                      : new Date(person.deathDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'Unknown'
              } />
              <InfoCard label="Death Place" icon={MapPin} value={person.deathPlace ?? null} />
            </>
          )}
        </div>
        {!person.birthDate && !person.phone && !person.nidNumber && !person.bloodGroup && !person.profession && !person.highestEducation && (
          <p className="text-sm text-gray-400">No details recorded yet.</p>
        )}
      </Section>
      </div>

      {/* ── Alt Names + Ancestry — 2 col ── */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Ancestry */}
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
      </div>

      {/* Biography — full width at bottom */}
      {person.biography && (
        <div className="mt-6">
          <Section title="Biography" icon={BookOpen}>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{person.biography}</p>
          </Section>
        </div>
      )}

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

      {/* Branches — full width, admin only */}
      {isAdmin && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Branch Membership</h2>
          </div>

          {/* Current branches */}
          {allBranches.filter(b => personBranchIds.has(b.id)).length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {allBranches.filter(b => personBranchIds.has(b.id)).map(b => {
                const pb = (person.personBranches ?? []).find((x: { branch: { id: string }; isPrimary: boolean }) => x.branch.id === b.id)
                return (
                  <div key={b.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5">
                    {b.isShared ? <Share2 className="h-3 w-3 text-amber-500" /> : <GitBranch className="h-3 w-3 text-indigo-500" />}
                    <span className="text-sm font-medium text-indigo-700">{b.name}</span>
                    {pb?.isPrimary && <span title="Primary branch"><Star className="h-3 w-3 text-amber-500 fill-amber-500" /></span>}
                    <button
                      onClick={async () => {
                        await branchesService.removePerson(b.id, person.id)
                        qc.invalidateQueries({ queryKey: ['person', id] })
                        qc.invalidateQueries({ queryKey: ['branches'] })
                      }}
                      className="ml-1 text-indigo-400 hover:text-red-500 transition-colors"
                      title="Remove from this branch"
                    >×</button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">Not assigned to any branch yet.</p>
          )}

          {/* Assign to branch */}
          {allBranches.filter(b => !personBranchIds.has(b.id)).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Add to branch:</p>
              <div className="flex flex-wrap gap-2">
                {allBranches.filter(b => !personBranchIds.has(b.id)).map(b => (
                  <button
                    key={b.id}
                    onClick={async () => {
                      await branchesService.assignPerson(b.id, person.id)
                      qc.invalidateQueries({ queryKey: ['person', id] })
                      qc.invalidateQueries({ queryKey: ['branches'] })
                    }}
                    className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    {b.isShared ? <Share2 className="h-3 w-3" /> : <GitBranch className="h-3 w-3" />}
                    + {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <Link to="/branches" className="text-xs text-indigo-500 hover:text-indigo-700">Manage all branches →</Link>
          </div>
        </div>
      )}

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

