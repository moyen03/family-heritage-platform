import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, User, FileEdit, ChevronDown, ChevronUp } from 'lucide-react'
import { approvalsService, type ApprovalRequest } from '@/services/approvals.service'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {status === 'pending'  && <Clock className="h-3 w-3" />}
      {status === 'approved' && <CheckCircle className="h-3 w-3" />}
      {status === 'rejected' && <XCircle className="h-3 w-3" />}
      {status}
    </span>
  )
}

function ApprovalCard({ req }: { req: ApprovalRequest }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes]       = useState('')

  const approveMut = useMutation({
    mutationFn: () => approvalsService.approve(req.id, notes || undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  })
  const rejectMut = useMutation({
    mutationFn: () => approvalsService.reject(req.id, notes || undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  })

  const isPending = req.status === 'pending'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={req.status} />
            <Badge variant="default">{req.entityType}</Badge>
            <span className="text-xs text-gray-400">
              {new Date(req.createdAtIso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-medium">{req.requestedBy.fullName}</span>
            <span className="text-gray-400">wants to edit</span>
            <Link to={`/persons/${req.entityId}`} className="text-indigo-600 hover:text-indigo-800 font-medium truncate">
              {req.entityType} {req.entityId.substring(0, 8)}…
            </Link>
          </div>
          {req.notes && (
            <p className="text-sm text-gray-500 mt-1 italic">"{req.notes}"</p>
          )}
          {req.reviewedBy && (
            <p className="text-xs text-gray-400 mt-1">
              Reviewed by {req.reviewedBy.fullName} · {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString('en-GB') : ''}
            </p>
          )}
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 flex-shrink-0"
        >
          <FileEdit className="h-3.5 w-3.5" />
          {Object.keys(req.changesJson).length} field{Object.keys(req.changesJson).length !== 1 ? 's' : ''}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Proposed changes */}
      {expanded && (
        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Proposed Changes</p>
          <div className="space-y-1">
            {Object.entries(req.changesJson).map(([field, value]) => (
              <div key={field} className="flex gap-2 text-sm">
                <span className="text-gray-500 font-mono w-32 flex-shrink-0">{field}</span>
                <span className="text-gray-800">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="mt-4 space-y-2">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add a note (optional)…"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => approveMut.mutate()}
              disabled={approveMut.isPending || rejectMut.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              {approveMut.isPending ? 'Approving…' : 'Approve'}
            </button>
            <button
              onClick={() => rejectMut.mutate()}
              disabled={approveMut.isPending || rejectMut.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              {rejectMut.isPending ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ApprovalsPage() {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => approvalsService.getAll(),
    refetchInterval: 30_000,
  })

  const filtered = filter === 'pending'
    ? requests.filter(r => r.status === 'pending')
    : requests

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileEdit className="h-6 w-6 text-indigo-600" />
            Edit Approval Requests
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve member-submitted edits</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending {pendingCount > 0 && <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-xs">{pendingCount}</span>}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({requests.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === 'pending' ? 'No pending requests — all caught up!' : 'No approval requests yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => <ApprovalCard key={req.id} req={req} />)}
        </div>
      )}
    </div>
  )
}

