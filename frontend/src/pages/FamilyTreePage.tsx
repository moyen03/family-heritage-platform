import { TreePine } from 'lucide-react'

export function FamilyTreePage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center p-8">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50 mb-6">
          <TreePine className="h-10 w-10 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Family Tree Visualization</h2>
        <p className="text-gray-500 max-w-sm">
          The interactive tree visualization is coming in the next task.
          It will use React Flow with zoom, pan, and expand/collapse support.
        </p>
      </div>
    </div>
  )
}

