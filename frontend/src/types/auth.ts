export interface AuthUser {
  email: string
  roles: string[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refresh_token: string
}

export interface RefreshResponse {
  token: string
  refresh_token: string
}

