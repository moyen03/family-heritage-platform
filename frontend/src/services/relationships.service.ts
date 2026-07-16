import api from './api'
import type { Relationship, Marriage } from '@/types/relationship'
import type { ApiCollection } from '@/types/api'

export const relationshipsService = {
  async getAll(): Promise<Relationship[]> {
    const { data } = await api.get<ApiCollection<Relationship>>('/relationships')
    return data['member'] ?? data['hydra:member'] ?? []
  },

  async getAllMarriages(): Promise<Marriage[]> {
    const { data } = await api.get<ApiCollection<Marriage>>('/marriages')
    return data['member'] ?? data['hydra:member'] ?? []
  },
}

