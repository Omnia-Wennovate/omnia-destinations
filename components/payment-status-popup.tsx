'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'

function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const paymentStatus = searchParams?.get('payment')
  
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (paymentStatus === 'success' || paymentStatus === 'failed') {
      setOpen(true)
    }
  }, [paymentStatus])

  const handleClose = () => {
    setOpen(false)
    // Clean up url params
    if (paymentStatus) {
      const newSearchParams = new URLSearchParams(searchParams?.toString() || '')
      newSearchParams.delete('payment')
      const newUrl = pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '')
      router.replace(newUrl, { scroll: false })
    }
  }

  // Auto-close on success
  useEffect(() => {
    if (open && paymentStatus === 'success') {
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [open, paymentStatus])

  // Required since we only want to render logic if there's a param
  // It handles exiting animation state slightly so we keep the component mounted
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md text-center flex flex-col items-center justify-center p-8 py-10 border-0 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl bg-background/95 backdrop-blur-xl">
        <DialogTitle className="sr-only">
          {paymentStatus === 'success' ? 'Payment Successful' : 'Payment Failed'}
        </DialogTitle>

        {paymentStatus === 'success' ? (
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50 dark:ring-green-900/20">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" strokeWidth={2.5} />
          </div>
        ) : (
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50 dark:ring-red-900/20">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" strokeWidth={2.5} />
          </div>
        )}

        <h2 className="text-2xl font-bold text-foreground mb-3 font-sans">
          {paymentStatus === 'success' ? 'Payment Successful' : 'Payment Failed'}
        </h2>
        
        <p className="text-muted-foreground mb-8 text-[15px] px-2 leading-relaxed">
          {paymentStatus === 'success' 
            ? 'Your booking has been successfully completed. An email confirmation has been sent to you.' 
            : 'Your payment could not be completed. Please try again or contact support.'}
        </p>

        <div className="flex gap-3 w-full max-w-[280px] justify-center">
          {paymentStatus === 'success' ? (
            <Button onClick={handleClose} className="w-full h-11 rounded-xl text-[15px] font-medium text-white shadow-lg bg-green-600 hover:bg-green-700 hover:shadow-green-600/20 transition-all">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1 h-11 rounded-xl border-border/60 hover:bg-muted text-[15px] font-medium">
                Close
              </Button>
              <Button onClick={() => window.location.href = '/packages'} className="flex-1 h-11 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-600/20 transition-all text-[15px] font-medium">
                Retry Payment
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PaymentStatusPopup() {
  return (
    <Suspense fallback={null}>
      <PaymentStatusContent />
    </Suspense>
  )
}
