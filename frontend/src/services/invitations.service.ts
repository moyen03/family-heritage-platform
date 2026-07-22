import api from './api'

export interface InvitationDetails {
  token: string
  email: string
  branchName: string
  role: string
  invitedBy: string
  expiresAt: string
}

export interface BranchInvitation {
  id: string
  email: string
  role: string
  status: string
  invitedBy: string
  expiresAt: string
  acceptedAt: string | null
}

export const invitationsService = {
  async sendInvite(branchId: string, email: string, role: 'viewer' | 'member') {
    const { data } = await api.post(`/branches/${branchId}/invite`, { email, role })
    return data as { message: string; acceptUrl: string; token: string; email: string; expiresAt: string }
  },

  async getByToken(token: string) {
    const { data } = await api.get(`/invitations/${token}`)
    return data as InvitationDetails
  },

  async accept(token: string, payload: { firstName: string; lastName: string; password: string }) {
    const { data } = await api.post(`/invitations/${token}/accept`, payload)
    return data as { message: string; email: string; branchName: string; role: string }
  },

  async listForBranch(branchId: string) {
    const { data } = await api.get(`/branches/${branchId}/invitations`)
    return data as { invitations: BranchInvitation[]; count: number }
  },
}

