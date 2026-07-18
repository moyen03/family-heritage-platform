import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { FamilyTreePage } from '@/pages/FamilyTreePage'
import { PersonsPage } from '@/pages/PersonsPage'
import { PersonDetailPage } from '@/pages/PersonDetailPage'
import { RelationshipsPage } from '@/pages/RelationshipsPage'
import { MarriagesPage } from '@/pages/MarriagesPage'
import MediaPage from '@/pages/MediaPage'
import MapPage from '@/pages/MapPage'
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
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="tree" element={<FamilyTreePage />} />
                <Route path="persons" element={<PersonsPage />} />
                <Route path="persons/:id" element={<PersonDetailPage />} />
                <Route path="relationships" element={<RelationshipsPage />} />
                <Route path="marriages" element={<MarriagesPage />} />
                <Route path="media" element={<MediaPage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

