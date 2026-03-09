'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store/auth'
import { createBooking } from '@/lib/services/bookings.service'

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageData: {
    id: string
    title: string
    location: string
    price: number
    duration: string
  }
}

export function BookingDialog({ open, onOpenChange, packageData }: BookingDialogProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    travelers: '1',
    travelDate: '',
    specialRequests: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  // Pre-fill form with user data when authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      }))
    }
  }, [user, isAuthenticated, open])

  const totalPrice = packageData.price * parseInt(formData.travelers || '1')

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    // Require authentication
    if (!isAuthenticated || !user) {
      setBookingError('Please log in to complete your booking.')
      return
    }

    // Validate required fields
    if (!formData.travelDate) {
      setBookingError('Please select a travel date.')
      return
    }

    if (!formData.travelers || parseInt(formData.travelers) < 1) {
      setBookingError('Please select the number of travelers.')
      return
    }

    setIsSubmitting(true)
    setBookingError(null)

    try {
      // Create booking in Firestore
      const newBookingId = await createBooking({
        userId: user.id,
        userName: `${formData.firstName} ${formData.lastName}`.trim() || user.email,
        userEmail: formData.email || user.email,
        packageId: packageData.id,
        packageTitle: packageData.title,
        travelDate: formData.travelDate,
        guests: parseInt(formData.travelers),
        totalAmount: totalPrice,
        specialRequests: formData.specialRequests,
      })

      setBookingId(newBookingId)
      setBookingSuccess(true)
    } catch (error: any) {
      console.error('Booking error:', error)
      setBookingError(error?.message || 'Failed to create booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setStep(1)
      setBookingSuccess(false)
      setBookingError(null)
      setBookingId(null)
    }
    onOpenChange(newOpen)
  }

  const handleGoToDashboard = () => {
    handleOpenChange(false)
    router.push('/dashboard')
  }

  const handleLoginRedirect = () => {
    handleOpenChange(false)
    router.push('/login')
  }

  // Success state
  if (bookingSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground mb-2">
              Booking Confirmed!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mb-6">
              Your booking for <span className="font-semibold text-foreground">{packageData.title}</span> has been successfully created.
            </DialogDescription>
            
            <div className="w-full rounded-lg bg-muted p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span className="font-mono font-medium text-foreground">{bookingId?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Travel Date:</span>
                  <span className="font-medium text-foreground">{formData.travelDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Travelers:</span>
                  <span className="font-medium text-foreground">{formData.travelers}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-primary">${totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 mb-6 w-full">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm text-amber-800 dark:text-amber-200">
                Payment status: Pending. Our team will contact you shortly.
              </span>
            </div>

            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
                Close
              </Button>
              <Button onClick={handleGoToDashboard} className="flex-1">
                View Bookings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Book: {packageData.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {packageData.location} - {packageData.duration}
          </DialogDescription>
        </DialogHeader>

        {/* Login prompt for unauthenticated users */}
        {!isAuthenticated && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Sign in required
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Please log in to complete your booking and track your reservations.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLoginRedirect}
                  className="mt-3 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Error display */}
        {bookingError && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">{bookingError}</span>
            </div>
          </div>
        )}

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Travel Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="travelDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Travel Date
              </Label>
              <Input
                id="travelDate"
                type="date"
                value={formData.travelDate}
                onChange={(e) => handleInputChange('travelDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Travelers
              </Label>
              <Select
                value={formData.travelers}
                onValueChange={(value) => handleInputChange('travelers', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select travelers" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'Traveler' : 'Travelers'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <textarea
                id="specialRequests"
                placeholder="Any dietary requirements, accessibility needs, or special occasions?"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-3 font-semibold text-foreground">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package:</span>
                  <span className="font-medium text-foreground">{packageData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium text-foreground">
                    {formData.firstName} {formData.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-foreground">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Travel Date:</span>
                  <span className="font-medium text-foreground">{formData.travelDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Travelers:</span>
                  <span className="font-medium text-foreground">{formData.travelers}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ${packageData.price.toLocaleString()} x {formData.travelers} travelers
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total:</span>
                    <span className="text-primary">${totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">
                Payment will be processed after confirmation
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={handleNext}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={
                (step === 1 && (!formData.firstName || !formData.email)) ||
                (step === 2 && !formData.travelDate)
              }
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting || !isAuthenticated}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
