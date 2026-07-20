import { Handle, Position } from '@xyflow/react'

/**
 * Invisible branching-point node placed between a married couple and their children.
 * Creates the classic genealogy bracket look:
 *
 *   [Parent1] ————●———— [Parent2]
 *                 |
 *       ——————————|——————————
 *       |         |         |
 *    [Child1]  [Child2]  [Child3]
 */
export function FamilyConnectorNode() {
  return (
    <div style={{ width: 1, height: 1, position: 'relative' }}>
      {/* Receives edges from both parents */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{ background: '#94a3b8', width: 6, height: 6, border: '1px solid white' }}
      />
      {/* Sends edges to all children */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{ background: '#94a3b8', width: 6, height: 6, border: '1px solid white' }}
      />
    </div>
  )
}

