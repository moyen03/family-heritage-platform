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
      return res.data?.['member'] ?? res.data?.['hydra:member'] ?? []
    },
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

