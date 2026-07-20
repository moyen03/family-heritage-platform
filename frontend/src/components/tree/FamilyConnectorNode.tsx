import { Handle, Position } from '@xyflow/react'

/**
 * Small branching-point node placed between a married couple and their children.
 *
 *   [Parent1] ————♥———— [Parent2]   (marriage edge)
 *                  ↓  (smoothstep from parents)
 *               [  ●  ]              (this node — visible dot)
 *                  ↓  (step edges — orthogonal, one per child)
 *         ┌────────┼────────┐
 *      [Child1] [Child2] [Child3]
 */
export function FamilyConnectorNode() {
  return (
    <div style={{ position: 'relative', width: 10, height: 10 }}>
      {/* Parents feed in from the top */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{
          background: '#94a3b8',
          width: 8,
          height: 8,
          border: '2px solid white',
          top: -4,
          left: 1,
        }}
      />
      {/* Children fan out from the bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{
          background: '#64748b',
          width: 8,
          height: 8,
          border: '2px solid white',
          bottom: -4,
          left: 1,
        }}
      />
      {/* Visible dot */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: '#94a3b8',
          border: '2px solid white',
          boxShadow: '0 0 0 1.5px #94a3b8',
        }}
      />
    </div>
  )
}
