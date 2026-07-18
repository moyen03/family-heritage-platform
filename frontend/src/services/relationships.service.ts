import api from './api'
import type { Relationship, Marriage } from '@/types/relationship'
import type { ApiCollection } from '@/types/api'

const iri = (id: string) => `/api/persons/${id}`

export const relationshipsService = {
  async getAll(): Promise<Relationship[]> {
    const { data } = await api.get<ApiCollection<Relationship>>('/relationships')
    return data['member'] ?? data['hydra:member'] ?? []
  },

  async getAllMarriages(): Promise<Marriage[]> {
    const { data } = await api.get<ApiCollection<Marriage>>('/marriages')
    return data['member'] ?? data['hydra:member'] ?? []
  },

  async createRelationship(person1Id: string, person2Id: string, type: string): Promise<Relationship> {
    const { data } = await api.post<Relationship>('/relationships', {
      person1: iri(person1Id),
      person2: iri(person2Id),
      type,
    }, { headers: { 'Content-Type': 'application/ld+json' } })
    return data
  },

  async deleteRelationship(id: string): Promise<void> {
    await api.delete(`/relationships/${id}`)
  },

  async createMarriage(
    spouse1Id: string,
    spouse2Id: string,
    opts: { marriageDate?: string; marriagePlace?: string; isDivorced?: boolean } = {},
  ): Promise<Marriage> {
    const body: Record<string, unknown> = {
      spouse1: iri(spouse1Id),
      spouse2: iri(spouse2Id),
    }
    if (opts.marriageDate)  body.marriageDate  = opts.marriageDate
    if (opts.marriagePlace) body.marriagePlace = opts.marriagePlace
    if (opts.isDivorced !== undefined) body.isDivorced = opts.isDivorced
    const { data } = await api.post<Marriage>('/marriages', body, {
      headers: { 'Content-Type': 'application/ld+json' },
    })
    return data
  },

  async deleteMarriage(id: string): Promise<void> {
    await api.delete(`/marriages/${id}`)
  },

  async createPersonName(
    personId: string,
    name: string,
    nameType: string,
    notes?: string,
  ): Promise<{ id: string; name: string; nameType: string; notes: string | null }> {
    const { data } = await api.post(
      `/persons/${personId}/names`,
      { name, nameType, notes: notes ?? null },
      { headers: { 'Content-Type': 'application/ld+json' } },
    )
    return data as { id: string; name: string; nameType: string; notes: string | null }
  },

  async deletePersonName(id: string): Promise<void> {
    await api.delete(`/person-names/${id}`)
  },
}


