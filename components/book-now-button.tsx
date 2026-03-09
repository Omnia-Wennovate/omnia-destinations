'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BookingDialog } from '@/components/booking-dialog'

interface BookNowButtonProps {
  packageData: {
    id: string
    title: string
    location: string
    price: number
    duration: string
  }
}

export function BookNowButton({ packageData }: BookNowButtonProps) {
  const [bookingOpen, setBookingOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBookingOpen(true)
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