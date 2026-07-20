import api from './api'
import type { ApiCollection } from '@/types/api'

export interface Branch {
  id: string
  name: string
  description: string | null
  isShared: boolean
  memberCount: number
}

export interface BranchMember {
  id: string
  fullName: string
  firstName: string
  lastName: string
  gender: string
  isLiving: boolean
  birthDate: string | null
  isPrimary: boolean
}

export interface BranchUserMember {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  role: 'viewer' | 'member'
  joinedAt: string
  invitedBy: string
}

export interface CreateBranchDto {
  name: string
  description?: string
  isShared?: boolean
}

export const branchesService = {
  async getAll(): Promise<Branch[]> {
    const { data } = await api.get<ApiCollection<Branch>>('/branches')
    return data['member'] ?? data['hydra:member'] ?? []
  },

  async getById(id: string): Promise<Branch> {
    const { data } = await api.get<Branch>(`/branches/${id}`)
    return data
  },

  async create(dto: CreateBranchDto): Promise<Branch> {
    const { data } = await api.post<Branch>('/branches', dto)
    return data
  },

  async update(id: string, dto: Partial<CreateBranchDto>): Promise<Branch> {
    const { data } = await api.patch<Branch>(`/branches/${id}`, dto, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    })
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/branches/${id}`)
  },

  // ── Person membership ───────────────────────────────────────────────────────

  async getPersons(branchId: string): Promise<{ members: BranchMember[]; count: number }> {
    const { data } = await api.get(`/branches/${branchId}/persons`)
    return data
  },

  async assignPerson(branchId: string, personId: string, isPrimary = false): Promise<void> {
    await api.post(`/branches/${branchId}/persons`, { personId, isPrimary })
  },

  async removePerson(branchId: string, personId: string): Promise<void> {
    await api.delete(`/branches/${branchId}/persons/${personId}`)
  },

  // ── User membership ─────────────────────────────────────────────────────────

  async getUsers(branchId: string): Promise<{ members: BranchUserMember[]; count: number }> {
    const { data } = await api.get(`/branches/${branchId}/users`)
    return data
  },

  async addUser(branchId: string, userId: string, role: 'viewer' | 'member' = 'member'): Promise<void> {
    await api.post(`/branches/${branchId}/users`, { userId, role })
  },

  async removeUser(branchId: string, userId: string): Promise<void> {
    await api.delete(`/branches/${branchId}/users/${userId}`)
  },

  async updateUserRole(branchId: string, userId: string, role: 'viewer' | 'member'): Promise<void> {
    await api.patch(`/branches/${branchId}/users/${userId}`, { role })
  },
}



