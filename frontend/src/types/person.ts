export type Gender = 'male' | 'female' | 'other' | 'unknown'
export type Visibility = 'public' | 'family' | 'branch' | 'private'
export type DatePrecision = 'exact' | 'year' | 'approximate' | 'unknown'
export type NameType = 'birth' | 'nickname' | 'title' | 'alias' | 'married'

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

export interface Person {
  id: string
  firstName: string
  middleName: string | null
  lastName: string
  maidenName: string | null
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
  biography: string | null
  visibility: Visibility
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
  gender: Gender
  birthDate?: string
  birthDatePrecision?: DatePrecision
  birthPlace?: string
  deathDate?: string
  deathDatePrecision?: DatePrecision
  deathPlace?: string
  isLiving?: boolean
  phone?: string
  biography?: string
  visibility?: Visibility
}

