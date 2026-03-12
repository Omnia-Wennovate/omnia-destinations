'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Loader2,
  AlertCircle,
  ImageIcon,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  getPackageById,
  updatePackage,
  uploadFeaturedImage,
  uploadGalleryImage,
  uploadVideo,
  removeGalleryImage,
  updatePackageStatus,
  validatePackageForPublish,
  type UploadProgress,
  type PackageData,
} from '@/lib/services/packages.service'

const categories = [
  'Beach & Island',
  'Adventure',
  'Cultural',
  'City Break',
  'Safari',
  'Cruise',
  'Honeymoon',
  'Family',
  'Luxury',
  'Budget',
]

export default function EditPackagePage() {
  const router = useRouter()
  const params = useParams()
  const packageId = params.id as string

  const featuredImageRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [includedServices, setIncludedServices] = useState<string[]>([''])
  const [excludedServices, setExcludedServices] = useState<string[]>([''])
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  // Media state
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [videoURL, setVideoURL] = useState<string | null>(null)

  const loadPackage = useCallback(async () => {
    try {
      setLoading(true)
      const pkg = await getPackageById(packageId)
      if (!pkg) {
        setError('Package not found')
        return
      }

      setTitle(pkg.title)
      setSlug(pkg.slug)
      setShortDescription(pkg.shortDescription)
      setFullDescription(pkg.fullDescription)
      setPrice(pkg.price.toString())
      setDuration(pkg.duration.toString())
      setLocation(pkg.location)
      setCategory(pkg.category)
      setIncludedServices(pkg.includedServices.length > 0 ? pkg.includedServices : [''])
      setExcludedServices(pkg.excludedServices.length > 0 ? pkg.excludedServices : [''])
      setStatus(pkg.status)
      setFeaturedImage(pkg.featuredImageURL || null)
      setGalleryImages(pkg.galleryImageURLs || [])
      setVideoURL(pkg.videoURL || null)
    } catch (err) {
      setError('Failed to load package')
    } finally {
      setLoading(false)
    }
  }, [packageId])

  useEffect(() => {
    loadPackage()
  }, [loadPackage])

  const handleSave = async () => {
    if (!title || !slug) {
      setError('Title and slug are required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      await updatePackage(packageId, {
        title,
        slug,
        shortDescription,
        fullDescription,
        price: parseFloat(price) || 0,
        duration: parseInt(duration) || 0,
        location,
        category,
        includedServices: includedServices.filter(Boolean),
        excludedServices: excludedServices.filter(Boolean),
        status,
      })

      router.push('/admin/packages')
    } catch (err: any) {
      if (err.message === 'slug-exists') {
        setError('A package with this slug already exists. Please use a different slug.')
      } else {
        setError('Failed to save package')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      setSaving(true)
      setError(null)

      // Get current package data
      const pkg = await getPackageById(packageId)
      if (!pkg) {
        setError('Package not found')
        return
      }

      // Update with current form data
      const updatedPkg: PackageData = {
        ...pkg,
        title,
        slug,
        shortDescription,
        fullDescription,
        price: parseFloat(price) || 0,
        duration: parseInt(duration) || 0,
        location,
        category,
        includedServices: includedServices.filter(Boolean),
        excludedServices: excludedServices.filter(Boolean),
        featuredImageURL: featuredImage || '',
      }

      // Validate
      const errors = validatePackageForPublish(updatedPkg)
      if (errors.length > 0) {
        setError(errors.join(', '))
        return
      }

      await updatePackage(packageId, {
        title,
        slug,
        shortDescription,
        fullDescription,
        price: parseFloat(price) || 0,
        duration: parseInt(duration) || 0,
        location,
        category,
        includedServices: includedServices.filter(Boolean),
        excludedServices: excludedServices.filter(Boolean),
        status: 'published',
      })

      await updatePackageStatus(packageId, 'published')
      router.push('/admin/packages')
    } catch (err) {
      setError('Failed to publish package')
    } finally {
      setSaving(false)
    }
  }

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      const url = await uploadFeaturedImage(file, packageId, setUploadProgress)
      setFeaturedImage(url)
      setUploadProgress(null)
    } catch (err) {
      setError('Failed to upload featured image')
      setUploadProgress(null)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setError(null)
      for (const file of Array.from(files)) {
        const url = await uploadGalleryImage(file, packageId, setUploadProgress)
        setGalleryImages((prev) => [...prev, url])
      }
      setUploadProgress(null)
    } catch (err) {
      setError('Failed to upload gallery image')
      setUploadProgress(null)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      const url = await uploadVideo(file, packageId, setUploadProgress)
      setVideoURL(url)
      setUploadProgress(null)
    } catch (err) {
      setError('Failed to upload video')
      setUploadProgress(null)
    }
  }

  const handleRemoveGalleryImage = async (url: string) => {
    try {
      await removeGalleryImage(packageId, url)
      setGalleryImages((prev) => prev.filter((img) => img !== url))
    } catch (err) {
      setError('Failed to remove image')
    }
  }

  const addService = (type: 'included' | 'excluded') => {
    if (type === 'included') {
      setIncludedServices([...includedServices, ''])
    } else {
      setExcludedServices([...excludedServices, ''])
    }
  }

  const removeService = (type: 'included' | 'excluded', index: number) => {
    if (type === 'included') {
      setIncludedServices(includedServices.filter((_, i) => i !== index))
    } else {
      setExcludedServices(excludedServices.filter((_, i) => i !== index))
    }
  }

  const updateService = (type: 'included' | 'excluded', index: number, value: string) => {
    if (type === 'included') {
      const updated = [...includedServices]
      updated[index] = value
      setIncludedServices(updated)
    } else {
      const updated = [...excludedServices]
      updated[index] = value
      setExcludedServices(updated)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/packages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Package</h1>
            <p className="text-muted-foreground">Update package details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save
          </Button>
          {status !== 'published' && (
            <Button onClick={handlePublish} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Publish
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {uploadProgress && uploadProgress.status === 'uploading' && (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm mb-2">Uploading {uploadProgress.fileName}...</p>
          <Progress value={uploadProgress.progress} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Maldives Paradise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., maldives-paradise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description *</Label>
                <Textarea
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief description for listings..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDescription">Full Description *</Label>
                <Textarea
                  id="fullDescription"
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Detailed description..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Included Services</Label>
                {includedServices.map((service, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={service}
                      onChange={(e) => updateService('included', index, e.target.value)}
                      placeholder="e.g., Airport transfers"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeService('included', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addService('included')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>

              <div className="space-y-3">
                <Label>Excluded Services</Label>
                {excludedServices.map((service, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={service}
                      onChange={(e) => updateService('excluded', index, e.target.value)}
                      placeholder="e.g., Travel insurance"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeService('excluded', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addService('excluded')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Featured Image */}
              <div className="space-y-3">
                <Label>Featured Image *</Label>
                <input
                  ref={featuredImageRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageUpload}
                  className="hidden"
                />
                {featuredImage ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={featuredImage}
                      alt="Featured"
                      fill
                      className="object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFeaturedImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => featuredImageRef.current?.click()}
                    className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
                  >
                    <ImageIcon className="h-10 w-10" />
                    <span>Click to upload featured image</span>
                  </button>
                )}
              </div>

              {/* Gallery */}
              <div className="space-y-3">
                <Label>Gallery Images</Label>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
                <div className="grid grid-cols-3 gap-4">
                  {galleryImages.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => handleRemoveGalleryImage(url)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Add</span>
                  </button>
                </div>
              </div>

              {/* Video */}
              <div className="space-y-3">
                <Label>Video (Optional)</Label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                {videoURL ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <video
                      src={videoURL}
                      controls
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setVideoURL(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
                  >
                    <Video className="h-10 w-10" />
                    <span>Click to upload video</span>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Maldives"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium capitalize">{status}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Package ID: <code className="text-xs">{packageId}</code>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
