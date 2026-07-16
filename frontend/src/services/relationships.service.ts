import api from './api'
import type { Relationship } from '@/types/relationship'
import type { ApiCollection } from '@/types/api'

export const relationshipsService = {
  async getAll(): Promise<Relationship[]> {
    const { data } = await api.get<ApiCollection<Relationship>>('/relationships')
    return data['hydra:member']
  },
}

