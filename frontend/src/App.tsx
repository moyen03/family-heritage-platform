import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { FamilyTreePage } from '@/pages/FamilyTreePage'
import { PersonsPage } from '@/pages/PersonsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useAuthStore } from '@/store/auth.store'

export default function App() {
  const initFromStorage = useAuthStore((s) => s.initFromStorage)

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route index element={<Navigate to="/tree" replace />} />
                <Route path="tree" element={<FamilyTreePage />} />
                <Route path="persons" element={<PersonsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

