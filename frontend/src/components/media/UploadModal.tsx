import React, { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Upload, Image, Film, FileText, Music } from 'lucide-react'
import api from '../../services/api'

interface UploadModalProps {
  onClose: () => void
}

const mediaTypes = [
  { value: 'photo',    label: 'Photo',    icon: Image },
  { value: 'video',    label: 'Video',    icon: Film },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'audio',    label: 'Audio',    icon: Music },
]

const privacyLevels = [
  { value: 'public',  label: '🌍 Public — anyone can see' },
  { value: 'family',  label: '👨‍👩‍👧 Family — logged-in members only' },
  { value: 'private', label: '🔒 Private — only you' },
]

export default function UploadModal({ onClose }: UploadModalProps) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [mediaType, setMediaType]     = useState('photo')
  const [privacyLevel, setPrivacy]    = useState('family')
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [dateTaken, setDateTaken]     = useState('')
  const [placeTaken, setPlaceTaken]   = useState('')
  const [source, setSource]           = useState('')
  const [file, setFile]               = useState<File | null>(null)
  const [preview, setPreview]         = useState<string | null>(null)

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected')
      const form = new FormData()
      form.append('file',         file)
      form.append('mediaType',    mediaType)
      form.append('privacyLevel', privacyLevel)
      if (title)       form.append('title',       title)
      if (description) form.append('description', description)
      if (dateTaken)   form.append('dateTaken',   dateTaken)
      if (placeTaken)  form.append('placeTaken',  placeTaken)
      if (source)      form.append('source',      source)
      await api.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      onClose()
    },
  })

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            Upload Media
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Media type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {mediaTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMediaType(value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    mediaType === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* File drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
          >
            {preview ? (
              <img src={preview} alt="preview" className="mx-auto max-h-40 rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Click to choose a file or drag & drop'}
                </p>
              </>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="A short title for this file"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Who is in this photo? What is happening?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* Date / Place */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date taken</label>
              <input
                type="date"
                value={dateTaken}
                onChange={e => setDateTaken(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place taken</label>
              <input
                type="text"
                value={placeTaken}
                onChange={e => setPlaceTaken(e.target.value)}
                placeholder="e.g. Dhaka, Bangladesh"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="e.g. Family album, scanned by Moyen"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
            <select
              value={privacyLevel}
              onChange={e => setPrivacy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {privacyLevels.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {upload.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              Upload failed. Please try again.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => upload.mutate()}
            disabled={!file || upload.isPending}
            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {upload.isPending ? (
              <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" />Upload</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

