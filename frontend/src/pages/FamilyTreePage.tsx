import { useCallback, useRef } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { FamilyTree, type FamilyTreeHandle } from '@/components/tree/FamilyTree'
import { TreeToolbar } from '@/components/tree/TreeToolbar'
import { useTreeData } from '@/hooks/useTreeData'

function FamilyTreeInner() {
  const treeRef = useRef<FamilyTreeHandle>(null)
  const { totalPersons } = useTreeData()

  const handleFocusPerson = useCallback((id: string) => {
    treeRef.current?.focusPerson(id)
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TreeToolbar totalPersons={totalPersons} onFocusPerson={handleFocusPerson} />
      <FamilyTree ref={treeRef} />
    </div>
  )
}

export function FamilyTreePage() {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner />
    </ReactFlowProvider>
  )
}
