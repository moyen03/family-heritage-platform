import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Route, Flame, Loader2, Filter } from 'lucide-react'
import { useAddresses } from '../hooks/useAddresses'
import type { Address } from '../hooks/useAddresses'

// Fix default marker icon (Leaflet + Vite bundler issue)
delete (Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TYPE_COLORS: Record<string, string> = {
  current:    '#22c55e',
  historical: '#6b7280',
  birth:      '#3b82f6',
  childhood:  '#f59e0b',
}

const TYPE_LABELS: Record<string, string> = {
  current:    'Current',
  historical: 'Historical',
  birth:      'Birth Place',
  childhood:  'Childhood',
}

type ViewMode = 'pins' | 'migration' | 'heatmap'

function formatDate(d: string | null) {
  if (!d) return null
  return d.slice(0, 7) // YYYY-MM
}

function groupByPerson(addresses: Address[]): Map<string, Address[]> {
  const map = new Map<string, Address[]>()
  for (const addr of addresses) {
    const key = addr.person.id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(addr)
  }
  return map
}

function countByCountry(addresses: Address[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const addr of addresses) {
    map.set(addr.country, (map.get(addr.country) ?? 0) + 1)
  }
  return map
}

export default function MapPage() {
  const { data: allAddresses = [], isLoading } = useAddresses()
  const [viewMode, setViewMode]         = useState<ViewMode>('pins')
  const [typeFilter, setTypeFilter]     = useState<string>('all')

  // Only addresses with coordinates
  const withCoords = useMemo(
    () => allAddresses.filter((a) => a.latitude && a.longitude),
    [allAddresses]
  )

  const filtered = useMemo(
    () => typeFilter === 'all' ? withCoords : withCoords.filter((a) => a.addressType === typeFilter),
    [withCoords, typeFilter]
  )

  // Group by person for migration paths
  const byPerson = useMemo(() => groupByPerson(filtered), [filtered])
  const countryCount = useMemo(() => countByCountry(allAddresses), [allAddresses])
  const maxCount = useMemo(() => Math.max(1, ...countryCount.values()), [countryCount])

  // Center of map: average of all coords, or default to Bangladesh
  const center = useMemo<[number, number]>(() => {
    if (filtered.length === 0) return [24.7936, 88.9312]
    const lat = filtered.reduce((s, a) => s + parseFloat(a.latitude!), 0) / filtered.length
    const lng = filtered.reduce((s, a) => s + parseFloat(a.longitude!), 0) / filtered.length
    return [lat, lng]
  }, [filtered])

  // Addresses without coords (for listing)
  const withoutCoords = useMemo(
    () => allAddresses.filter((a) => !a.latitude || !a.longitude),
    [allAddresses]
  )

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">Family Map</h1>
          <span className="text-sm text-gray-500 ml-2">
            {allAddresses.length} addresses · {withCoords.length} on map
          </span>
        </div>
        <p className="text-xs text-gray-400">Add addresses from each person's detail page</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-4 flex-shrink-0">
        {/* View mode */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([
            { mode: 'pins'      as ViewMode, icon: MapPin,  label: 'Pins' },
            { mode: 'migration' as ViewMode, icon: Route,   label: 'Migration' },
            { mode: 'heatmap'   as ViewMode, icon: Flame,   label: 'Heat Map' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === mode ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <div className="flex gap-1">
            {['all', 'current', 'historical', 'birth', 'childhood'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  typeFilter === t
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t === 'all' ? 'All Types' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={filtered.length > 0 ? 7 : 7}
              className="h-full w-full"
              key={`${center[0]}-${center[1]}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* PINS MODE — clustered so stacked pins don't pile up */}
              {viewMode === 'pins' && (
                <MarkerClusterGroup chunkedLoading>
                  {filtered.map((addr) => (
                    <Marker
                      key={addr.id}
                      position={[parseFloat(addr.latitude!), parseFloat(addr.longitude!)]}
                    >
                      <Popup>
                        <div className="text-sm min-w-[160px]">
                          <p className="font-semibold text-gray-900">{addr.person.fullName}</p>
                          <p className="text-xs text-gray-500 capitalize mb-1">{TYPE_LABELS[addr.addressType]}</p>
                          <p className="text-gray-700">{addr.displayLabel}</p>
                          {(addr.fromDate || addr.toDate) && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(addr.fromDate) ?? '?'} – {formatDate(addr.toDate) ?? 'present'}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              )}

              {/* MIGRATION MODE: line per person connecting chronological addresses */}
              {viewMode === 'migration' && Array.from(byPerson.entries()).map(([personId, addrs]) => {
                const sorted = [...addrs].sort((a, b) => {
                  if (!a.fromDate) return 1
                  if (!b.fromDate) return -1
                  return a.fromDate.localeCompare(b.fromDate)
                })
                const positions = sorted.map((a): [number, number] => [parseFloat(a.latitude!), parseFloat(a.longitude!)])
                return (
                  <span key={personId}>
                    <Polyline
                      positions={positions}
                      pathOptions={{ color: '#6366f1', weight: 2, dashArray: '6 4', opacity: 0.7 }}
                    />
                    {sorted.map((addr, i) => (
                      <CircleMarker
                        key={addr.id}
                        center={[parseFloat(addr.latitude!), parseFloat(addr.longitude!)]}
                        radius={i === sorted.length - 1 ? 8 : 5}
                        pathOptions={{
                          fillColor: TYPE_COLORS[addr.addressType] ?? '#6366f1',
                          fillOpacity: 0.9,
                          color: 'white',
                          weight: 1.5,
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{addr.person.fullName}</p>
                            <p className="text-xs text-gray-500">{TYPE_LABELS[addr.addressType]}</p>
                            <p>{addr.displayLabel}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </span>
                )
              })}

              {/* HEATMAP MODE: circle markers sized by density per location */}
              {viewMode === 'heatmap' && (() => {
                // Group by approximate location (1 decimal degree ≈ 11km)
                const buckets = new Map<string, { lat: number; lng: number; count: number; countries: Set<string> }>()
                for (const addr of filtered) {
                  const lat = Math.round(parseFloat(addr.latitude!) * 2) / 2
                  const lng = Math.round(parseFloat(addr.longitude!) * 2) / 2
                  const key = `${lat},${lng}`
                  if (!buckets.has(key)) buckets.set(key, { lat, lng, count: 0, countries: new Set() })
                  const b = buckets.get(key)!
                  b.count++
                  b.countries.add(addr.country)
                }
                const maxBucket = Math.max(1, ...Array.from(buckets.values()).map((b) => b.count))
                return Array.from(buckets.values()).map(({ lat, lng, count, countries }) => (
                  <CircleMarker
                    key={`${lat},${lng}`}
                    center={[lat, lng]}
                    radius={8 + (count / maxBucket) * 30}
                    pathOptions={{
                      fillColor: '#ef4444',
                      fillOpacity: 0.4 + (count / maxBucket) * 0.4,
                      color: '#dc2626',
                      weight: 1,
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{count} address{count > 1 ? 'es' : ''}</p>
                        <p className="text-gray-500">{Array.from(countries).join(', ')}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))
              })()}
            </MapContainer>
          )}

          {/* Legend */}
          {viewMode === 'pins' && (
            <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-lg p-3 text-xs space-y-1.5">
              <p className="font-semibold text-gray-700 mb-1">Address Type</p>
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-gray-600">{TYPE_LABELS[type]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: stats + list of addresses without coords */}
        <div className="w-72 border-l bg-white overflow-y-auto flex-shrink-0">
          {/* Country stats */}
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" /> Family by Country
            </h3>
            <div className="space-y-2">
              {Array.from(countryCount.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15)
                .map(([country, count]) => (
                  <div key={country} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-700 truncate">{country}</span>
                        <span className="text-gray-500 ml-1">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Addresses missing coordinates */}
          {withoutCoords.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                Missing Coordinates ({withoutCoords.length})
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                Add latitude/longitude to show these on the map:
              </p>
              <div className="space-y-1.5">
                {withoutCoords.slice(0, 20).map((addr) => (
                  <div key={addr.id} className="text-xs bg-gray-50 rounded-lg p-2">
                    <p className="font-medium text-gray-700">{addr.person.fullName}</p>
                    <p className="text-gray-400">{addr.displayLabel}</p>
                  </div>
                ))}
                {withoutCoords.length > 20 && (
                  <p className="text-xs text-gray-400 text-center py-1">
                    +{withoutCoords.length - 20} more…
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

