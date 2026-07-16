import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { clsx } from 'clsx'
import { Users, Dna, ChevronDown, ChevronUp } from 'lucide-react'
import type { PersonNodeData } from '@/hooks/useTreeData'

interface PersonNodeProps extends NodeProps {
  data: PersonNodeData & {
    isSelected?: boolean
    highlightState?: 'ancestor' | 'descendant' | 'dimmed' | null
    onSelect?: (id: string) => void
    onHighlightAncestors?: (id: string) => void
    onHighlightDescendants?: (id: string) => void
    onToggleCollapse?: (id: string) => void
  }
}

const genderColors = {
  male:    { ring: 'ring-blue-400',   bg: 'bg-blue-50',    dot: 'bg-blue-400',   text: 'text-blue-700' },
  female:  { ring: 'ring-pink-400',   bg: 'bg-pink-50',    dot: 'bg-pink-400',   text: 'text-pink-700' },
  other:   { ring: 'ring-purple-400', bg: 'bg-purple-50',  dot: 'bg-purple-400', text: 'text-purple-700' },
  unknown: { ring: 'ring-gray-300',   bg: 'bg-gray-50',    dot: 'bg-gray-300',   text: 'text-gray-500' },
}

export const PersonNode = memo(({ data }: PersonNodeProps) => {
  const {
    person, isSelected, highlightState,
    onSelect, onHighlightAncestors, onHighlightDescendants, onToggleCollapse,
    hasChildren, isCollapsed, collapsedChildCount,
  } = data
  const colors = genderColors[person.gender] ?? genderColors.unknown

  const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : null
  const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : null

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !border-slate-300" />

      <div
        onClick={() => onSelect?.(person.id)}
        className={clsx(
          'w-[200px] rounded-xl border-2 bg-white shadow-sm cursor-pointer transition-all duration-200 select-none',
          isSelected && 'border-amber-400 shadow-amber-100 shadow-md ring-2 ring-amber-300',
          !isSelected && highlightState === 'ancestor'   && 'border-blue-400 bg-blue-50 shadow-blue-100',
          !isSelected && highlightState === 'descendant' && 'border-green-400 bg-green-50 shadow-green-100',
          !isSelected && highlightState === 'dimmed'     && 'opacity-30 border-gray-200',
          !isSelected && !highlightState                 && `border-gray-200 hover:border-gray-300 hover:shadow-md`,
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          <span className={clsx('h-2 w-2 rounded-full flex-shrink-0', colors.dot)} />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">
            {person.gender}
          </span>
          {!person.isLiving && (
            <span className="ml-auto text-xs text-gray-400">†</span>
          )}
        </div>

        {/* Name */}
        <div className="px-3 pb-1">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
            {person.firstName} {person.lastName}
          </p>
          {person.maidenName && (
            <p className="text-xs text-gray-400 truncate">née {person.maidenName}</p>
          )}
        </div>

        {/* Dates */}
        <div className="px-3 pb-2">
          <p className="text-xs text-gray-500">
            {birthYear ?? '?'} {!person.isLiving ? `– ${deathYear ?? '?'}` : ''}
          </p>
          {person.birthPlace && (
            <p className="text-xs text-gray-400 truncate">{person.birthPlace}</p>
          )}
        </div>

        {/* Action buttons — only show when selected */}
        {isSelected && (
          <div className="flex border-t border-gray-100 divide-x divide-gray-100">
            <button
              onClick={(e) => { e.stopPropagation(); onHighlightAncestors?.(person.id) }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors rounded-bl-xl"
              title="Highlight ancestors"
            >
              <Dna className="h-3 w-3" /> Ancestors
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onHighlightDescendants?.(person.id) }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-green-600 hover:bg-green-50 transition-colors rounded-br-xl"
              title="Highlight descendants"
            >
              <Users className="h-3 w-3" /> Descendants
            </button>
          </div>
        )}
      </div>

      {/* Collapse / expand toggle — shown below the node when it has children */}
      {hasChildren && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse?.(person.id) }}
            className={clsx(
              'flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-xs font-medium transition-all shadow-sm',
              isCollapsed
                ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700',
            )}
            title={isCollapsed ? `Expand ${collapsedChildCount} hidden` : 'Collapse children'}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="h-3 w-3" />
                <span>+{collapsedChildCount}</span>
              </>
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-400 !border-slate-300"
        style={{ bottom: hasChildren ? 16 : 0 }}
      />
    </>
  )
})

PersonNode.displayName = 'PersonNode'
