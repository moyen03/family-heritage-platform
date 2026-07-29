import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, UserPlus, Loader2, AlertCircle } from 'lucide-react'
import { personsService } from '@/services/persons.service'
import { relationshipsService } from '@/services/relationships.service'
import type { Person, Gender } from '@/types/person'
import type { Relationship } from '@/types/relationship'

// ── Role type (also exported for use in PersonNode / FamilyTree) ──────────────

export type RelativeRole =
  | 'father'
  | 'mother'
  | 'son'
  | 'daughter'
  | 'partner'
  | 'brother'
  | 'sister'

// ── Metadata per role ─────────────────────────────────────────────────────────

interface RoleMeta {
  label: string
  defaultGender: Gender
  emoji: string
}

export const ROLE_META: Record<RelativeRole, RoleMeta> = {
  father:   { label: 'Father',   defaultGender: 'male',    emoji: '👨' },
  mother:   { label: 'Mother',   defaultGender: 'female',  emoji: '👩' },
  son:      { label: 'Son',      defaultGender: 'male',    emoji: '👦' },
  daughter: { label: 'Daughter', defaultGender: 'female',  emoji: '👧' },
  partner:  { label: 'Partner',  defaultGender: 'unknown', emoji: '💑' },
  brother:  { label: 'Brother',  defaultGender: 'male',    emoji: '🧑' },
  sister:   { label: 'Sister',   defaultGender: 'female',  emoji: '👩' },
}

// ── Helper: build the relationship after person is created ────────────────────

