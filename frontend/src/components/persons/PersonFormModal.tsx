import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { X, User, Calendar, MapPin, BookOpen, Eye, Save, Loader2, AlertCircle, Phone, Camera, Trash2, Briefcase, GraduationCap, CreditCard } from 'lucide-react'
import { personsService } from '@/services/persons.service'
import type { Person, CreatePersonDto, Gender, DatePrecision, Visibility, BloodGroup } from '@/types/person'
import { BLOOD_GROUPS, EDUCATION_LEVELS } from '@/types/person'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PersonFormModalProps {
  /** If provided, form is in EDIT mode; otherwise ADD mode */
  person?: Person
  onClose: () => void
  /** Called with the saved person (for tree / list refresh without full nav) */
  onSaved?: (person: Person) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GENDERS: { value: Gender; label: string; color: string }[] = [
  { value: 'male',    label: 'Male',    color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'female',  label: 'Female',  color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { value: 'other',   label: 'Other',   color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-600 border-gray-300' },
]

const DATE_PRECISIONS: { value: DatePrecision; label: string }[] = [
  { value: 'exact',       label: 'Exact date' },
  { value: 'year',        label: 'Year only' },
  { value: 'approximate', label: 'Approximate' },
  { value: 'unknown',     label: 'Unknown' },
]

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string }[] = [
  { value: 'public',  label: '🌍 Public',  desc: 'Visible to everyone' },
  { value: 'family',  label: '👨‍👩‍👧 Family',  desc: 'Logged-in members only' },
  { value: 'branch',  label: '🌿 Branch',  desc: 'Same branch members only' },
  { value: 'private', label: '🔒 Private', desc: 'Only you' },
]

/** Extract the year part from a YYYY-MM-DD string */
function dateToYear(date: string): string {
  return date ? date.substring(0, 4) : ''
}


const empty: CreatePersonDto = {
  firstName: '',
  lastName: '',
  gender: 'unknown',
  isLiving: true,
  phone: '',
  nidNumber: '',
  profession: '',
  bloodGroup: undefined,
  highestEducation: '',
  birthDate: '',
  birthDatePrecision: 'unknown',
  birthPlace: '',
  deathDate: '',
  deathDatePrecision: 'unknown',
  deathPlace: '',
  biography: '',
  visibility: 'family',
}

function dtoFromPerson(p: Person): CreatePersonDto {
  return {
    firstName:          p.firstName,
    lastName:           p.lastName,
    gender:             p.gender,
    isLiving:           p.isLiving,
    phone:              p.phone ?? '',
    nidNumber:          p.nidNumber ?? '',
    profession:         p.profession ?? '',
    bloodGroup:         p.bloodGroup ?? undefined,
    highestEducation:   p.highestEducation ?? '',
    birthDate:          p.birthDate ?? '',
    birthDatePrecision: p.birthDatePrecision,
    birthPlace:         p.birthPlace ?? '',
    deathDate:          p.deathDate ?? '',
    deathDatePrecision: p.deathDatePrecision,
    deathPlace:         p.deathPlace ?? '',
    biography:          p.biography ?? '',
    visibility:         p.visibility,
  }
}

function cleanDto(dto: CreatePersonDto): CreatePersonDto {
  const clean: CreatePersonDto = {
    firstName: dto.firstName.trim(),
    lastName:  dto.lastName.trim(),
    gender:    dto.gender,
    isLiving:  dto.isLiving,
    birthDatePrecision: dto.birthDatePrecision,
    deathDatePrecision: dto.deathDatePrecision,
    visibility: dto.visibility,
  }
  if (dto.phone?.trim())             clean.phone             = dto.phone.trim()
  if (dto.nidNumber?.trim())         clean.nidNumber         = dto.nidNumber.trim()
  if (dto.profession?.trim())        clean.profession        = dto.profession.trim()
  if (dto.bloodGroup)                clean.bloodGroup        = dto.bloodGroup
  if (dto.highestEducation?.trim())  clean.highestEducation  = dto.highestEducation.trim()
  if (dto.birthDate?.trim())  clean.birthDate  = dto.birthDate.trim()
  if (dto.birthPlace?.trim()) clean.birthPlace = dto.birthPlace.trim()
  if (!dto.isLiving) {
    if (dto.deathDate?.trim())  clean.deathDate  = dto.deathDate.trim()
    if (dto.deathPlace?.trim()) clean.deathPlace = dto.deathPlace.trim()
  }
  if (dto.biography?.trim()) clean.biography = dto.biography.trim()
  return clean
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function FormSection({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors'
const errorCls = 'border-red-300 focus:ring-red-400'

// ── Smart Date Input ──────────────────────────────────────────────────────────
// Shows different inputs depending on the selected precision.

function SmartDateInput({
  precision,
  value,
  onChange,
  label,
}: {
  precision: DatePrecision
  value: string
  onChange: (v: string) => void
  label: string
}) {
  // Local state for year text so partial typing (1, 19, 194) doesn't reset the field
  const [yearText, setYearText] = useState(() => (value ? dateToYear(value) : ''))

  // Sync yearText when the stored value changes externally (e.g. form reset)
  useEffect(() => {
    setYearText(value ? dateToYear(value) : '')
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleYearChange = useCallback((raw: string) => {
    // Strip non-digits, cap at 4 chars
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    setYearText(digits)
    if (digits.length === 4) {
      onChange(`${digits}-01-01`)
    } else {
      // Don't persist partial input to parent — keep previous stored value
    }
  }, [onChange])

  if (precision === 'unknown') {
    return (
      <Field label={label} hint="Set precision above to enter a date">
        <input type="text" disabled placeholder="— unknown —" className={`${inputCls} bg-gray-50 text-gray-400`} />
      </Field>
    )
  }

  if (precision === 'year') {
    return (
      <Field label={label} hint="Type a 4-digit year (e.g. 1945)">
        <input
          type="text"
          inputMode="numeric"
          value={yearText}
          onChange={e => handleYearChange(e.target.value)}
          placeholder="e.g. 1945"
          maxLength={4}
          className={inputCls}
        />
      </Field>
    )
  }

  // exact or approximate — date picker + manual text fallback
  return (
    <Field label={label} hint={precision === 'approximate' ? 'Best estimate — pick or type YYYY-MM-DD' : undefined}>
      <div className="space-y-1">
        <input
          type="date"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className={inputCls}
        />
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Or type manually: YYYY-MM-DD"
          className={`${inputCls} text-xs text-gray-500`}
        />
      </div>
    </Field>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PersonFormModal({ person, onClose, onSaved }: PersonFormModalProps) {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const isEdit      = !!person
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm]     = useState<CreatePersonDto>(isEdit ? dtoFromPerson(person) : empty)
  const [errors, setErrors] = useState<Partial<Record<keyof CreatePersonDto, string>>>({})
  const [photoFile, setPhotoFile]       = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    isEdit && person.profilePictureUrl ? person.profilePictureUrl : null
  )
  const [photoRemoved, setPhotoRemoved] = useState(false)

  // Keep form in sync if person prop changes
  useEffect(() => {
    if (person) {
      setForm(dtoFromPerson(person))
      setPhotoPreview(person.profilePictureUrl ?? null)
    } else {
      setForm(empty)
      setPhotoPreview(null)
    }
    setErrors({})
    setPhotoFile(null)
    setPhotoRemoved(false)
  }, [person?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof CreatePersonDto>(key: K, value: CreatePersonDto[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim())  e.lastName  = 'Last name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoRemoved(false)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoRemoved(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dto = cleanDto(form)
      const saved = isEdit
        ? await personsService.update(person!.id, dto)
        : await personsService.create(dto)

      // Handle profile picture
      if (photoFile) {
        await personsService.uploadPhoto(saved.id, photoFile)
      } else if (photoRemoved && isEdit && person!.profilePictureUrl) {
        await personsService.deletePhoto(saved.id)
      }

      return saved
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['person', saved.id] })
      if (onSaved) {
        onSaved(saved)
      } else if (!isEdit) {
        navigate(`/persons/${saved.id}`)
      }
      onClose()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    saveMutation.mutate()
  }

  const title = isEdit
    ? `Edit — ${person!.firstName} ${person!.lastName}`
    : 'Add New Person'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <User className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="font-bold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Profile Photo */}
          <FormSection icon={Camera} title="Profile Photo">
            <div className="flex items-center gap-4">
              {/* Avatar preview */}
              <div className="relative flex-shrink-0">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  {photoPreview ? (
                    <img
                      src={photoPreview.startsWith('data:') ? photoPreview : `http://localhost:8000${photoPreview}`}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Upload button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                <p className="mt-1 text-xs text-gray-400">JPEG, PNG or WebP · max 5 MB</p>
              </div>
            </div>
          </FormSection>

          {/* Basic info */}
          <FormSection icon={User} title="Basic Information">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" required>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => set('firstName', e.target.value)}
                  placeholder="e.g. Md Moyen"
                  className={`${inputCls} ${errors.firstName ? errorCls : ''}`}
                  autoFocus
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </Field>
              <Field label="Last Name" required>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => set('lastName', e.target.value)}
                  placeholder="e.g. Uddin"
                  className={`${inputCls} ${errors.lastName ? errorCls : ''}`}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
              </Field>
            </div>

            {/* Phone */}
            <Field label="Phone / Mobile">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone ?? ''}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="e.g. +880 1700-000000"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            {/* Gender */}
            <Field label="Gender">
              <div className="flex gap-2 flex-wrap">
                {GENDERS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => set('gender', g.value)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                      form.gender === g.value
                        ? g.color + ' border-current shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Living status */}
            <Field label="Status">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set('isLiving', true)}
                  className={`flex-1 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                    form.isLiving
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  ✓ Living
                </button>
                <button
                  type="button"
                  onClick={() => set('isLiving', false)}
                  className={`flex-1 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                    !form.isLiving
                      ? 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  † Deceased
                </button>
              </div>
            </Field>
          </FormSection>

          {/* Birth */}
          <FormSection icon={Calendar} title="Birth">
            <Field label="Date Precision">
              <select
                value={form.birthDatePrecision ?? 'unknown'}
                onChange={e => {
                  const prec = e.target.value as DatePrecision
                  set('birthDatePrecision', prec)
                  // Clear date when switching to unknown
                  if (prec === 'unknown') set('birthDate', '')
                }}
                className={inputCls}
              >
                {DATE_PRECISIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>

            <SmartDateInput
              precision={form.birthDatePrecision ?? 'unknown'}
              value={form.birthDate ?? ''}
              onChange={v => set('birthDate', v)}
              label="Birth Date"
            />

            <Field label="Birth Place">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={form.birthPlace ?? ''}
                  onChange={e => set('birthPlace', e.target.value)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>
          </FormSection>

          {/* Death — only if deceased */}
          {!form.isLiving && (
            <FormSection icon={Calendar} title="Death">
              <Field label="Date Precision">
                <select
                  value={form.deathDatePrecision ?? 'unknown'}
                  onChange={e => {
                    const prec = e.target.value as DatePrecision
                    set('deathDatePrecision', prec)
                    if (prec === 'unknown') set('deathDate', '')
                  }}
                  className={inputCls}
                >
                  {DATE_PRECISIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </Field>

              <SmartDateInput
                precision={form.deathDatePrecision ?? 'unknown'}
                value={form.deathDate ?? ''}
                onChange={v => set('deathDate', v)}
                label="Death Date"
              />

              <Field label="Death Place">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.deathPlace ?? ''}
                    onChange={e => set('deathPlace', e.target.value)}
                    placeholder="e.g. Dhaka, Bangladesh"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </FormSection>
          )}

          {/* Biography */}
          <FormSection icon={BookOpen} title="Biography">
            <Field label="Biography / Notes">
              <textarea
                value={form.biography ?? ''}
                onChange={e => set('biography', e.target.value)}
                rows={3}
                placeholder="Short biography, notes, or context about this person…"
                className={`${inputCls} resize-none`}
              />
            </Field>
          </FormSection>

          {/* Personal Details */}
          <FormSection icon={CreditCard} title="Personal Details">
            <Field label="NID / National ID Number">
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={form.nidNumber ?? ''}
                  onChange={e => set('nidNumber', e.target.value)}
                  placeholder="e.g. 1234567890123"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            <Field label="Blood Group">
              <div className="flex flex-wrap gap-2">
                {BLOOD_GROUPS.map(bg => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => set('bloodGroup', form.bloodGroup === bg ? undefined : bg as BloodGroup)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                      form.bloodGroup === bg
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Profession / Occupation">
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={form.profession ?? ''}
                  onChange={e => set('profession', e.target.value)}
                  placeholder="e.g. Farmer, Teacher, Engineer…"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>

            <Field label="Highest Education">
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={form.highestEducation ?? ''}
                  onChange={e => set('highestEducation', e.target.value || undefined)}
                  className={`${inputCls} pl-9`}
                >
                  <option value="">— Select level —</option>
                  {EDUCATION_LEVELS.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </Field>
          </FormSection>

          {/* Visibility */}
          <FormSection icon={Eye} title="Visibility">
            <div className="grid grid-cols-2 gap-2">
              {VISIBILITY_OPTIONS.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => set('visibility', v.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.visibility === v.value
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">{v.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{v.desc}</p>
                </button>
              ))}
            </div>
          </FormSection>

          {/* API error */}
          {saveMutation.isError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Failed to save. Please check all fields and try again.
              </p>
            </div>
          )}
        </form>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Save className="h-4 w-4" /> {isEdit ? 'Save Changes' : 'Add Person'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

