import api, { setAccessToken, setRefreshToken } from './api'
import type { LoginCredentials, LoginResponse, AuthUser } from '@/types/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials)
    setAccessToken(data.token)
    setRefreshToken(data.refresh_token)
    return data
  },

  logout() {
    setAccessToken(null)
    setRefreshToken(null)
  },

  /**
   * Decode the JWT payload to extract user info (email, roles).
   * No signature verification — trust the server for that.
   */
  decodeToken(token: string): AuthUser | null {
    try {
      const payload = token.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      return {
        email: decoded.username ?? decoded.email ?? '',
        roles: decoded.roles ?? [],
      }
    } catch {
      return null
    }
  },
}

