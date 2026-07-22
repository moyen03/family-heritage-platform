import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Mail, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { invitationsService } from '@/services/invitations.service'

interface InviteModalProps {
  branchId: string
  branchName: string
  onClose: () => void
}

export function InviteModal({ branchId, branchName, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole]   = useState<'viewer' | 'member'>('viewer')
  const [copied, setCopied] = useState(false)

  const mutation = useMutation({
    mutationFn: () => invitationsService.sendInvite(branchId, email.trim(), role),
  })

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Invite to {branchName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Send an invitation link by email</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!mutation.isSuccess ? (
          <div className="px-6 py-5 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="family.member@example.com" autoFocus
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'viewer', label: '👁 Viewer', desc: 'Read-only access' },
                  { value: 'member', label: '✏️ Member', desc: 'Can propose edits' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      role === opt.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {(mutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to send invitation.'}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={!email.trim() || mutation.isPending}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {mutation.isPending ? 'Sending…' : 'Send Invitation'}
              </button>
            </div>
          </div>
        ) : (
          /* Success state */
          <div className="px-6 py-5">
            <div className="text-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900">Invitation Sent!</h3>
              <p className="text-sm text-gray-500 mt-1">
                {mutation.data?.message}
              </p>
            </div>

            {/* Show accept link for manual sharing */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Share this link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 break-all text-gray-600">
                  {mutation.data?.acceptUrl}
                </code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(mutation.data!.acceptUrl)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={mutation.data?.acceptUrl} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Link
                </a>
              </div>
            </div>

            <button onClick={onClose}
              className="mt-4 w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

