import { Handle, Position } from '@xyflow/react'

/**
 * Invisible waypoint node between a married couple and their children.
 * 10 × 10 transparent div so React Flow's edge router has a proper bounding
 * box to target — making parent→connector→child edge curves smooth and clean.
 */
export function FamilyConnectorNode() {
  return (
    <div style={{ position: 'relative', width: 10, height: 10 }}>
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{ background: 'transparent', border: 'none', width: 2, height: 2, top: -1, left: 4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{ background: 'transparent', border: 'none', width: 2, height: 2, bottom: -1, left: 4 }}
      />
      {/* No visible dot — fully transparent routing point */}
    </div>
  )
}
