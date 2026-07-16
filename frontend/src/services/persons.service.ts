import api from './api'
import type { Person, CreatePersonDto } from '@/types/person'
import type { ApiCollection } from '@/types/api'
import type { Relationship, Marriage, PersonTreeNode, PathFinderResult } from '@/types/relationship'

export const personsService = {
  async getAll(page = 1): Promise<ApiCollection<Person>> {
    const { data } = await api.get<ApiCollection<Person>>('/persons', {
      params: { page },
    })
    return data
  },

  async getById(id: string): Promise<Person> {
    const { data } = await api.get<Person>(`/persons/${id}`)
    return data
  },

  async create(dto: CreatePersonDto): Promise<Person> {
    const { data } = await api.post<Person>('/persons', dto)
    return data
  },

  async update(id: string, dto: Partial<CreatePersonDto>): Promise<Person> {
    const { data } = await api.patch<Person>(`/persons/${id}`, dto)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/persons/${id}`)
  },

  async getRelationships(personId: string): Promise<Relationship[]> {
    const { data } = await api.get<ApiCollection<Relationship>>(
      `/persons/${personId}/relationships`
    )
    return data['hydra:member']
  },

  async getMarriages(personId: string): Promise<Marriage[]> {
    const { data } = await api.get<ApiCollection<Marriage>>(
      `/persons/${personId}/marriages`
    )
    return data['hydra:member']
  },

  async getAncestors(personId: string, depth = 10): Promise<{
    members: PersonTreeNode[]
    count: number
    depthReached: number
  }> {
    const { data } = await api.get(`/persons/${personId}/ancestors`, {
      params: { depth },
    })
    return data
  },

  async getDescendants(personId: string, depth = 10): Promise<{
    members: PersonTreeNode[]
    count: number
    depthReached: number
  }> {
    const { data } = await api.get(`/persons/${personId}/descendants`, {
      params: { depth },
    })
    return data
  },

  async findPath(fromId: string, toId: string): Promise<PathFinderResult> {
    const { data } = await api.get<PathFinderResult>(
      `/persons/${fromId}/path-to/${toId}`
    )
    return data
  },
}

