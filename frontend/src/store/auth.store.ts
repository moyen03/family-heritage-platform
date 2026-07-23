import { create } from 'zustand'
import { authService } from '@/services/auth.service'
import { getAccessToken, getRefreshToken, setAccessToken } from '@/services/api'
import type { AuthUser, LoginCredentials } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isInitializing: boolean
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
  isInitializing: true,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(credentials)
      const user = authService.decodeToken(response.token)
      set({ token: response.token, user, isLoading: false, isInitializing: false })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid email or password.'
      set({ isLoading: false, error: message })
    }
  },

  logout: () => {
    authService.logout()
    set({ user: null, token: null, isInitializing: false })
  },

  /**
   * On page load: restore access token from localStorage so API calls work immediately.
   */
  initFromStorage: () => {
    const token = getAccessToken()
    const refreshToken = getRefreshToken()

    if (!token && !refreshToken) {
      set({ isInitializing: false })
      return
    }

    if (token) {
      // Check the token is not expired before restoring
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const isExpired = payload.exp && payload.exp * 1000 < Date.now()
        if (!isExpired) {
          setAccessToken(token)
          const user = authService.decodeToken(token)
          if (user) {
            set({ user, token, isInitializing: false })
            return
          }
        }
      } catch {
        // invalid token — fall through to refresh
      }
    }

    // No valid access token — mark as initialised and let the 401→refresh
    // interceptor handle it on the first API call (or redirect to login).
    if (refreshToken) {
      // Keep the refresh token so the interceptor can use it
      set({ user: { email: '', roles: [] }, isInitializing: false })
    } else {
      setAccessToken(null)
      set({ user: null, isInitializing: false })
    }
  },

  clearError: () => set({ error: null }),
}))

// Selectors
export const selectIsAuthenticated = (s: AuthState) => s.user !== null
export const selectIsAdmin = (s: AuthState) =>
  s.user?.roles.some((r) => ['ROLE_SUPER_ADMIN', 'ROLE_BRANCH_ADMIN'].includes(r)) ?? false
export const selectIsSuperAdmin = (s: AuthState) =>
  s.user?.roles.includes('ROLE_SUPER_ADMIN') ?? false
/** True if the user can create/edit records (Member, BranchAdmin, SuperAdmin). False for viewers. */
export const selectCanWrite = (s: AuthState) =>
  s.user?.roles.some((r) => ['ROLE_SUPER_ADMIN', 'ROLE_BRANCH_ADMIN', 'ROLE_MEMBER'].includes(r)) ?? false
/** True only for pure read-only viewers (no write permissions at all). */
export const selectIsViewer = (s: AuthState) =>
  !selectCanWrite(s) && selectIsAuthenticated(s)

