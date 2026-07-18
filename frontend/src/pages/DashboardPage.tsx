import { useQuery } from '@tanstack/react-query'
import { Users, GitBranch, Heart, Image, TrendingUp, TreePine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { personsService } from '@/services/persons.service'
import { relationshipsService } from '@/services/relationships.service'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import api from '@/services/api'
import type { ApiCollection } from '@/types/api'

function StatCard({
  icon: Icon,
  label,
  value,
  to,
  color,
  isLoading,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  to: string
  color: string
  isLoading?: boolean
}) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {isLoading ? (
            <div className="h-9 w-16 mt-1 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Link>
  )
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: personsData, isLoading: loadingPersons } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personsService.getAll(),
  })

  const { data: relationshipsData, isLoading: loadingRel } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => relationshipsService.getAll(),
  })

  const { data: marriagesData, isLoading: loadingMarriages } = useQuery({
    queryKey: ['marriages'],
    queryFn: () => relationshipsService.getAllMarriages(),
  })

  const { data: mediaData, isLoading: loadingMedia } = useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      const res = await api.get<ApiCollection<{ id: string }>>('/media')
      return res.data
    },
  })

  const totalPersons      = personsData?.['totalItems']      ?? personsData?.['hydra:totalItems']      ?? '—'
  const totalRelationships = relationshipsData?.length ?? '—'
  const totalMarriages    = marriagesData?.length    ?? '—'
  const totalMedia        = mediaData?.['totalItems'] ?? mediaData?.['hydra:totalItems'] ?? '—'

  const displayName = user?.email && user.email !== ''
    ? user.email.split('@')[0]
    : null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{displayName ? `, ${displayName}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">Your family heritage at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total Persons"
          value={totalPersons}
          to="/persons"
          color="bg-indigo-500"
          isLoading={loadingPersons}
        />
        <StatCard
          icon={GitBranch}
          label="Relationships"
          value={totalRelationships}
          to="/relationships"
          color="bg-purple-500"
          isLoading={loadingRel}
        />
        <StatCard
          icon={Heart}
          label="Marriages"
          value={totalMarriages}
          to="/marriages"
          color="bg-rose-500"
          isLoading={loadingMarriages}
        />
        <StatCard
          icon={Image}
          label="Media Files"
          value={totalMedia}
          to="/media"
          color="bg-amber-500"
          isLoading={loadingMedia}
        />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/tree"
            className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <TreePine className="h-4 w-4" /> View Family Tree
          </Link>
          <Link
            to="/persons"
            className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Users className="h-4 w-4" /> Browse Persons
          </Link>
          <Link
            to="/marriages"
            className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <Heart className="h-4 w-4" /> Marriages
          </Link>
          <Link
            to="/media"
            className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <Image className="h-4 w-4" /> Media Library
          </Link>
        </div>
      </div>
    </div>
  )
}
