'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Upload,
  Crop,
  ZoomIn,
  ZoomOut,
  X,
  Save,
  Loader2,
  Monitor,
  Smartphone,
  Globe,
  Link as LinkIcon,
  Type,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminHeader } from './AdminHeader'
import { cn } from '@/lib/utils'
import { bannerAPI, uploadAPI } from '@/services/api'
import Cropper, { type Area } from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'

interface Banner {
  _id: string
  title: string
  subtitle: string
  imageUrl: string
  imageId: string
  link: string
  linkText: string
  isActive: boolean
  order: number
  platform: 'all' | 'web' | 'android'
  createdAt: string
  updatedAt: string
}

interface BannerFormData {
  title: string
  subtitle: string
  imageUrl: string
  imageId: string
  link: string
  linkText: string
  isActive: boolean
  platform: 'all' | 'web' | 'android'
}

const emptyBanner: BannerFormData = {
  title: '',
  subtitle: '',
  imageUrl: '',
  imageId: '',
  link: '/shop',
  linkText: 'Shop Now',
  isActive: true,
  platform: 'all',
}

/* Target output size per platform so the crop always fills the slot with no
   side gaps: web/all use the wide desktop hero ratio (~4.27:1); android matches
   the mobile app's 16:7 banner. */
const BANNER_PRESETS: Record<BannerFormData['platform'], { w: number; h: number; label: string }> = {
  web: { w: 1280, h: 300, label: '1280 × 300 px' },
  all: { w: 1280, h: 300, label: '1280 × 300 px' },
  android: { w: 1200, h: 525, label: '1200 × 525 px' },
}

