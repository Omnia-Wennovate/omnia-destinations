'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, EyeOff, ImageIcon, X } from 'lucide-react'
import emailjs from '@emailjs/browser'
import {
  getNewsById,
  updateNewsArticle,
  type CreateNewsData,
} from '@/lib/services/news.service'
import { getActiveSubscribers } from '@/lib/services/newsletter.service'
import { uploadTourMedia } from '@/lib/services/storage.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = [
  'Travel Tips',
  'Destination Guide',
  'Culture',
  'Adventure',
  'Food & Drink',
  'News',
  'Company Updates',
]

export default function EditNewsPage() {
  const router = useRouter()
  const params = useParams()
  const newsId = params.id as string

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [publishDate, setPublishDate] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | false>(false)

  useEffect(() => {
    async function fetchArticle() {
      try {
        const article = await getNewsById(newsId)
        if (!article) {
          setNotFound(true)
          return
        }
        setTitle(article.title || '')
        setSlug(article.slug || '')
        setShortDescription(article.shortDescription || '')
        setContent(article.content || '')
        setCategory(article.category || '')
        setStatus(article.status || 'draft')
        setPublishDate(article.publishDate || '')
        setFeaturedImage(article.featuredImage || '')
      } catch {
        setError('Failed to load article')
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [newsId])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const urls = await uploadTourMedia('news-images', [file], () => {})
      if (urls.length > 0) {
        setFeaturedImage(urls[0])
      }
    } catch {
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(asStatus?: 'draft' | 'published') {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(false)

      const data: Partial<CreateNewsData> = {
        title: title.trim(),
        slug,
        shortDescription: shortDescription.trim(),
        content: content.trim(),
        category: category || 'Uncategorized',
        status: asStatus || status,
        featuredImage,
        publishDate,
      }

      await updateNewsArticle(newsId, data)
      if (asStatus) setStatus(asStatus)

      // If publishing, send newsletter emails to all active subscribers
      if (asStatus === 'published') {
        setSendingEmails(true)
        try {
          const subscribers = await getActiveSubscribers()
          if (subscribers.length > 0) {
            setSendProgress({ sent: 0, total: subscribers.length })
            const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!
            const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!
            const publicId = process.env.NEXT_PUBLIC_EMAILJS_USER!
            const batchSize = 5
            let sentCount = 0

            const emailBody = [
              shortDescription.trim() ? shortDescription.trim() : '',
              featuredImage ? `\n\n[Featured Image: ${featuredImage}]` : '',
              `\n\n${content.trim()}`,
            ].filter(Boolean).join('')

            for (let i = 0; i < subscribers.length; i += batchSize) {
              const batch = subscribers.slice(i, i + batchSize)
              await Promise.all(
                batch.map((sub) =>
                  emailjs
                    .send(serviceId, templateId, {
                      to_email: sub.email,
                      subject: title.trim(),
                      message: emailBody,
                      from_name: 'OMNIA Travel',
                    }, publicId)
                    .then(() => {
                      sentCount++
                      setSendProgress({ sent: sentCount, total: subscribers.length })
                    })
                    .catch(() => {})
                )
              )
              if (i + batchSize < subscribers.length) {
                await new Promise((r) => setTimeout(r, 1000))
              }
            }
            setSuccess(`Published and sent to ${sentCount} subscriber${sentCount !== 1 ? 's' : ''}.`)
          } else {
            setSuccess('Published. No active subscribers to notify.')
          }
        } catch {
          setSuccess('Published but failed to send some emails.')
        } finally {
          setSendingEmails(false)
        }
      } else {
        setSuccess('Article updated successfully.')
      }
      setTimeout(() => setSuccess(false), 5000)
    } catch {
      setError('Failed to update article')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold text-foreground">Article Not Found</h2>
        <p className="text-muted-foreground mt-2">This article does not exist or has been deleted.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/news">Back to News</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/news">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Edit Article</h1>
          <p className="text-muted-foreground">Modify and update the article</p>
        </div>
        <div className="flex items-center gap-2">
          {status === 'published' ? (
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={submitting || sendingEmails}
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Unpublish
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleSubmit('published')}
              disabled={submitting || sendingEmails}
            >
              <Eye className="h-4 w-4 mr-2" />
              {sendingEmails ? `Sending (${sendProgress.sent}/${sendProgress.total})...` : 'Publish'}
            </Button>
          )}
          <Button onClick={() => handleSubmit()} disabled={submitting || sendingEmails}>
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-200 text-emerald-700 text-sm">
          {success}
        </div>
      )}
      {sendingEmails && (
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
            Sending newsletter to subscribers... ({sendProgress.sent}/{sendProgress.total})
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: sendProgress.total > 0 ? `${(sendProgress.sent / sendProgress.total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Article Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortDesc">Short Description</Label>
                <Textarea
                  id="shortDesc"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Full Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={16}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              {featuredImage ? (
                <div className="relative group">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage('')}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? 'Uploading...' : 'Click to upload'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Publish Date</Label>
                <Input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Status</Label>
                <Badge
                  variant={status === 'published' ? 'default' : 'secondary'}
                  className={
                    status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                      : ''
                  }
                >
                  {status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
