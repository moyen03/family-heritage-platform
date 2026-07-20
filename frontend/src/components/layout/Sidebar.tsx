import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, TreePine, Users, GitBranch, Heart, Image, Map, ClipboardList, LogOut, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore, selectIsAdmin } from '@/store/auth.store'

const NAV_ITEMS = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tree',          icon: TreePine,         label: 'Family Tree' },
  { to: '/persons',       icon: Users,            label: 'All Persons' },
  { to: '/relationships', icon: GitBranch,        label: 'Relationships' },
  { to: '/marriages',     icon: Heart,            label: 'Marriages' },
  { to: '/media',         icon: Image,            label: 'Media Library' },
  { to: '/map',           icon: Map,              label: 'Family Map' },
]

const ADMIN_NAV_ITEMS = [
  { to: '/branches',  icon: GitBranch,    label: 'Branch Management' },
  { to: '/approvals', icon: ClipboardList, label: 'Approval Queue' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore(selectIsAdmin)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-heritage-500">
          <TreePine className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Family Heritage</p>
          <p className="text-xs text-gray-400">Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
            <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Admin</p>
            </div>
            {ADMIN_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-700 px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
            {user?.email && user.email !== '' ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {user?.email && user.email !== '' ? user.email : 'Signed in'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
