import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from '@xyflow/react'
import { Heart } from 'lucide-react'

export function MarriageEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const isDivorced = (data as { isDivorced?: boolean })?.isDivorced ?? false

  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isDivorced ? '#94a3b8' : '#fb7185',
          strokeWidth: 2,
          strokeDasharray: isDivorced ? '4 4' : '8 4',
          opacity: isDivorced ? 0.5 : 1,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'none',
          }}
          className={`rounded-full p-0.5 border ${
            isDivorced
              ? 'bg-gray-50 border-gray-200'
              : 'bg-white border-rose-200'
          }`}
        >
          <Heart
            className={`h-3 w-3 ${
              isDivorced ? 'text-gray-300' : 'text-rose-400 fill-rose-200'
            }`}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

