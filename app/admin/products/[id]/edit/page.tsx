'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react'
import { ProductForm } from '@/components/admin/product-form'
import { getFirebaseAuth } from '@/lib/firebase/config'
import type { Product } from '@/lib/services/products.service'

// Loads via the admin API (Admin SDK) so drafts load regardless of Firestore rules.
async function getProductAdmin(productId: string): Promise<Product | null> {
  const auth = await getFirebaseAuth()
  if (!auth?.currentUser) return null
  const token = await auth.currentUser.getIdToken()

  const res = await fetch(`/api/admin/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return (data.product ?? null) as Product | null
}

export default function AdminEditProductPage() {
  // Next 16 passes page params as a Promise; useParams reads them synchronously
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    getProductAdmin(id)
      .then((p) => {
        if (p) setProduct(p)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/products"
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Edit Product
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Update product details</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notFound ? (
          <div className="text-center py-16">
            <p className="text-foreground font-semibold">Product not found</p>
            <Link href="/admin/products" className="text-sm text-primary hover:underline mt-2 block">
              Back to products
            </Link>
          </div>
        ) : product ? (
          <ProductForm
            mode="edit"
            productId={product.id}
            initialData={product}
          />
        ) : null}
      </div>
    </div>
  )
}
