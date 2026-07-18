import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus, X, Heart, Users, UserCheck, Dna, BookOpen,
  Loader2, AlertCircle, Calendar, MapPin,
} from 'lucide-react'
import { relationshipsService } from '@/services/relationships.service'
import { PersonSearchPicker } from './PersonSearchPicker'
import { Badge } from '@/components/ui/Badge'
import type { Person, NameType } from '@/types/person'
import type { Relationship, Marriage } from '@/types/relationship'

// ── shared modal shell ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalFooter({ onCancel, onConfirm, confirmLabel, loading, disabled }: {
  onCancel: () => void; onConfirm: () => void
  confirmLabel: string; loading?: boolean; disabled?: boolean
}) {
  return (
    <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
      <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100">
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled || loading}
        className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {confirmLabel}
      </button>
    </div>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

// ── Add Relationship Modal ────────────────────────────────────────────────────
interface AddRelationshipModalProps {
  personId: string
  persons: Person[]
  excludeIds: Set<string>
  mode: 'parent' | 'child' | 'sibling'
  onClose: () => void
}

function AddRelationshipModal({ personId, persons, excludeIds, mode, onClose }: AddRelationshipModalProps) {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const titles = { parent: 'Add Parent', child: 'Add Child', sibling: 'Add Sibling' }
  const descs  = {
    parent:  'Select the person who is a parent of this person.',
    child:   'Select the person who is a child of this person.',
    sibling: 'Select the person who is a sibling of this person.',
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error('No person selected')
      if (mode === 'parent')  return relationshipsService.createRelationship(selectedId, personId, 'parent')
      if (mode === 'child')   return relationshipsService.createRelationship(personId, selectedId, 'parent')
      return relationshipsService.createRelationship(personId, selectedId, 'sibling')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['relationships'] })
      qc.invalidateQueries({ queryKey: ['person-relationships', personId] })
      onClose()
    },
  })

  return (
    <Modal title={titles[mode]} onClose={onClose}>
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-gray-500">{descs[mode]}</p>
        <PersonSearchPicker
          persons={persons}
          excludeIds={excludeIds}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {mutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Failed — this relationship may already exist.
          </div>
        )}
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={() => mutation.mutate()}
        confirmLabel={titles[mode]}
        loading={mutation.isPending}
        disabled={!selectedId}
      />
    </Modal>
  )
}

// ── Add Marriage Modal ────────────────────────────────────────────────────────
interface AddMarriageModalProps {
  personId: string
  persons: Person[]
  excludeIds: Set<string>
  onClose: () => void
}

function AddMarriageModal({ personId, persons, excludeIds, onClose }: AddMarriageModalProps) {
  const qc = useQueryClient()
  const [selectedId, setSelectedId]       = useState<string | null>(null)
  const [marriageDate, setMarriageDate]   = useState('')
  const [marriagePlace, setMarriagePlace] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error('No person selected')
      return relationshipsService.createMarriage(personId, selectedId, {
        marriageDate:  marriageDate || undefined,
        marriagePlace: marriagePlace || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marriages'] })
      qc.invalidateQueries({ queryKey: ['person-marriages', personId] })
      onClose()
    },
  })

  return (
    <Modal title="Add Spouse / Marriage" onClose={onClose}>
      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-gray-500">Select the spouse, then optionally add marriage details.</p>
        <PersonSearchPicker
          persons={persons}
          excludeIds={excludeIds}
          selectedId={selectedId}
          onSelect={setSelectedId}
          placeholder="Search for spouse…"
        />
        {selectedId && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Marriage Details (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <Calendar className="h-3 w-3 inline mr-1" />Marriage Date
                </label>
                <input type="date" value={marriageDate} onChange={e => setMarriageDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <MapPin className="h-3 w-3 inline mr-1" />Marriage Place
                </label>
                <input type="text" value={marriagePlace} onChange={e => setMarriagePlace(e.target.value)} placeholder="e.g. Dhaka" className={inputCls} />
              </div>
            </div>
          </div>
        )}
        {mutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Failed — this marriage may already exist.
          </div>
        )}
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={() => mutation.mutate()}
        confirmLabel="Add Marriage"
        loading={mutation.isPending}
        disabled={!selectedId}
      />
    </Modal>
  )
}

