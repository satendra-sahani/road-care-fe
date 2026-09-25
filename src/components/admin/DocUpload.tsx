'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, Loader2, X, ExternalLink } from 'lucide-react'
import { uploadAPI } from '@/services/api'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  value: string
  onChange: (url: string) => void
  /** ImageKit folder, e.g. 'mechanic-kyc' — keeps documents grouped in the media library */
  folder: string
  hint?: string
  required?: boolean
  className?: string
}

/**
 * Single-image document uploader for admin registration forms.
 * Files go straight to ImageKit via POST /admin/upload/image and only the
 * returned URL is kept in form state — nothing is stored locally.
 */
export function DocUpload({ label, value, onChange, folder, hint, required, className }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const pick = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files are allowed'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large (max 5MB)'); return }
    setUploading(true)
    try {
      const res = await uploadAPI.uploadImage(file, folder)
      const url = res.data?.data?.url || res.data?.url
      if (url) { onChange(url); toast.success(`${label} uploaded`) }
      else toast.error('Upload failed')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-xs font-semibold text-[#475569]">
        {label}{required && <span className="text-red-500"> *</span>}
      </p>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = '' }}
      />
      {value ? (
        <div className="relative rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="w-full h-36 object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/55 px-2 py-1.5">
            <a href={value} target="_blank" rel="noreferrer" className="text-[11px] text-white flex items-center gap-1 hover:underline">
              <ExternalLink className="h-3 w-3" /> View
            </a>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => ref.current?.click()}
                disabled={uploading}
                className="text-[11px] text-white bg-white/20 rounded px-2 py-0.5 hover:bg-white/30 disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : 'Change'}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-white bg-white/20 rounded p-0.5 hover:bg-red-500/80"
                aria-label={`Remove ${label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="w-full h-36 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-[#1B3B6F]/40 flex flex-col items-center justify-center gap-1.5 text-gray-500 transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-xs font-medium">{uploading ? 'Uploading to ImageKit…' : 'Click to upload'}</span>
          {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
        </button>
      )}
    </div>
  )
}
