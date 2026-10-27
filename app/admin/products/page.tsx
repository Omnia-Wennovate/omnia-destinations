'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Package, Loader2,
  ShoppingBag, AlertTriangle,
} from 'lucide-react'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import type { Product } from '@/lib/services/products.service'


async function getAllProductsAdmin(): Promise<Product[]> {
  try {
    const auth = await getFirebaseAuth()
    if (!auth?.currentUser) return []
    const token = await auth.currentUser.getIdToken()

    const res = await fetch('/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.products ?? []) as Product[]
  } catch (err) {
    console.error('[admin/products] Error fetching products:', err)
    return []
  }
}


async function getIdToken(): Promise<string> {
  const auth = await getFirebaseAuth()
  if (!auth?.currentUser) throw new Error('Not authenticated')
  return auth.currentUser.getIdToken()
}

async function toggleProductStatus(productId: string, newStatus: 'published' | 'unpublished') {
  const token = await getIdToken()
  const res = await fetch(`/api/admin/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: newStatus }),
  })
  if (!res.ok) {
    const d = await res.json()
    throw new Error(d.message || 'Failed to update status')
  }
}

async function deleteProduct(productId: string) {
  const token = await getIdToken()
  const res = await fetch(`/api/admin/products/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const d = await res.json()
    throw new Error(d.message || 'Failed to delete product')
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    getAllProductsAdmin()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'published' ? 'unpublished' : 'published'
    setActionId(product.id)
    try {
      await toggleProductStatus(product.id, newStatus)
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
      )
    } catch (err: any) {
      console.error('Toggle status error:', err)
      toast({
        title: newStatus === 'published' ? 'Could not publish' : 'Could not unpublish',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (productId: string) => {
    setActionId(productId)
    try {
      await deleteProduct(productId)
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Delete product error:', err)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your shop products, pricing and stock
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/products/orders">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Package className="h-4 w-4" />
              View Orders
            </Button>
          </Link>
          <Link href="/admin/products/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Delete Product?</p>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionId === deleteConfirm}
              >
                {actionId === deleteConfirm ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-foreground font-semibold">No products yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first product to get started.</p>
            <Link href="/admin/products/create">
              <Button className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Create Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Price (ETB)</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Stock</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageURL ? (
                        <img
                          src={product.imageURL}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-bold text-foreground">{product.price.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-sm font-semibold ${product.stock <= 0 ? 'text-red-500' : product.stock <= 5 ? 'text-amber-500' : 'text-foreground'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {product.status === 'published' ? '● Published' : '○ Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Toggle publish */}
                      <button
                        onClick={() => handleToggleStatus(product)}
                        disabled={actionId === product.id}
                        className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50"
                        title={product.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {actionId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : product.status === 'published' ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {/* Edit */}
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <button className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors" title="Edit">
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
