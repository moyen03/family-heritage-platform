import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, selectIsAuthenticated } from '@/store/auth.store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

