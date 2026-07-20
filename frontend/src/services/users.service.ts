import api from './api'

export interface UserSummary {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
}

export const usersService = {
  async getAll(search = ''): Promise<UserSummary[]> {
    const params = search ? { search } : {}
    const { data } = await api.get<{ members: UserSummary[]; count: number }>('/users', { params })
    return data.members ?? []
  },
}

