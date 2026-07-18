import { useState } from 'react'
import { Upload, Image, Film, FileText, Music, Search, Filter, Loader2 } from 'lucide-react'
import { useMedia } from '../hooks/useMedia'
import type { MediaItem } from '../hooks/useMedia'
import UploadModal from '../components/media/UploadModal'
import MediaDetailModal from '../components/media/MediaDetailModal'

const BACKEND = 'http://localhost:8000'

function thumbnailUrl(item: MediaItem): string | null {
  if (item.mediaType === 'photo' && item.storedFilename) {
    return `${BACKEND}/uploads/media/${item.storedFilename}`
  }
  return null
}

function MediaTypeIcon({ type }: { type: string }) {
  const cls = 'w-8 h-8 text-gray-400'
  if (type === 'video')    return <Film className={cls} />
  if (type === 'document') return <FileText className={cls} />
  if (type === 'audio')    return <Music className={cls} />
  return <Image className={cls} />
}

function MediaCard({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const thumb = thumbnailUrl(item)
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden hover:ring-2 hover:ring-indigo-400 transition-all text-left"
    >
      {thumb ? (
        <img src={thumb} alt={item.title ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <MediaTypeIcon type={item.mediaType} />
          <span className="text-xs text-gray-500 px-2 text-center line-clamp-2">{item.originalFilename}</span>
        </div>
      )}
      {/* overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-xs font-medium truncate">{item.title ?? item.originalFilename ?? '—'}</p>
        {item.dateTaken && (
          <p className="text-white/70 text-xs">{new Date(item.dateTaken).getFullYear()}</p>
        )}
      </div>
      {/* privacy badge */}
      <span className={`absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
        item.privacyLevel === 'public' ? 'bg-green-100 text-green-700' :
        item.privacyLevel === 'private' ? 'bg-red-100 text-red-700' :
        'bg-blue-100 text-blue-700'
      }`}>
        {item.privacyLevel}
      </span>
    </button>
  )
}

const TYPE_FILTERS = ['all', 'photo', 'video', 'document', 'audio']

export default function MediaPage() {
  const { data: items = [], isLoading } = useMedia()
  const [showUpload, setShowUpload] = useState(false)
  const [selected, setSelected]     = useState<MediaItem | null>(null)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = items.filter(item => {
    const matchType   = typeFilter === 'all' || item.mediaType === typeFilter
    const matchSearch = !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.originalFilename?.toLowerCase().includes(search.toLowerCase()) ||
      item.placeTaken?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const counts = {
    all:      items.length,
    photo:    items.filter(i => i.mediaType === 'photo').length,
    video:    items.filter(i => i.mediaType === 'video').length,
    document: items.filter(i => i.mediaType === 'document').length,
    audio:    items.filter(i => i.mediaType === 'audio').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Image className="w-5 h-5 text-indigo-600" />
              Media Library
            </h1>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, place, description…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {/* Type filter tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {TYPE_FILTERS.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  typeFilter === t ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t} {counts[t as keyof typeof counts] > 0 && (
                  <span className="ml-1 text-gray-400">({counts[t as keyof typeof counts]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No media found</p>
            <p className="text-gray-400 text-sm mt-1">
              {items.length === 0
                ? 'Upload your first photo, video or document to get started.'
                : 'Try adjusting your filters.'}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                <Upload className="w-4 h-4" /> Upload first file
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(item => (
              <MediaCard key={item.id} item={item} onClick={() => setSelected(item)} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {selected   && <MediaDetailModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

