import { create } from 'zustand'
import { authService } from '@/services/auth.service'
import { getRefreshToken } from '@/services/api'
import type { AuthUser, LoginCredentials } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null

  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  initFromStorage: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(credentials)
      const user = authService.decodeToken(response.token)
      set({ token: response.token, user, isLoading: false })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid email or password.'
      set({ isLoading: false, error: message })
    }
  },

  logout: () => {
    authService.logout()
    set({ user: null, token: null })
  },

  /**
   * On page load: check if we have a refresh token and restore the session.
   * We don't re-validate with the server here — the first API call will
   * trigger the refresh interceptor if the access token is missing.
   */
  initFromStorage: () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return
    // Mark as authenticated with no access token yet;
    // the interceptor will refresh on first request.
    set({ user: { email: '', roles: [] } })
  },

  clearError: () => set({ error: null }),
}))

// Selectors
export const selectIsAuthenticated = (s: AuthState) => s.user !== null
export const selectIsAdmin = (s: AuthState) =>
  s.user?.roles.some((r) => ['ROLE_SUPER_ADMIN', 'ROLE_BRANCH_ADMIN'].includes(r)) ?? false