// ── Add Person Name Modal ─────────────────────────────────────────────────────
const NAME_TYPES: { value: NameType; label: string; desc: string }[] = [
  { value: 'nickname', label: 'Nickname',     desc: 'Family or informal name' },
  { value: 'birth',    label: 'Birth Name',   desc: 'Official name at birth' },
  { value: 'married',  label: 'Married Name', desc: 'Name after marriage' },
  { value: 'title',    label: 'Title',        desc: 'e.g. Dr., Haji, Alhaj' },
  { value: 'alias',    label: 'Alias',        desc: 'Other known names' },
]

function AddPersonNameModal({ personId, onClose }: { personId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName]         = useState('')
  const [nameType, setNameType] = useState<NameType>('nickname')
  const [notes, setNotes]       = useState('')

  const mutation = useMutation({
    mutationFn: () => relationshipsService.createPersonName(personId, name.trim(), nameType, notes.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['person', personId] })
      onClose()
    },
  })

  return (
    <Modal title="Add Alternative Name" onClose={onClose}>
      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Moyen, Haji Saheb, Dr. Uddin"
            className={inputCls}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="space-y-1.5">
            {NAME_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setNameType(t.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border-2 text-left text-sm transition-all ${
                  nameType === t.value
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium text-gray-800">{t.label}</span>
                <span className="text-gray-400 text-xs">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. used from 1980 to 1995" className={inputCls} />
        </div>
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={() => mutation.mutate()}
        confirmLabel="Add Name"
        loading={mutation.isPending}
        disabled={!name.trim()}
      />
    </Modal>
  )
}

// ── Connection Row ────────────────────────────────────────────────────────────
function ConnectionRow({ label, to, badge, onRemove, removing }: {
  label: string; to: string; badge?: string; onRemove: () => void; removing: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 group">
      <Link to={to} className="text-sm font-medium text-indigo-700 hover:text-indigo-900 flex-1 truncate">
        {label}
      </Link>
      {badge && <Badge variant="default">{badge}</Badge>}
      <button
        onClick={onRemove}
        disabled={removing}
        className="ml-2 p-1 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
        title="Remove"
      >
        {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors font-medium"
    >
      <Plus className="h-3 w-3" /> {label}
    </button>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
function ConnectionSection({ icon: Icon, title, action, children }: {
  icon: React.ElementType; title: string; action: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
interface FamilyConnectionsSectionProps {
  personId: string
  persons: Person[]
  relationships: Relationship[]
  marriages: Marriage[]
}

type ModalType = 'parent' | 'child' | 'sibling' | 'marriage' | 'name' | null

export function FamilyConnectionsSection({
  personId, persons, relationships, marriages,
}: FamilyConnectionsSectionProps) {
  const qc = useQueryClient()
  const [modal, setModal]       = useState<ModalType>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  // ── Compute connections from relationships ──────────────────────────────────
  const parents  = relationships.filter(r => r.type === 'parent'  && r.person2.id === personId)
  const children = relationships.filter(r => r.type === 'parent'  && r.person1.id === personId)

  // Siblings: deduplicate — DB stores both A→B and B→A, keep only one per unique sibling
  const _siblingsRaw = relationships.filter(r =>
    r.type === 'sibling' && (r.person1.id === personId || r.person2.id === personId)
  )
  const _seenSiblings = new Set<string>()
  const siblings = _siblingsRaw.filter(r => {
    const otherId = r.person1.id === personId ? r.person2.id : r.person1.id
    if (_seenSiblings.has(otherId)) return false
    _seenSiblings.add(otherId)
    return true
  })

  const personMarriages = marriages.filter(m => m.spouse1.id === personId || m.spouse2.id === personId)

  // PersonName records come from the person object — fetch from cache
  const cachedPerson = qc.getQueryData<Person>(['person', personId])
  const personNames  = cachedPerson?.personNames ?? []

  // IDs to exclude from pickers (avoid self-linking and duplicate links)
  const linkedIds = new Set([
    personId,
    ...parents.map(r => r.person1.id),
    ...children.map(r => r.person2.id),
    ...siblings.map(r => r.person1.id === personId ? r.person2.id : r.person1.id),
    ...personMarriages.map(m => m.spouse1.id === personId ? m.spouse2.id : m.spouse1.id),
  ])

  // ── Remove handlers ─────────────────────────────────────────────────────────
  async function removeRelationship(id: string) {
    setRemoving(id)
    try {
      await relationshipsService.deleteRelationship(id)
      qc.invalidateQueries({ queryKey: ['relationships'] })
      qc.invalidateQueries({ queryKey: ['person-relationships', personId] })
    } finally { setRemoving(null) }
  }

  async function removeMarriage(id: string) {
    setRemoving(id)
    try {
      await relationshipsService.deleteMarriage(id)
      qc.invalidateQueries({ queryKey: ['marriages'] })
      qc.invalidateQueries({ queryKey: ['person-marriages', personId] })
    } finally { setRemoving(null) }
  }

  async function removePersonName(id: string) {
    setRemoving(id)
    try {
      await relationshipsService.deletePersonName(id)
      qc.invalidateQueries({ queryKey: ['person', personId] })
    } finally { setRemoving(null) }
  }

  const empty = <p className="text-sm text-gray-400">None recorded</p>

  return (
    <div className="space-y-4">
      {/* Parents */}
      <ConnectionSection icon={Dna} title="Parents" action={<AddButton label="Add Parent" onClick={() => setModal('parent')} />}>
        {parents.length === 0 ? empty : parents.map(r => (
          <ConnectionRow
            key={r.id}
            label={`${r.person1.firstName} ${r.person1.lastName}`}
            to={`/persons/${r.person1.id}`}
            onRemove={() => removeRelationship(r.id)}
            removing={removing === r.id}
          />
        ))}
      </ConnectionSection>

      {/* Siblings */}
      <ConnectionSection icon={Users} title="Siblings" action={<AddButton label="Add Sibling" onClick={() => setModal('sibling')} />}>
        {siblings.length === 0 ? empty : siblings.map(r => {
          const other = r.person1.id === personId ? r.person2 : r.person1
          return (
            <ConnectionRow
              key={r.id}
              label={`${other.firstName} ${other.lastName}`}
              to={`/persons/${other.id}`}
              onRemove={() => removeRelationship(r.id)}
              removing={removing === r.id}
            />
          )
        })}
      </ConnectionSection>

      {/* Marriages */}
      <ConnectionSection icon={Heart} title="Spouse / Marriages" action={<AddButton label="Add Spouse" onClick={() => setModal('marriage')} />}>
        {personMarriages.length === 0 ? empty : personMarriages.map(m => {
          const spouse = m.spouse1.id === personId ? m.spouse2 : m.spouse1
          return (
            <ConnectionRow
              key={m.id}
              label={`${spouse.firstName} ${spouse.lastName}`}
              to={`/persons/${spouse.id}`}
              badge={m.isDivorced ? 'Divorced' : undefined}
              onRemove={() => removeMarriage(m.id)}
              removing={removing === m.id}
            />
          )
        })}
      </ConnectionSection>

      {/* Children */}
      <ConnectionSection icon={UserCheck} title="Children" action={<AddButton label="Add Child" onClick={() => setModal('child')} />}>
        {children.length === 0 ? empty : children.map(r => (
          <ConnectionRow
            key={r.id}
            label={`${r.person2.firstName} ${r.person2.lastName}`}
            to={`/persons/${r.person2.id}`}
            onRemove={() => removeRelationship(r.id)}
            removing={removing === r.id}
          />
        ))}
      </ConnectionSection>

      {/* Alternative Names */}
      <ConnectionSection icon={BookOpen} title="Alternative Names" action={<AddButton label="Add Name" onClick={() => setModal('name')} />}>
        {personNames.length === 0 ? empty : personNames.map(n => (
          <div key={n.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 group">
            <span className="text-sm text-gray-800">{n.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="default">{n.nameType}</Badge>
              <button
                onClick={() => removePersonName(n.id)}
                disabled={removing === n.id}
                className="p-1 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              >
                {removing === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </ConnectionSection>

      {/* Modals */}
      {(modal === 'parent' || modal === 'child' || modal === 'sibling') && (
        <AddRelationshipModal
          personId={personId}
          persons={persons}
          excludeIds={linkedIds}
          mode={modal}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'marriage' && (
        <AddMarriageModal
          personId={personId}
          persons={persons}
          excludeIds={linkedIds}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'name' && (
        <AddPersonNameModal
          personId={personId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

