import type { Person } from './person'

export type RelationshipType =
  | 'parent' | 'child' | 'sibling' | 'half_sibling'
  | 'step_parent' | 'step_child'
  | 'adopted_parent' | 'adopted_child'
  | 'guardian' | 'foster_parent'

export interface Relationship {
  id: string
  person1: Pick<Person, 'id' | 'fullName' | 'gender'>
  person2: Pick<Person, 'id' | 'fullName' | 'gender'>
  type: RelationshipType
  notes: string | null
  createdAtIso: string
}

export interface Marriage {
  id: string
  spouse1: Pick<Person, 'id' | 'fullName' | 'gender'>
  spouse2: Pick<Person, 'id' | 'fullName' | 'gender'>
  marriageDate: string | null
  marriageDatePrecision: string
  marriagePlace: string | null
  divorceDate: string | null
  divorceDatePrecision: string
  isDivorced: boolean
  notes: string | null
  createdAtIso: string
}

export interface PersonTreeNode {
  person: Person
  generation: number
  relationType: string
}

export interface RelationshipPathStep {
  person: Person
  via: string | null
}

export interface PathFinderResult {
  found: boolean
  from: { id: string; fullName: string }
  to: { id: string; fullName: string }
  distance: number | null
  path: RelationshipPathStep[]
}

