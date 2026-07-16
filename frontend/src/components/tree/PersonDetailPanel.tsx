import { X, Calendar, MapPin, User, Heart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { personsService } from '@/services/persons.service'

interface PersonDetailPanelProps {
  personId: string
  onClose: () => void
  highlightMode: 'ancestor' | 'descendant' | null
  highlightCount: number
}

function DateRow({ label, date, place }: { label: string; date: string | null; place: string | null }) {
  if (!date && !place) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 w-16 flex-shrink-0">{label}</span>
      <div>
        {date && (
          <div className="flex items-center gap-1 text-gray-700">
            <Calendar className="h-3 w-3 text-gray-400" />
            {new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}
        {place && (
          <div className="flex items-center gap-1 text-gray-500">
            <MapPin className="h-3 w-3 text-gray-400" />
            {place}
          </div>
        )}
      </div>
    </div>
  )
}

export function PersonDetailPanel({ personId, onClose, highlightMode, highlightCount }: PersonDetailPanelProps) {
  const { data: person, isLoading } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => personsService.getById(personId),
    enabled: !!personId,
  })

  const { data: marriages = [] } = useQuery({
    queryKey: ['marriages', personId],
    queryFn: () => personsService.getMarriages(personId),
    enabled: !!personId,
  })

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">Person Details</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Highlight badge */}
      {highlightMode && highlightCount > 0 && (
        <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 ${
          highlightMode === 'ancestor' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
        }`}>
          <span className={`h-2 w-2 rounded-full ${highlightMode === 'ancestor' ? 'bg-blue-400' : 'bg-green-400'}`} />
          {highlightCount} {highlightMode === 'ancestor' ? 'ancestors' : 'descendants'} highlighted
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8"><LoadingSpinner /></div>
        ) : !person ? (
          <div className="p-4 text-gray-400 text-sm">Person not found</div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Name block */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900">{person.fullName}</h2>
              </div>
              {person.maidenName && (
                <p className="text-sm text-gray-500 ml-6">née {person.maidenName}</p>
              )}
              <div className="flex gap-2 mt-2 ml-6 flex-wrap">
                <Badge variant={
                  person.gender === 'male' ? 'info' :
                  person.gender === 'female' ? 'warning' : 'default'
                }>
                  {person.gender}
                </Badge>
                <Badge variant={person.isLiving ? 'success' : 'default'}>
                  {person.isLiving ? 'Living' : 'Deceased'}
                </Badge>
              </div>
            </div>

            {/* Alternative names */}
            {person.personNames?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Also Known As</p>
                <div className="space-y-1">
                  {person.personNames.map((n) => (
                    <div key={n.id} className="text-sm">
                      <span className="text-gray-900">{n.name}</span>
                      <span className="text-gray-400 ml-2">({n.nameType})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Life Events</p>
              <div className="space-y-2">
                <DateRow label="Born" date={person.birthDate} place={person.birthPlace} />
                {!person.isLiving && (
                  <DateRow label="Died" date={person.deathDate} place={person.deathPlace} />
                )}
              </div>
            </div>

            {/* Marriages */}
            {marriages.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  <Heart className="h-3 w-3 inline mr-1" />
                  Marriages
                </p>
                <div className="space-y-2">
                  {marriages.map((m) => {
                    const spouse = m.spouse1.id === personId ? m.spouse2 : m.spouse1
                    return (
                      <div key={m.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                        <p className="font-medium text-gray-900">{spouse.fullName}</p>
                        {m.marriageDate && (
                          <p className="text-gray-500 text-xs mt-0.5">
                            Married {new Date(m.marriageDate).getFullYear()}
                            {m.isDivorced && ' · Divorced'}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Biography */}
            {person.biography && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Biography</p>
                <p className="text-sm text-gray-700 leading-relaxed">{person.biography}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

