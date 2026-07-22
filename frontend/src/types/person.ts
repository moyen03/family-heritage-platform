export type Gender = 'male' | 'female' | 'other' | 'unknown'
export type Visibility = 'public' | 'family' | 'branch' | 'private'
export type DatePrecision = 'exact' | 'year' | 'approximate' | 'unknown'
export type NameType = 'birth' | 'nickname' | 'title' | 'alias' | 'married'
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const EDUCATION_LEVELS = [
  'None / Not recorded',
  'Primary (Class 1–5)',
  'Secondary / JSC',
  'SSC / O-Level',
  'HSC / A-Level',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD / Doctorate',
  'Other',
] as const
export type EducationLevel = typeof EDUCATION_LEVELS[number]

export interface PersonName {
  id: string
  nameType: NameType
  name: string
  fromDate: string | null
  toDate: string | null
  notes: string | null
}

export interface PersonCreatedBy {
  id: string
  fullName: string
}

export interface PersonBranchItem {
  branch: { id: string; name: string }
  isPrimary: boolean
}

export interface Person {
  id: string
  firstName: string
  middleName: string | null
  lastName: string
  maidenName?: string | null
  nickname?: string | null
  fullName: string
  gender: Gender
  birthDate: string | null
  birthDatePrecision: DatePrecision
  birthPlace: string | null
  deathDate: string | null
  deathDatePrecision: DatePrecision
  deathPlace: string | null
  isLiving: boolean
  phone: string | null
  nidNumber: string | null
  profession: string | null
  bloodGroup: BloodGroup | null
  highestEducation: string | null
  biography: string | null
  visibility: Visibility
  profilePictureUrl: string | null
  personBranches: PersonBranchItem[]
  createdBy: PersonCreatedBy
  personNames: PersonName[]
  createdAtIso: string
  updatedAtIso: string
}

export interface PersonListItem {
  id: string
  firstName: string
  lastName: string
  fullName: string
  gender: Gender
  birthDate: string | null
  isLiving: boolean
}

export interface CreatePersonDto {
  firstName: string
  middleName?: string
  lastName: string
  maidenName?: string
  nickname?: string
  gender: Gender
  birthDate?: string
  birthDatePrecision?: DatePrecision
  birthPlace?: string
  deathDate?: string
  deathDatePrecision?: DatePrecision
  deathPlace?: string
  isLiving?: boolean
  phone?: string
  nidNumber?: string
  profession?: string
  bloodGroup?: BloodGroup
  highestEducation?: string
  biography?: string
  visibility?: Visibility
}

