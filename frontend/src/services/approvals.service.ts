import api from './api'

export interface ApprovalRequest {
  id: string
  entityType: string
  entityId: string
  status: string
  changesJson: Record<string, unknown>
  notes: string | null
  requestedBy: { id: string; fullName: string; email: string }
  reviewedBy: { id: string; fullName: string } | null
  reviewedAt: string | null
  createdAtIso: string
  updatedAtIso: string
}

export const approvalsService = {
  async getAll() {
    const { data } = await api.get('/approval-requests')
    return (data['member'] ?? data['hydra:member'] ?? []) as ApprovalRequest[]
  },

  async approve(id: string, notes?: string) {
    const { data } = await api.patch(
      `/approval-requests/${id}`,
      { status: 'approved', notes: notes ?? null },
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    )
    return data as ApprovalRequest
  },

  async reject(id: string, notes?: string) {
    const { data } = await api.patch(
      `/approval-requests/${id}`,
      { status: 'rejected', notes: notes ?? null },
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    )
    return data as ApprovalRequest
  },

  async submit(entityType: string, entityId: string, changesJson: Record<string, unknown>, notes?: string) {
    const { data } = await api.post(
      '/approval-requests',
      { entityType, entityId, changesJson, notes: notes ?? null },
      { headers: { 'Content-Type': 'application/ld+json' } }
    )
    return data as ApprovalRequest
  },
}

