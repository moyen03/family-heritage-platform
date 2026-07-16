import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TreePine } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/tree'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    await login({ email, password })
    // Zustand will update user; navigate if auth succeeded
    if (useAuthStore.getState().user) {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-50 to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-heritage-500 mb-4 shadow-lg">
            <TreePine className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Family Heritage</h1>
          <p className="text-gray-500 mt-1">Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Family Heritage Platform — Private Access Only
        </p>
      </div>
    </div>
  )
}

