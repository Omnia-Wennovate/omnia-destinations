'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, ImageIcon, X } from 'lucide-react'
import emailjs from '@emailjs/browser'
import { createNewsArticle, type CreateNewsData } from '@/lib/services/news.service'
import { getActiveSubscribers } from '@/lib/services/newsletter.service'
import { uploadTourMedia } from '@/lib/services/storage.service'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CreateNewsPage() {
  const router = useRouter()
  const { user } = useAuthStore()

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
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleTitleChange(value: string) {
    setTitle(value)
    setSlug(generateSlug(value))
  }

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

  async function handleSubmit(asStatus: 'draft' | 'published') {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!content.trim()) {
      setError('Content is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      const data: CreateNewsData = {
        title: title.trim(),
        slug: slug || generateSlug(title),
        shortDescription: shortDescription.trim(),
        content: content.trim(),
        category: category || 'Uncategorized',
        status: asStatus,
        featuredImage,
        publishDate: publishDate || new Date().toISOString().split('T')[0],
      }

      await createNewsArticle(data, user?.id || 'admin')

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

            // Build email body with short description + content + image
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
            setSuccess(`Article published and sent to ${sentCount} subscriber${sentCount !== 1 ? 's' : ''}.`)
          } else {
            setSuccess('Article published. No active subscribers to notify.')
          }
        } catch {
          setSuccess('Article published but failed to send some emails.')
        } finally {
          setSendingEmails(false)
        }
        // Wait briefly to show success message before redirecting
        setTimeout(() => router.push('/admin/news'), 2000)
      } else {
        router.push('/admin/news')
      }
    } catch {
      setError('Failed to create article')
    } finally {
      setSubmitting(false)
    }
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
          <h1 className="text-2xl font-bold text-foreground">Create Article</h1>
          <p className="text-muted-foreground">Write and publish a new news article</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={submitting || sendingEmails}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSubmit('published')} disabled={submitting || sendingEmails}>
            <Eye className="h-4 w-4 mr-2" />
            {sendingEmails ? `Sending (${sendProgress.sent}/${sendProgress.total})...` : 'Publish'}
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
                  placeholder="Enter article title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="article-url-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortDesc">Short Description</Label>
                <Textarea
                  id="shortDesc"
                  placeholder="Brief summary for article cards and SEO..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Full Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your article content here... (Supports markdown)"
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
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Badge
                    variant={status === 'draft' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setStatus('draft')}
                  >
                    Draft
                  </Badge>
                  <Badge
                    variant={status === 'published' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setStatus('published')}
                  >
                    Published
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
