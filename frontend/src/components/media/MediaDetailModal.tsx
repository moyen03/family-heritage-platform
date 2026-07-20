import { Image, Film, FileText, Music, Calendar, MapPin, Lock, Globe, Users, X, Download } from 'lucide-react'
import type { MediaItem } from '../../hooks/useMedia'

const BACKEND = 'http://localhost:8000'

function mediaUrl(item: MediaItem) {
  if (!item.storedFilename) return null
  return `${BACKEND}/uploads/media/${item.storedFilename}`
}

function MediaIcon({ type }: { type: string }) {
  const cls = 'w-12 h-12 text-gray-400'
  if (type === 'video')    return <Film className={cls} />
  if (type === 'document') return <FileText className={cls} />
  if (type === 'audio')    return <Music className={cls} />
  return <Image className={cls} />
}

function PrivacyBadge({ level }: { level: string }) {
  if (level === 'public')  return <span className="flex items-center gap-1 text-green-600 text-xs"><Globe className="w-3 h-3"/>Public</span>
  if (level === 'private') return <span className="flex items-center gap-1 text-red-600 text-xs"><Lock className="w-3 h-3"/>Private</span>
  return <span className="flex items-center gap-1 text-blue-600 text-xs"><Users className="w-3 h-3"/>Family</span>
}

interface Props {
  item: MediaItem
  onClose: () => void
}

export default function MediaDetailModal({ item, onClose }: Props) {
  const url = mediaUrl(item)
  const isImage = item.mediaType === 'photo' && item.mimeType?.startsWith('image/')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-gray-900 truncate">{item.title ?? item.originalFilename ?? 'Media'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-gray-900 flex items-center justify-center min-h-48">
          {isImage && url ? (
            <img src={url} alt={item.title ?? ''} className="max-h-96 max-w-full object-contain" />
          ) : item.mediaType === 'video' && url ? (
            <video controls className="max-h-96 max-w-full">
              <source src={url} type={item.mimeType ?? ''} />
            </video>
          ) : item.mediaType === 'audio' && url ? (
            <div className="p-8">
              <Music className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <audio controls><source src={url} /></audio>
            </div>
          ) : (
            <div className="p-12 text-center">
              <MediaIcon type={item.mediaType} />
              <p className="text-white/60 text-sm mt-2">{item.originalFilename}</p>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="p-5 space-y-4">
          {item.description && (
            <p className="text-gray-700 text-sm">{item.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {item.dateTaken && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(item.dateTaken).toLocaleDateString()}
              </div>
            )}
            {item.placeTaken && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                {item.placeTaken}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <PrivacyBadge level={item.privacyLevel} />
            {item.fileSize && (
              <span>{(item.fileSize / 1024).toFixed(0)} KB</span>
            )}
            {item.uploadedBy && <span>by {item.uploadedBy.email}</span>}
          </div>

          {url && (
            <a
              href={url}
              download={item.originalFilename ?? 'download'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <Download className="w-4 h-4" /> Download original
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

