import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { clsx } from 'clsx'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import type { PersonNodeData } from '@/hooks/useTreeData'
import { ROLE_META, type RelativeRole } from './QuickAddRelativeModal'

interface PersonNodeProps extends NodeProps {
  data: PersonNodeData & {
    isSelected?: boolean
    highlightState?: 'ancestor' | 'descendant' | 'dimmed' | null
    onSelect?: (id: string) => void
    onHighlightAncestors?: (id: string) => void
    onHighlightDescendants?: (id: string) => void
    onToggleCollapse?: (id: string) => void
    onAddRelative?: (id: string, role: RelativeRole) => void
    canAddRelative?: boolean
  }
}

// Gender-based colour palette
const genderStyle = {
  male:    { border: 'border-blue-300',   avatar: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400' },
  female:  { border: 'border-pink-300',   avatar: 'bg-pink-100 text-pink-700',   dot: 'bg-pink-400' },
  other:   { border: 'border-purple-300', avatar: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  unknown: { border: 'border-gray-200',   avatar: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-300' },
}

const MENU_ROLES: RelativeRole[] = ['father', 'mother', 'son', 'daughter', 'partner', 'brother', 'sister']

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export const PersonNode = memo(({ data }: PersonNodeProps) => {
  const {
    person, isSelected, highlightState,
    onSelect, onHighlightAncestors: _oa, onHighlightDescendants: _od, onToggleCollapse,
    hasChildren, isCollapsed, collapsedChildCount,
    onAddRelative, canAddRelative,
  } = data

  const style = genderStyle[person.gender] ?? genderStyle.unknown
  const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : null
  const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : null

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const cardBorder = isSelected
    ? 'border-amber-400 shadow-amber-100 shadow-lg ring-2 ring-amber-300'
    : highlightState === 'ancestor'
      ? 'border-blue-400 bg-blue-50'
      : highlightState === 'descendant'
        ? 'border-green-400 bg-green-50'
        : highlightState === 'dimmed'
          ? `opacity-30 ${style.border}`
          : `${style.border} hover:shadow-md hover:border-opacity-70`

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-slate-300 !border-white !w-2 !h-2" />

      {/* Card */}
      <div
        onClick={() => onSelect?.(person.id)}
        className={clsx(
          'w-[190px] rounded-2xl border-2 bg-white shadow-sm cursor-pointer transition-all duration-200 select-none overflow-hidden',
          cardBorder,
        )}
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {/* Avatar: photo or initials */}
          <div className={clsx('h-10 w-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-semibold text-sm', style.avatar)}>
            {person.profilePictureUrl
              ? <img src={person.profilePictureUrl} alt="" className="h-10 w-10 object-cover" />
              : <span>{initials(person.firstName, person.lastName)}</span>
            }
          </div>

          {/* Name + dates */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {person.firstName} {person.lastName}
            </p>
            {person.maidenName && (
              <p className="text-[11px] text-gray-400 truncate">née {person.maidenName}</p>
            )}
            <p className="text-[11px] text-gray-400 mt-0.5">
              {birthYear ?? '?'}
              {!person.isLiving && ` – ${deathYear ?? '?'}`}
            </p>
          </div>

          {/* Deceased cross */}
          {!person.isLiving && (
            <span className="text-xs text-gray-300 self-start mt-0.5 flex-shrink-0">†</span>
          )}
        </div>

        {/* Birth place */}
        {person.birthPlace && (
          <p className="text-[10px] text-gray-400 truncate px-3 pb-2 -mt-1">{person.birthPlace}</p>
        )}

        {/* Selected hint */}
        {isSelected && (
          <div className="border-t border-amber-100 mx-3 pt-1 pb-1.5 text-center">
            <span className="text-[11px] text-amber-500 font-medium">See panel →</span>
          </div>
        )}
      </div>

      {/* ── + Add Relative button ───────────────────────────────────────────── */}
      {canAddRelative && (
        <div ref={menuRef} className="absolute -top-2.5 -right-2.5 z-[100]">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            title="Add relative"
            className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center shadow transition-all border text-xs',
              menuOpen
                ? 'bg-amber-500 border-amber-600 text-white'
                : 'bg-white border-gray-200 text-gray-400 hover:bg-amber-500 hover:border-amber-600 hover:text-white',
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute top-8 right-0 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[200]">
              <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Add relative
              </p>
              {MENU_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAddRelative?.(person.id, role) }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2 transition-colors"
                >
                  <span className="text-base leading-none">{ROLE_META[role].emoji}</span>
                  {ROLE_META[role].label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapse / expand toggle */}
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
            {isCollapsed
              ? <><ChevronDown className="h-3 w-3" /><span>+{collapsedChildCount}</span></>
              : <ChevronUp className="h-3 w-3" />
            }
          </button>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-300 !border-white !w-2 !h-2"
        style={{ bottom: hasChildren ? 16 : 0 }}
      />
    </div>
  )
})

PersonNode.displayName = 'PersonNode'
