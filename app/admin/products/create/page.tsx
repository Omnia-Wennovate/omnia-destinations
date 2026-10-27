'use client'

import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { ProductForm } from '@/components/admin/product-form'

export default function AdminCreateProductPage() {
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
            Create Product
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Add a new product to the shop</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <ProductForm mode="create" />
      </div>
    </div>
  )
}
