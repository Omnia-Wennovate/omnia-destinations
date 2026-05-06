'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookingDialog } from '@/components/booking-dialog'

interface BookNowButtonProps {
  packageData: {
    id: string
    title: string
    location: string
    singlePrice: number
    sharingPrice: number
    duration: string
  }
  redirectUrl?: string
}

export function BookNowButton({ packageData, redirectUrl }: BookNowButtonProps) {
  const [bookingOpen, setBookingOpen] = useState(false)
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (redirectUrl) {
      router.push(redirectUrl)
    } else {
      setBookingOpen(true)
    }
  }

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div onClick={stopPropagation}>
      <Button
        onClick={handleClick}
        className="rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
      >
        Book Now
      </Button>

      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        packageData={packageData}
      />
    </div>
  )
}