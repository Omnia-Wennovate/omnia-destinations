'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  createPackage,
  uploadFeaturedImage,
  uploadGalleryImage,
  uploadVideo,
  removeGalleryImage,
  updatePackageStatus,
  getPackageById,
  validatePackageForPublish,
  type UploadProgress,
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

export default function CreatePackagePage() {
  const router = useRouter()
  const featuredImageRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [packageId, setPackageId] = useState<string | null>(null)
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
<<<<<<< HEAD

  const [availableFrom, setAvailableFrom] = useState('')
const [availableUntil, setAvailableUntil] = useState('')

=======
>>>>>>> 4c57566027f0d79a8001fe43943a3fa318651381
  const [includedServices, setIncludedServices] = useState<string[]>([''])
  const [excludedServices, setExcludedServices] = useState<string[]>([''])

  // Media state
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [videoURL, setVideoURL] = useState<string | null>(null)

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!packageId) {
      setSlug(generateSlug(value))
    }
  }

  const handleSaveDraft = async () => {
    if (!title || !slug) {
      setError('Title and slug are required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (packageId) {
        // Update existing draft
        const { updatePackage } = await import('@/lib/services/packages.service')
        await updatePackage(packageId, {
<<<<<<< HEAD
  title,
  slug,
  shortDescription,
  fullDescription: fullDescription || '',
  price: parseFloat(price) || 0,
  duration: parseInt(duration) || 0,
  location,
  category,
  availableFrom,
  availableUntil,
  includedServices: includedServices.filter(Boolean),
  excludedServices: excludedServices.filter(Boolean),
  status: 'draft',
})
      } else {
        // Create new draft
        const id = await createPackage({
  title,
  slug,
  shortDescription,
  fullDescription,
  price: parseFloat(price) || 0,
  duration: parseInt(duration) || 0,
  location,
  category,
  availableFrom,
  availableUntil,
  includedServices: includedServices.filter(Boolean),
  excludedServices: excludedServices.filter(Boolean),
  status: 'draft',
})
=======
          title,
          slug,
          shortDescription,
          fullDescription: fullDescription || '',
          price: parseFloat(price) || 0,
          duration: parseInt(duration) || 0,
          location,
          category,
          includedServices: includedServices.filter(Boolean),
          excludedServices: excludedServices.filter(Boolean),
          status: 'draft',
        })
      } else {
        // Create new draft
        const id = await createPackage({
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
          status: 'draft',
        })
>>>>>>> 4c57566027f0d79a8001fe43943a3fa318651381
        setPackageId(id)
      }
    } catch (err: any) {
      if (err.message === 'slug-exists') {
        setError('A package with this slug already exists. Please use a different slug.')
      } else {
        setError('Failed to save draft')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!packageId) {
      await handleSaveDraft()
    }

    if (!packageId) {
      setError('Please save as draft first')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get current package data
      const pkg = await getPackageById(packageId)
      if (!pkg) {
        setError('Package not found')
        return
      }

      // Validate
      const errors = validatePackageForPublish(pkg)
      if (errors.length > 0) {
        setError(errors.join(', '))
        return
      }

      await updatePackageStatus(packageId, 'published')
      router.push('/admin/packages')
    } catch (err) {
      setError('Failed to publish package')
    } finally {
      setLoading(false)
    }
  }

const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (!packageId) {
    setError('Please save the package as draft first')
    return
  }

  try {
    setError(null)

    const url = await uploadFeaturedImage(file, packageId, setUploadProgress)

    if (!url) {
      throw new Error('No image URL returned')
    }

    setFeaturedImage(url)
  } catch (err) {
    console.error(err)
    setError('Featured image upload failed')
  } finally {
    setUploadProgress(null)
  }
}

const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  if (!files || files.length === 0) return

  if (!packageId) {
    setError('Please save as draft first before uploading images')
    return
  }

  try {
    setError(null)

    for (const file of Array.from(files)) {
      const url = await uploadGalleryImage(file, packageId, setUploadProgress)

      setGalleryImages((prev) => [...prev, url])

      // ✅ If featured image does not exist, save the first gallery image as featured
      if (!featuredImage) {
        setFeaturedImage(url)

        const { updatePackage } = await import('@/lib/services/packages.service')

        await updatePackage(packageId, {
          featuredImageURL: url,
        })
      }
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

    if (!packageId) {
      setError('Please save as draft first before uploading video')
      return
    }

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
    if (!packageId) return

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
            <h1 className="text-2xl font-bold">Create Package</h1>
            <p className="text-muted-foreground">Add a new travel package</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publish
          </Button>
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
                  onChange={(e) => handleTitleChange(e.target.value)}
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

<<<<<<< HEAD
<div className="space-y-2">
  <Label htmlFor="availableFrom">Available From *</Label>
  <Input
    id="availableFrom"
    type="date"
    value={availableFrom}
    onChange={(e) => setAvailableFrom(e.target.value)}
  />
</div>

<div className="space-y-2">
  <Label htmlFor="availableUntil">Available Until *</Label>
  <Input
    id="availableUntil"
    type="date"
    value={availableUntil}
    onChange={(e) => setAvailableUntil(e.target.value)}
  />
</div>

=======
>>>>>>> 4c57566027f0d79a8001fe43943a3fa318651381
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

          {packageId && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Package ID: <code className="text-xs">{packageId}</code>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
