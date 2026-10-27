'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, Package, X, CheckCircle, FileText, Send } from 'lucide-react'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/services/products.service'

interface ProductFormProps {
  initialData?: Partial<Product>
  productId?: string
  mode: 'create' | 'edit'
}

/**
 * Upload product image via the server-side Admin SDK API.
 * This bypasses Firebase Storage security rules entirely.
 */
async function uploadProductImage(file: File, productId: string, idToken: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productId', productId)

  const res = await fetch('/api/admin/products/upload-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Image upload failed')
  return data.url as string
}

const MAX_IMAGES = 3

// An image already saved (url) or picked locally and not yet uploaded (file + preview url).
type ImageItem = { url: string; file?: File }

function initialImages(data?: Partial<Product>): ImageItem[] {
  const urls = data?.images?.length ? data.images : data?.imageURL ? [data.imageURL] : []
  return urls.slice(0, MAX_IMAGES).map((url) => ({ url }))
}

export function ProductForm({ initialData, productId, mode }: ProductFormProps) {
  const router = useRouter()

  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [price, setPrice] = useState(String(initialData?.price ?? ''))
  const [stock, setStock] = useState(String(initialData?.stock ?? ''))
  const initialStatus = initialData?.status ?? 'unpublished'
  const [images, setImages] = useState<ImageItem[]>(() => initialImages(initialData))
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [savingAs, setSavingAs] = useState<'published' | 'unpublished' | null>(null)
  const saving = savingAs !== null
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    if (files.some((f) => f.size > 10 * 1024 * 1024)) {
      setError('Each image must be under 10 MB')
      return
    }
    const room = MAX_IMAGES - images.length
    const added = files.slice(0, room).map((file) => ({ url: URL.createObjectURL(file), file }))
    setImages((prev) => [...prev, ...added])
    setError(files.length > room ? `Only ${MAX_IMAGES} images allowed — extra files were skipped.` : '')
  }

  const addImageUrl = () => {
    const url = urlInput.trim()
    if (!url || images.length >= MAX_IMAGES) return
    if (!/^https?:\/\//i.test(url)) return setError('Image URL must start with http:// or https://')
    if (images.some((img) => img.url === url)) return setError('That image is already added.')
    setImages((prev) => [...prev, { url }])
    setUrlInput('')
    setError('')
  }

  const removeImage = (index: number) => {
    const img = images[index]
    if (img.file) URL.revokeObjectURL(img.url)
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const makeCover = (index: number) => {
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)])
  }

  // Uploads any locally picked files and returns all image URLs in display order.
  const resolveImages = (list: ImageItem[], id: string, idToken: string) =>
    Promise.all(list.map((img) => (img.file ? uploadProductImage(img.file, id, idToken) : img.url)))

  // Drafts only need a name; publishing needs a valid price and stock.
  const save = async (status: 'published' | 'unpublished') => {
    setError('')

    if (!name.trim()) return setError('Product name is required.')
    if (status === 'published') {
      if (!price || isNaN(Number(price)) || Number(price) <= 0) return setError('A valid price is required to publish.')
      if (!stock || isNaN(Number(stock)) || Number(stock) < 0) return setError('Valid stock is required to publish.')
    } else {
      if (price.trim() && (isNaN(Number(price)) || Number(price) < 0)) return setError('Price must be 0 or more.')
      if (stock.trim() && (isNaN(Number(stock)) || Number(stock) < 0)) return setError('Stock must be 0 or more.')
    }

    setSavingAs(status)
    try {
      // Get a fresh ID token to authenticate the API call
      const auth = await getFirebaseAuth()
      if (!auth?.currentUser) throw new Error('Not authenticated')
      const idToken = await auth.currentUser.getIdToken()

      // Include a typed-but-not-added URL so it isn't silently dropped
      const pendingUrl = urlInput.trim()
      const imageList = pendingUrl && images.length < MAX_IMAGES && !images.some((img) => img.url === pendingUrl)
        ? [...images, { url: pendingUrl }]
        : images
      const hasFiles = imageList.some((img) => img.file)

      if (mode === 'create') {
        // 1. Create the product doc via API (gets us an ID)
        const createRes = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: Number(price) || 0,
            stock: Number(stock) || 0,
            status,
            images: hasFiles ? [] : imageList.map((img) => img.url),
          }),
        })

        const createData = await createRes.json()
        if (!createRes.ok) throw new Error(createData.message || 'Failed to create product')

        const newId: string = createData.id

        // 2. Upload images via server-side API (Admin SDK — no storage rules needed)
        if (hasFiles) {
          setUploading(true)
          const finalImages = await resolveImages(imageList, newId, idToken)
          setUploading(false)

          // 3. Update the doc with the image URLs via API
          const patchRes = await fetch(`/api/admin/products/${newId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ images: finalImages }),
          })
          if (!patchRes.ok) throw new Error('Product created, but saving its images failed. Edit the product to add them again.')
        }

        setSuccessMsg(status === 'published' ? 'Product published successfully!' : 'Product saved as draft!')
        setTimeout(() => router.push('/admin/products'), 1500)

      } else if (mode === 'edit' && productId) {
        // Upload any newly selected images first
        if (hasFiles) setUploading(true)
        const finalImages = await resolveImages(imageList, productId, idToken)
        setUploading(false)

        const updateRes = await fetch(`/api/admin/products/${productId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: Number(price) || 0,
            stock: Number(stock) || 0,
            status,
            images: finalImages,
          }),
        })

        const updateData = await updateRes.json()
        if (!updateRes.ok) throw new Error(updateData.message || 'Failed to update product')

        setSuccessMsg(status === 'published' ? 'Product updated successfully!' : 'Product saved as draft!')
        setTimeout(() => router.push('/admin/products'), 1500)
      }
    } catch (err: any) {
      console.error('[ProductForm] Error saving product:', err)
      setError(err?.message || 'Failed to save product. Please try again.')
      setUploading(false)
    } finally {
      setSavingAs(null)
    }
  }

  if (successMsg) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <p className="text-xl font-bold text-foreground">{successMsg}</p>
        <p className="text-muted-foreground">Redirecting to products list…</p>
      </div>
    )
  }

  return (
    // Saving happens through the Draft/Publish buttons only, so Enter never publishes by accident
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6 max-w-2xl">
      {/* Images (up to 3) */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Product Images <span className="font-normal text-muted-foreground">({images.length}/{MAX_IMAGES})</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div key={img.url} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted">
              <img src={img.url} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 ? (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  Set as cover
                </button>
              )}
              <button
                type="button"
                aria-label={`Remove image ${i + 1}`}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                onClick={() => removeImage(i)}
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors bg-muted/20 hover:bg-muted/30 p-3"
            >
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-primary text-center">Add image</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />
        <p className="text-xs text-muted-foreground mt-2">
          JPG, PNG, WebP · Max 10 MB each. The cover image is shown first on the product card.
        </p>

        {/* Or use URL */}
        {images.length < MAX_IMAGES && (
          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1" htmlFor="product-image-url">Or add image URL</label>
            <div className="flex gap-2">
              <input
                id="product-image-url"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addImageUrl()
                  }
                }}
                placeholder="https://..."
                className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button type="button" variant="outline" className="h-9 bg-transparent" onClick={addImageUrl} disabled={!urlInput.trim()}>
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2" htmlFor="product-name">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          id="product-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Omnia Travel Backpack"
          required
          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2" htmlFor="product-desc">
          Description
        </label>
        <textarea
          id="product-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the product…"
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
        />
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2" htmlFor="product-price">
            Price (ETB) <span className="text-red-500">*</span>
          </label>
          <input
            id="product-price"
            type="number"
            min="1"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 2500"
            required
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          {price && !isNaN(Number(price)) && Number(price) > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Deposit: {Math.round(Number(price) * 0.1).toLocaleString()} ETB (10%)
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2" htmlFor="product-stock">
            Stock <span className="text-red-500">*</span>
          </label>
          <input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="e.g. 50"
            required
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>
      </div>

      {/* Status note */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border text-sm text-muted-foreground">
        <span className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${initialStatus === 'published' && mode === 'edit' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
        <p>
          {mode === 'edit' && (
            <strong className="text-foreground">
              {initialStatus === 'published' ? 'Published — visible in the shop. ' : 'Draft — hidden from the shop. '}
            </strong>
          )}
          Drafts only need a name and stay hidden from customers. Price and stock are required to publish.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="sm:flex-1 bg-transparent"
          onClick={() => router.push('/admin/products')}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          className="sm:flex-1 gap-2 bg-transparent"
          onClick={() => save('unpublished')}
          disabled={saving || uploading}
        >
          {savingAs === 'unpublished' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploading ? 'Uploading images…' : 'Saving…'}
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              {mode === 'edit' && initialStatus === 'published' ? 'Move to Draft' : 'Save as Draft'}
            </>
          )}
        </Button>
        <Button
          type="button"
          className="sm:flex-1 gap-2"
          onClick={() => save('published')}
          disabled={saving || uploading}
        >
          {savingAs === 'published' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploading ? 'Uploading images…' : 'Saving…'}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {mode === 'create' ? 'Publish Product' : initialStatus === 'published' ? 'Save Changes' : 'Publish'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
