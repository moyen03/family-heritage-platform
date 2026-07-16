import { Link } from 'react-router-dom'
import { TreePine } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center p-8">
        <TreePine className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link
          to="/tree"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

