import { useState } from 'react'
import { MapPin, Plus, Edit2, Trash2, Calendar, Navigation } from 'lucide-react'
import { useAddresses, useDeleteAddress, type Address } from '../../hooks/useAddresses'
import { AddressFormModal } from './AddressFormModal'

interface Props {
  personId: string
  personName?: string
  canEdit?: boolean
}

const TYPE_COLORS: Record<string, string> = {
  current:    'bg-green-100 text-green-700',
  historical: 'bg-gray-100 text-gray-600',
  birth:      'bg-blue-100 text-blue-700',
  childhood:  'bg-yellow-100 text-yellow-700',
}

const TYPE_LABELS: Record<string, string> = {
  current:    'Current',
  historical: 'Historical',
  birth:      'Birth Place',
  childhood:  'Childhood',
}

function AddressCard({ address, onEdit, onDelete }: {
  address: Address
  onEdit: () => void
  onDelete: () => void
}) {
  const hasCords = address.latitude && address.longitude
  const parts = [
    address.street,
    address.village || address.city,
    address.district || address.stateProvince,
    address.country,
  ].filter(Boolean)

  return (
    <div className="flex items-start gap-3 p-4 bg-white border rounded-xl hover:border-indigo-300 transition-colors group">
      <div className="flex-shrink-0 mt-0.5">
        <MapPin className="w-4 h-4 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[address.addressType] ?? 'bg-gray-100 text-gray-600'}`}>
            {TYPE_LABELS[address.addressType] ?? address.addressType}
          </span>
          {hasCords && (
            <span className="text-xs text-indigo-500 flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              GPS
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900">{parts.join(', ')}</p>
        {(address.fromDate || address.toDate) && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" />
            {address.fromDate?.slice(0, 7) ?? '?'} – {address.toDate?.slice(0, 7) ?? 'present'}
          </p>
        )}
        {address.notes && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{address.notes}</p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 text-gray-400 hover:text-indigo-600 rounded"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600 rounded"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function PersonAddressPanel({ personId, personName, canEdit = true }: Props) {
  const { data: addresses = [], isLoading } = useAddresses(personId)
  const deleteAddress = useDeleteAddress()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Address | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm('Delete this address?')) {
      await deleteAddress.mutateAsync(id)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-400 py-4 text-center">Loading addresses…</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Addresses ({addresses.length})
        </h3>
        {canEdit && (
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed rounded-xl text-gray-400">
          <MapPin className="w-6 h-6 mx-auto mb-1" />
          <p className="text-xs">No addresses recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={() => { setEditing(addr); setShowForm(true) }}
              onDelete={() => handleDelete(addr.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <AddressFormModal
          personId={personId}
          personName={personName}
          address={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

