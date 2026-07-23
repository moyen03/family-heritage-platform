import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import type { ApiCollection } from '../types/api'

export interface MediaItem {
  id: string
  mediaType: 'photo' | 'video' | 'document' | 'audio'
  originalFilename: string | null
  storedFilename: string | null
  mimeType: string | null
  fileSize: number | null
  title: string | null
  description: string | null
  dateTaken: string | null
  placeTaken: string | null
  source: string | null
  privacyLevel: 'public' | 'family' | 'private'
  createdAt: string
  uploadedBy: { id: string; email: string } | null
}

export function useMedia() {
  return useQuery<MediaItem[]>({
    queryKey: ['media'],
    queryFn: async () => {
      const res = await api.get<ApiCollection<MediaItem>>('/media')
      const data = res.data as Record<string, unknown>
      const items = data?.['member'] ?? data?.['hydra:member']
      return Array.isArray(items) ? (items as MediaItem[]) : []
    },
    staleTime: 60_000,         // keep data fresh for 1 min — prevents blank flash on navigation
    placeholderData: (prev) => prev,  // keep showing old data while refetching
  })
}

export function useMediaItem(id: string) {
  return useQuery<MediaItem>({
    queryKey: ['media', id],
    queryFn: async () => {
      const res = await api.get<MediaItem>(`/media/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

