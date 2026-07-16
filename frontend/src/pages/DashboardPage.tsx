import { useQuery } from '@tanstack/react-query'
import { Users, GitBranch, Heart, ClipboardList, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { personsService } from '@/services/persons.service'
import { useAuthStore } from '@/store/auth.store'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

function StatCard({
  icon: Icon,
  label,
  value,
  to,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  to: string
  color: string
}) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
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
  const { data: persons, isLoading } = useQuery({
    queryKey: ['persons'],
    queryFn: () => personsService.getAll(),
  })

  const totalPersons = persons?.['hydra:totalItems'] ?? '—'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">Your family heritage at a glance</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total Persons"
            value={totalPersons}
            to="/persons"
            color="bg-primary-500"
          />
          <StatCard
            icon={GitBranch}
            label="Relationships"
            value="—"
            to="/relationships"
            color="bg-purple-500"
          />
          <StatCard
            icon={Heart}
            label="Marriages"
            value="—"
            to="/marriages"
            color="bg-pink-500"
          />
          <StatCard
            icon={ClipboardList}
            label="Pending Approvals"
            value="—"
            to="/approvals"
            color="bg-amber-500"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/tree"
            className="rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            View Family Tree
          </Link>
          <Link
            to="/persons"
            className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Browse Persons
          </Link>
        </div>
      </div>
    </div>
  )
}