export function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState(emptyBanner)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)

  // Cropper state
  const [rawSrc, setRawSrc] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [cropping, setCropping] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null)

  // Filter
  const [filterPlatform, setFilterPlatform] = useState('all')

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true)
      const res = await bannerAPI.getAll()
      const data = res.data?.data || res.data?.banners || res.data || []
      setBanners(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  const cropPreset = BANNER_PRESETS[formData.platform]

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setError('')
    if (rawSrc) URL.revokeObjectURL(rawSrc)
    setRawSrc(URL.createObjectURL(file))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCropOpen(true)
    e.target.value = ''
  }

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleApplyCrop = async () => {
    if (!rawSrc || !croppedAreaPixels) return
    try {
      setCropping(true)
      const blob = await getCroppedImg(rawSrc, croppedAreaPixels, cropPreset.w, cropPreset.h)
      const file = new File([blob], `banner-${cropPreset.w}x${cropPreset.h}.jpg`, { type: 'image/jpeg' })
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setImageFile(file)
      setImagePreview(URL.createObjectURL(blob))
      setCropOpen(false)
    } catch {
      setError('Could not crop the image. Please try a different file.')
    } finally {
      setCropping(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingBanner(null)
    // Pre-fill the new-banner form with the platform that's currently being
    // filtered. So when the admin clicks "Add Banner" while looking at the
    // Web tab, the new banner defaults to platform='web' (not 'all'), and
    // doesn't accidentally end up showing on mobile too. Picking 'all' from
    // the form dropdown is still possible — this just sets the right default.
    setFormData({
      ...emptyBanner,
      platform: filterPlatform === 'all'
        ? 'all'
        : (filterPlatform as 'web' | 'android'),
    })
    setImageFile(null)
    setImagePreview('')
    setDialogOpen(true)
  }

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl,
      imageId: banner.imageId || '',
      link: banner.link || '/shop',
      linkText: banner.linkText || 'Shop Now',
      isActive: banner.isActive,
      platform: banner.platform || 'all',
    })
    setImageFile(null)
    setImagePreview(banner.imageUrl)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      let imageUrl = formData.imageUrl
      let imageId = formData.imageId

      // Upload new image if selected
      if (imageFile) {
        setUploading(true)
        const uploadRes = await uploadAPI.uploadImage(imageFile, 'banners')
        const uploadData = uploadRes.data?.data || uploadRes.data
        imageUrl = uploadData.url || uploadData.imageUrl
        imageId = uploadData.fileId || uploadData.imageId || ''
        setUploading(false)
      }

      if (!imageUrl) {
        setError('Banner image is required')
        setSaving(false)
        return
      }

      const payload = {
        ...formData,
        imageUrl,
        imageId,
      }

      if (editingBanner) {
        await bannerAPI.update(editingBanner._id, payload)
      } else {
        await bannerAPI.create(payload)
      }

      setDialogOpen(false)
      fetchBanners()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save banner')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleToggle = async (banner: Banner) => {
    try {
      await bannerAPI.toggle(banner._id)
      setBanners(prev =>
        prev.map(b => b._id === banner._id ? { ...b, isActive: !b.isActive } : b)
      )
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle banner')
    }
  }

  const handleDelete = async () => {
    if (!deletingBanner) return
    try {
      await bannerAPI.delete(deletingBanner._id)
      setDeleteDialogOpen(false)
      setDeletingBanner(null)
      fetchBanners()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete banner')
    }
  }

  const handleMove = async (banner: Banner, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(b => b._id === banner._id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const reordered = sorted.map((b, i) => {
      if (i === idx) return { id: b._id, order: swapIdx }
      if (i === swapIdx) return { id: b._id, order: idx }
      return { id: b._id, order: i }
    })

    try {
      await bannerAPI.reorder(reordered)
      fetchBanners()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reorder')
    }
  }

  const filteredBanners = banners
    .filter(b => filterPlatform === 'all' || b.platform === filterPlatform || b.platform === 'all')
    .sort((a, b) => a.order - b.order)

  const activeBanners = banners.filter(b => b.isActive)
  const webBanners = banners.filter(b => b.platform === 'web' || b.platform === 'all')
  const androidBanners = banners.filter(b => b.platform === 'android' || b.platform === 'all')

  const platformIcon = (platform: string) => {
    switch (platform) {
      case 'web': return <Monitor className="h-3 w-3" />
      case 'android': return <Smartphone className="h-3 w-3" />
      default: return <Globe className="h-3 w-3" />
    }
  }

  const platformColor = (platform: string) => {
    switch (platform) {
      case 'web': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'android': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1D29]">Banner Management</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Manage homepage slider banners for website and mobile app
            </p>
          </div>
          <Button
            className="bg-[#1B3B6F] hover:bg-[#0F2545]"
            onClick={handleOpenCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setError('')}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1D29]">{banners.length}</p>
                  <p className="text-xs text-[#6B7280]">Total Banners</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1D29]">{activeBanners.length}</p>
                  <p className="text-xs text-[#6B7280]">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1D29]">{webBanners.length}</p>
                  <p className="text-xs text-[#6B7280]">Web Banners</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1D29]">{androidBanners.length}</p>
                  <p className="text-xs text-[#6B7280]">Android Banners</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <Label className="text-sm font-medium text-[#6B7280]">Platform:</Label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All', icon: Globe },
                { value: 'web', label: 'Web', icon: Monitor },
                { value: 'android', label: 'Android', icon: Smartphone },
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={filterPlatform === value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs',
                    filterPlatform === value && 'bg-[#1B3B6F] hover:bg-[#0F2545]'
                  )}
                  onClick={() => setFilterPlatform(value)}
                >
                  <Icon className="h-3 w-3 mr-1.5" />
                  {label}
                </Button>
              ))}
            </div>
            <div className="ml-auto text-sm text-[#6B7280]">
              {filteredBanners.length} banner{filteredBanners.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {/* Banner Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" />
          </div>
        ) : filteredBanners.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-[#1A1D29]">No banners yet</p>
              <p className="text-sm text-[#6B7280] mt-1">Create your first banner to display on the homepage</p>
              <Button className="mt-4 bg-[#1B3B6F] hover:bg-[#0F2545]" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" /> Add Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBanners.map((banner, idx) => (
              <Card
                key={banner._id}
                className={cn(
                  'border-0 shadow-sm overflow-hidden hover:shadow-md transition-all group',
                  !banner.isActive && 'opacity-60'
                )}
              >
                {/* Image Preview — shown in the banner's true platform ratio */}
                <div
                  className="relative bg-gray-100 overflow-hidden"
                  style={{ aspectRatio: `${BANNER_PRESETS[banner.platform].w} / ${BANNER_PRESETS[banner.platform].h}` }}
                >
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-gray-300" />
                    </div>
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs"
                      onClick={() => handleOpenEdit(banner)}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs"
                      onClick={() => handleToggle(banner)}
                    >
                      {banner.isActive ? (
                        <><EyeOff className="h-3 w-3 mr-1" /> Hide</>
                      ) : (
                        <><Eye className="h-3 w-3 mr-1" /> Show</>
                      )}
                    </Button>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge
                      className={cn(
                        'text-[10px] font-medium',
                        banner.isActive
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-gray-400 text-white hover:bg-gray-500'
                      )}
                    >
                      {banner.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>

                  {/* Order Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-[10px] font-bold bg-white/90">
                      #{idx + 1}
                    </Badge>
                  </div>
                </div>

                {/* Card Body */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-[#1A1D29] text-sm line-clamp-1">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">{banner.subtitle}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn('text-[10px] gap-1', platformColor(banner.platform))}>
                      {platformIcon(banner.platform)}
                      {banner.platform === 'all' ? 'All Platforms' : banner.platform === 'web' ? 'Web Only' : 'Android Only'}
                    </Badge>
                    {banner.link && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <LinkIcon className="h-2.5 w-2.5" />
                        {banner.link}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMove(banner, 'up')}
                        disabled={idx === 0}
                        title="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMove(banner, 'down')}
                        disabled={idx === filteredBanners.length - 1}
                        title="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:text-blue-600"
                        onClick={() => handleOpenEdit(banner)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:text-red-600"
                        onClick={() => { setDeletingBanner(banner); setDeleteDialogOpen(true) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Create/Edit Banner Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-[#1B3B6F]" />
              </div>
              {editingBanner ? 'Edit Banner' : 'Add New Banner'}
            </DialogTitle>
            <DialogDescription>
              {editingBanner ? 'Update banner details and image' : 'Create a new banner for the homepage slider'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1" style={{ scrollbarWidth: 'thin' }}>
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Banner Image <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
                {imagePreview ? (
                  <div className="relative bg-gray-100" style={{ aspectRatio: `${cropPreset.w} / ${cropPreset.h}` }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {rawSrc && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setCropOpen(true) }}
                        >
                          <Crop className="h-3 w-3 mr-1" /> Re-crop
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
                          if (rawSrc) URL.revokeObjectURL(rawSrc)
                          setRawSrc(null)
                          setImageFile(null)
                          setImagePreview('')
                          setFormData(prev => ({ ...prev, imageUrl: '', imageId: '' }))
                        }}
                      >
                        <X className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-[#1A1D29]">Click to upload</p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      PNG, JPG up to 5MB · zoom &amp; crop to {cropPreset.label} for{' '}
                      {formData.platform === 'android' ? 'the app' : formData.platform === 'web' ? 'web' : 'all platforms'}
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Premium Auto Parts"
                  className="mt-1 h-9 text-sm"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-sm">Subtitle</Label>
                <Input
                  placeholder="e.g. Delivered to your doorstep"
                  className="mt-1 h-9 text-sm"
                  value={formData.subtitle}
                  onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                />
              </div>
            </div>

            {/* Link & CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Link URL</Label>
                <Input
                  placeholder="/shop or /service"
                  className="mt-1 h-9 text-sm"
                  value={formData.link}
                  onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-sm">CTA Button Text</Label>
                <Input
                  placeholder="Shop Now"
                  className="mt-1 h-9 text-sm"
                  value={formData.linkText}
                  onChange={e => setFormData(prev => ({ ...prev, linkText: e.target.value }))}
                />
              </div>
            </div>

            {/* Platform & Active */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, platform: val }))}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2"><Globe className="h-3 w-3" /> All Platforms</span>
                    </SelectItem>
                    <SelectItem value="web">
                      <span className="flex items-center gap-2"><Monitor className="h-3 w-3" /> Web Only</span>
                    </SelectItem>
                    <SelectItem value="android">
                      <span className="flex items-center gap-2"><Smartphone className="h-3 w-3" /> Android Only</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Status</Label>
                <Select
                  value={formData.isActive ? 'active' : 'hidden'}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, isActive: val === 'active' }))}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <span className="flex items-center gap-2"><Eye className="h-3 w-3 text-emerald-600" /> Active (Visible)</span>
                    </SelectItem>
                    <SelectItem value="hidden">
                      <span className="flex items-center gap-2"><EyeOff className="h-3 w-3 text-gray-400" /> Hidden</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 flex-shrink-0 gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
              onClick={handleSave}
              disabled={saving || !formData.title.trim() || (!formData.imageUrl && !imageFile)}
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {uploading ? 'Uploading...' : 'Saving...'}</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> {editingBanner ? 'Update Banner' : 'Create Banner'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Cropper Dialog ── */}
      <Dialog open={cropOpen} onOpenChange={(o) => { if (!cropping) setCropOpen(o) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-4 w-4" /> Crop banner — {cropPreset.label}
            </DialogTitle>
            <DialogDescription>
              Drag to reposition and use the slider to zoom. The image is cropped to the exact{' '}
              {formData.platform === 'android' ? 'app' : formData.platform === 'web' ? 'web' : 'all-platform'} banner size, so it fills the slot with no side gaps.
            </DialogDescription>
          </DialogHeader>

          <div className="relative w-full h-[320px] bg-neutral-900 rounded-md overflow-hidden">
            {rawSrc && (
              <Cropper
                image={rawSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropPreset.w / cropPreset.h}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="contain"
                showGrid
                restrictPosition
              />
            )}
          </div>

          <div className="flex items-center gap-3 px-1">
            <ZoomOut className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#FF6B35]"
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 text-gray-400 shrink-0" />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCropOpen(false)} disabled={cropping}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
              onClick={handleApplyCrop}
              disabled={cropping || !croppedAreaPixels}
            >
              {cropping ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cropping...</>
              ) : (
                <><Crop className="h-4 w-4 mr-2" /> Apply crop</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              Delete Banner
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingBanner?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingBanner?.imageUrl && (
            <div className="rounded-lg overflow-hidden border aspect-[16/7]">
              <img
                src={deletingBanner.imageUrl}
                alt={deletingBanner.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
