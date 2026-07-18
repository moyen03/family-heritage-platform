import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import type { ApiCollection } from '../types/api'

export interface Address {
  id: string
  person: { id: string; fullName: string; firstName: string; lastName: string }
  addressType: 'current' | 'historical' | 'birth' | 'childhood'
  country: string
  stateProvince: string | null
  district: string | null
  city: string | null
  village: string | null
  street: string | null
  postalCode: string | null
  latitude: string | null
  longitude: string | null
  fromDate: string | null
  toDate: string | null
  notes: string | null
  displayLabel: string
  createdAt: string
  updatedAt: string
}

export interface AddressFormData {
  person: string   // IRI: /api/persons/{id}
  addressType: Address['addressType']
  country: string
  stateProvince?: string | null
  district?: string | null
  city?: string | null
  village?: string | null
  street?: string | null
  postalCode?: string | null
  latitude?: string | null
  longitude?: string | null
  fromDate?: string | null
  toDate?: string | null
  notes?: string | null
}

export function useAddresses(personId?: string) {
  return useQuery<Address[]>({
    queryKey: ['addresses', personId ?? 'all'],
    queryFn: async () => {
      const params = personId ? { person: personId } : {}
      const res = await api.get<ApiCollection<Address>>('/api/addresses', { params })
      return res.data?.['member'] ?? res.data?.['hydra:member'] ?? []
    },
  })
}

export function useAllAddressesWithCoords() {
  return useQuery<Address[]>({
    queryKey: ['addresses', 'with-coords'],
    queryFn: async () => {
      const res = await api.get<ApiCollection<Address>>('/api/addresses')
      const all: Address[] = res.data?.['member'] ?? res.data?.['hydra:member'] ?? []
      return all.filter((a) => a.latitude !== null && a.longitude !== null)
    },
  })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AddressFormData) => api.post<Address>('/api/addresses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] })
      qc.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}

export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressFormData> }) =>
      api.patch<Address>(`/api/addresses/${id}`, data, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] })
    },
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/addresses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] })
    },
  })
}