async function createRelativeLink(
  forPersonId: string,
  newPersonId: string,
  role: RelativeRole,
  /** forPerson's existing parent relationships — used to inherit ancestry for siblings */
  parentRels: Relationship[] = [],
): Promise<void> {
  switch (role) {
    case 'father':
    case 'mother':
      // new person is PARENT of forPerson
      await relationshipsService.createRelationship(newPersonId, forPersonId, 'parent')
      break
    case 'son':
    case 'daughter':
      // forPerson is PARENT of new person
      await relationshipsService.createRelationship(forPersonId, newPersonId, 'parent')
      break
    case 'partner':
      await relationshipsService.createMarriage(forPersonId, newPersonId)
      break
    case 'brother':
    case 'sister':
      if (parentRels.length > 0) {
        // ✅ Correct genealogical approach: link new sibling to the SAME PARENTS
        // as forPerson. This automatically inherits the full ancestor chain
        // (grandparents, great-grandparents, other siblings via shared parent node).
        await Promise.all(
          parentRels.map((r) =>
            relationshipsService.createRelationship(r.person1.id, newPersonId, r.type),
          ),
        )
      } else {
        // No parents known → fall back to a direct sibling relationship
        await relationshipsService.createRelationship(forPersonId, newPersonId, 'sibling')
      }
      break
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface QuickAddRelativeModalProps {
  /** The person we are adding a relative to */
  forPerson: Person
  role: RelativeRole
  /**
   * forPerson's existing parent relationships (passed from the tree which already
   * has them loaded). Used so sibling additions automatically inherit the full
   * ancestor chain without an extra API call.
   */
  parentRels?: Relationship[]
  onClose: () => void
  /** Called after save (just close + refresh) */
  onSaved: (newPerson: Person) => void
  /** Called when user clicks "Save & Edit Details" — caller opens full form */
  onSavedAndEdit: (newPerson: Person) => void
}

const GENDERS: { value: Gender; label: string; color: string }[] = [
  { value: 'male',    label: 'Male',    color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'female',  label: 'Female',  color: 'border-pink-400 bg-pink-50 text-pink-700' },
  { value: 'other',   label: 'Other',   color: 'border-purple-400 bg-purple-50 text-purple-700' },
  { value: 'unknown', label: 'Unknown', color: 'border-gray-300 bg-gray-50 text-gray-500' },
]

export function QuickAddRelativeModal({
  forPerson,
  role,
  parentRels = [],
  onClose,
  onSaved,
  onSavedAndEdit,
}: QuickAddRelativeModalProps) {
  const queryClient = useQueryClient()
  const meta = ROLE_META[role]

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState(
    role === 'son' || role === 'daughter' ? forPerson.lastName : '',
  )
  const [gender, setGender] = useState<Gender>(meta.defaultGender)
  const [birthYear, setBirthYear] = useState('')
  const [isLiving, setIsLiving] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const firstNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstNameRef.current?.focus()
  }, [])

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const birthDate = birthYear.trim() ? `${birthYear.trim()}-01-01` : undefined
      const newPerson = await personsService.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        isLiving,
        birthDate,
        birthDatePrecision: birthYear.trim() ? 'year' : 'unknown',
      })
      await createRelativeLink(forPerson.id, newPerson.id, role, parentRels)
      return newPerson
    },
    onSuccess: (newPerson) => {
      // Invalidate all tree-related caches so both the global tree
      // and branch-scoped trees (useBranchTreeData) pick up the new person
      void queryClient.invalidateQueries({ queryKey: ['persons'],        refetchType: 'active' })
      void queryClient.invalidateQueries({ queryKey: ['relationships'],  refetchType: 'active' })
      void queryClient.invalidateQueries({ queryKey: ['marriages'],      refetchType: 'active' })
      // 'branch-persons' partial key invalidates ALL ['branch-persons', branchId]
      // queries so useBranchTreeData re-fetches and includes the new person in
      // combinedIds (otherwise the branch tree filters the person out).
      void queryClient.invalidateQueries({ queryKey: ['branch-persons'], refetchType: 'active' })
      // Also refresh branch detail stats (memberCount)
      void queryClient.invalidateQueries({ queryKey: ['branch'],         refetchType: 'active' })
      void queryClient.invalidateQueries({ queryKey: ['branches'],       refetchType: 'active' })
      onSaved(newPerson)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? 'Failed to save. Please try again.'
      setError(msg)
    },
  })

  const validate = () => {
    if (!firstName.trim()) { setError('First name is required.'); return false }
    if (!lastName.trim())  { setError('Last name is required.');  return false }
    if (birthYear && !/^\d{4}$/.test(birthYear.trim())) {
      setError('Birth year must be a 4-digit year (e.g. 1980).')
      return false
    }
    setError(null)
    return true
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutate()
  }

  const handleSaveAndEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutate(undefined, {
      onSuccess: (newPerson) => {
        void queryClient.invalidateQueries({ queryKey: ['persons'],        refetchType: 'active' })
        void queryClient.invalidateQueries({ queryKey: ['relationships'],  refetchType: 'active' })
        void queryClient.invalidateQueries({ queryKey: ['marriages'],      refetchType: 'active' })
        void queryClient.invalidateQueries({ queryKey: ['branch-persons'], refetchType: 'active' })
        void queryClient.invalidateQueries({ queryKey: ['branch'],         refetchType: 'active' })
        void queryClient.invalidateQueries({ queryKey: ['branches'],       refetchType: 'active' })
        onSavedAndEdit(newPerson)
      },
    })
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Add {meta.label}
              </h2>
              <p className="text-xs text-gray-400">
                of {forPerson.firstName} {forPerson.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">

          {/* Gender */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Gender
            </label>
            <div className="flex gap-2 flex-wrap">
              {GENDERS.map ((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    gender === g.value
                      ? g.color + ' border-2'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                First name <span className="text-red-400">*</span>
              </label>
              <input
                ref={firstNameRef}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Ahmed"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Last name <span className="text-red-400">*</span>
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Rahman"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Birth year + living */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Birth year <span className="text-gray-300">(optional)</span>
              </label>
              <input
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="e.g. 1965"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
              />
            </div>
            <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isLiving}
                onChange={(e) => setIsLiving(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm text-gray-600">Living</span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <div className="flex-1" />
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveAndEdit}
              className="px-4 py-2 rounded-lg border border-amber-300 text-sm text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              Save & Edit Details
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}






