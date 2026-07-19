import { useState } from 'react'
import { X, MapPin, Loader2, AlertCircle } from 'lucide-react'
import { useCreateAddress, useUpdateAddress, type Address, type AddressFormData } from '../../hooks/useAddresses'

interface Props {
  personId: string
  personName?: string
  address?: Address | null
  onClose: () => void
}

const ADDRESS_TYPES = [
  { value: 'current',    label: 'Current' },
  { value: 'historical', label: 'Historical' },
  { value: 'birth',      label: 'Birth Place' },
  { value: 'childhood',  label: 'Childhood' },
] as const

export function AddressFormModal({ personId, personName, address, onClose }: Props) {
  const isEdit = !!address
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()

  const [form, setForm] = useState<Omit<AddressFormData, 'person'>>({
    addressType: address?.addressType ?? 'current',
    country:      address?.country ?? '',
    stateProvince: address?.stateProvince ?? '',
    district:     address?.district ?? '',
    city:         address?.city ?? '',
    village:      address?.village ?? '',
    street:       address?.street ?? '',
    postalCode:   address?.postalCode ?? '',
    latitude:     address?.latitude ?? '',
    longitude:    address?.longitude ?? '',
    fromDate:     address?.fromDate?.slice(0, 10) ?? '',
    toDate:       address?.toDate?.slice(0, 10) ?? '',
    notes:        address?.notes ?? '',
  })

  const set = (field: string, val: string) =>
    setForm((f) => ({ ...f, [field]: val || null }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Convert every empty string to null so the backend DateTimeNormalizer
    // doesn't reject empty fromDate / toDate strings.
    const cleanedForm = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    ) as Omit<AddressFormData, 'person'>

    const payload: AddressFormData = {
      person: `/api/persons/${personId}`,
      ...cleanedForm,
    }

    try {
      if (isEdit && address) {
        await updateAddress.mutateAsync({ id: address.id, data: payload })
      } else {
        await createAddress.mutateAsync(payload)
      }
      onClose()
    } catch {
      // error shown below
    }
  }

  const isPending = createAddress.isPending || updateAddress.isPending
  const isError   = createAddress.isError   || updateAddress.isError
  const errorMsg  = (() => {
    const err: unknown = createAddress.error ?? updateAddress.error
    if (!err) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (err as any)?.response?.data
    if (data?.detail) return data.detail
    if (data?.['hydra:description']) return data['hydra:description']
    return 'Failed to save address. Please try again.'
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            {isEdit ? 'Edit Address' : 'Add Address'}
            {personName && <span className="text-gray-500 font-normal text-sm">— {personName}</span>}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Address Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Type *</label>
            <select
              value={form.addressType}
              onChange={(e) => set('addressType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            >
              {ADDRESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <input
              type="text"
              value={form.country ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              placeholder="e.g. Lebanon"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          {/* State / Province */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
              <input
                type="text"
                value={form.stateProvince ?? ''}
                onChange={(e) => set('stateProvince', e.target.value)}
                placeholder="e.g. Mount Lebanon"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                type="text"
                value={form.district ?? ''}
                onChange={(e) => set('district', e.target.value)}
                placeholder="e.g. Metn"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* City / Village */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city ?? ''}
                onChange={(e) => set('city', e.target.value)}
                placeholder="e.g. Beirut"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
              <input
                type="text"
                value={form.village ?? ''}
                onChange={(e) => set('village', e.target.value)}
                placeholder="e.g. Bikfaya"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Street / Postal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input
                type="text"
                value={form.street ?? ''}
                onChange={(e) => set('street', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={form.postalCode ?? ''}
                onChange={(e) => set('postalCode', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.latitude ?? ''}
                onChange={(e) => set('latitude', e.target.value)}
                placeholder="e.g. 33.8869"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.longitude ?? ''}
                onChange={(e) => set('longitude', e.target.value)}
                placeholder="e.g. 35.5131"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={form.fromDate ?? ''}
                onChange={(e) => set('fromDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={form.toDate ?? ''}
                onChange={(e) => set('toDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Additional context about this address…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Error */}
          {isError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

