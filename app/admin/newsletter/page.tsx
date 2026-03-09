'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Mail,
  Send,
  Save,
  Trash2,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  Edit3,
} from 'lucide-react'
import {
  getNewsletters,
  saveNewsletterDraft,
  updateNewsletter,
  deleteNewsletter,
  publishNewsletter,
  getActiveSubscribers,
  getAllSubscribers,
  type Newsletter,
} from '@/lib/services/newsletter.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type StatusMessage = {
  type: 'success' | 'error' | 'info'
  text: string
} | null

export default function AdminNewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusMessage>(null)

  // Compose form
  const [showCompose, setShowCompose] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState({ sent: 0, total: 0 })

  // Preview
  const [previewNewsletter, setPreviewNewsletter] = useState<Newsletter | null>(null)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setStatus(null)
      const [nl, subs] = await Promise.all([getNewsletters(), getActiveSubscribers()])
      setNewsletters(nl)
      setSubscriberCount(subs.length)
    } catch (err: any) {
      console.log('[v0] fetchData error:', err?.code, err?.message, err)
      setStatus({ type: 'error', text: 'Failed to load data. Check Firestore permissions.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (status) {
      const t = setTimeout(() => setStatus(null), 5000)
      return () => clearTimeout(t)
    }
  }, [status])

  const resetForm = () => {
    setTitle('')
    setSubject('')
    setContent('')
    setEditingId(null)
    setShowCompose(false)
  }

  const handleSaveDraft = async () => {
    if (!title.trim() || !subject.trim() || !content.trim()) {
      setStatus({ type: 'error', text: 'Please fill in all fields.' })
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateNewsletter(editingId, { title, subject, content })
        setStatus({ type: 'success', text: 'Draft updated successfully.' })
      } else {
        await saveNewsletterDraft({ title, subject, content })
        setStatus({ type: 'success', text: 'Draft saved successfully.' })
      }
      resetForm()
      await fetchData()
    } catch {
      setStatus({ type: 'error', text: 'Failed to save draft.' })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!subject.trim() || !content.trim()) {
      setStatus({ type: 'error', text: 'Subject and content are required to publish.' })
      return
    }
    if (subscriberCount === 0) {
      setStatus({ type: 'error', text: 'No active subscribers to send to.' })
      return
    }

    setPublishing(true)
    setPublishProgress({ sent: 0, total: subscriberCount })

    try {
      let docId = editingId
      if (!docId) {
        docId = await saveNewsletterDraft({ title: title || subject, subject, content })
      } else {
        await updateNewsletter(docId, { title, subject, content })
      }

      const sentCount = await publishNewsletter(
        docId,
        subject,
        content,
        (sent, total) => setPublishProgress({ sent, total })
      )

      setStatus({
        type: 'success',
        text: `Newsletter published! Sent to ${sentCount} of ${subscriberCount} subscribers.`,
      })
      resetForm()
      await fetchData()
    } catch (err: any) {
      console.log('[v0] Publish error:', err?.code, err?.message, err)
      if (err?.message === 'no-subscribers') {
        setStatus({ type: 'error', text: 'No active subscribers found.' })
      } else if (err?.message === 'EmailJS configuration missing') {
        setStatus({ type: 'error', text: 'EmailJS not configured. Set NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, and NEXT_PUBLIC_EMAILJS_USER.' })
      } else if (err?.code === 'permission-denied') {
        setStatus({ type: 'error', text: 'Firestore permission denied. Check your security rules.' })
      } else {
        setStatus({ type: 'error', text: `Failed to publish: ${err?.message || 'Unknown error'}` })
      }
    } finally {
      setPublishing(false)
      setPublishProgress({ sent: 0, total: 0 })
    }
  }

  const handleEdit = (nl: Newsletter) => {
    setEditingId(nl.id)
    setTitle(nl.title)
    setSubject(nl.subject)
    setContent(nl.content)
    setShowCompose(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteNewsletter(deleteId)
      setStatus({ type: 'success', text: 'Newsletter deleted.' })
      setDeleteId(null)
      await fetchData()
    } catch {
      setStatus({ type: 'error', text: 'Failed to delete newsletter.' })
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (ts: any) => {
    if (!ts) return '-'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Newsletter Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage and send newsletters to your subscribers.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowCompose(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Compose Newsletter
        </Button>
      </div>

      {/* Status message */}
      {status && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            status.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
              : status.type === 'error'
              ? 'bg-destructive/10 border border-destructive/20 text-destructive'
              : 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {status.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Active Subscribers</span>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{subscriberCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Total Newsletters</span>
              <div className="p-2 rounded-lg bg-violet-500/10">
                <FileText className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{newsletters.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Published</span>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Send className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {newsletters.filter((n) => n.status === 'published').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compose Form */}
      {showCompose && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? 'Edit Newsletter' : 'Compose Newsletter'}
            </CardTitle>
            <CardDescription>
              {editingId ? 'Update your newsletter draft.' : 'Create a new newsletter to send to subscribers.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nl-title">Title (internal)</Label>
              <Input
                id="nl-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. February 2026 Update"
                disabled={publishing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl-subject">Email Subject</Label>
              <Input
                id="nl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Exciting new destinations this month!"
                disabled={publishing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl-content">Content</Label>
              <textarea
                id="nl-content"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your newsletter content here..."
                disabled={publishing}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[120px]"
              />
            </div>

            {/* Publishing progress */}
            {publishing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending emails... {publishProgress.sent} of {publishProgress.total}
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${publishProgress.total > 0 ? (publishProgress.sent / publishProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || publishing}
                className="gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishing || saving || !subject.trim() || !content.trim()}
                className="gap-2"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {publishing ? 'Publishing...' : `Publish & Send (${subscriberCount} subscribers)`}
              </Button>
              <Button variant="ghost" onClick={resetForm} disabled={publishing}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Newsletters Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">All Newsletters</CardTitle>
          <CardDescription>
            {newsletters.length} newsletter{newsletters.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {newsletters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No newsletters yet</p>
              <p className="text-sm mt-1">Click &quot;Compose Newsletter&quot; to create your first one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium py-3 pr-4">Title</th>
                    <th className="text-left font-medium py-3 pr-4">Subject</th>
                    <th className="text-left font-medium py-3 pr-4">Status</th>
                    <th className="text-left font-medium py-3 pr-4">Sent</th>
                    <th className="text-left font-medium py-3 pr-4">Date</th>
                    <th className="text-right font-medium py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {newsletters.map((nl) => (
                    <tr key={nl.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium text-foreground max-w-[200px] truncate">
                        {nl.title}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate">
                        {nl.subject}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            nl.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {nl.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {nl.totalSent != null ? nl.totalSent : '-'}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(nl.publishedAt || nl.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewNewsletter(nl)}
                            className="h-8 w-8 p-0"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {nl.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(nl)}
                              className="h-8 w-8 p-0"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(nl.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewNewsletter} onOpenChange={() => setPreviewNewsletter(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewNewsletter?.title}</DialogTitle>
            <DialogDescription>Subject: {previewNewsletter?.subject}</DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground text-sm leading-relaxed border-t border-border pt-4">
            {previewNewsletter?.content}
          </div>
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Status: {previewNewsletter?.status} | Sent to: {previewNewsletter?.totalSent ?? '-'} |{' '}
            {formatDate(previewNewsletter?.publishedAt || previewNewsletter?.createdAt)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Newsletter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this newsletter? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
