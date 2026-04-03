'use client'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react'
import { getFirebaseAuth, getFirebaseDb, getFirebaseModules } from '@/lib/firebase/config'
import { signInWithGoogle, signInWithApple } from '@/lib/services/social-auth.service'
import { signupSchema, type SignupFormData } from '@/lib/validations/auth'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const { isAuthenticated, isInitialized, user, setLoading, setError, setUser } = useAuthStore()

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.replace('/admin')
      } else {
        router.replace('/dashboard')
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    try {
      setSocialLoading(provider)
      setFormError(null)
      const result = provider === 'google' ? await signInWithGoogle() : await signInWithApple()
      setUser({
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
      })
      router.push('/dashboard')
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        // User closed popup, no error needed
      } else if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
        setFormError('Popups are blocked. Please allow popups for this site or try email sign-up.')
      } else if (error?.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : ''
        setFormError(`Add "${currentDomain}" to Firebase Console > Authentication > Settings > Authorized domains.`)
      } else {
        setFormError(`Social sign-up failed: ${error?.message || 'Unknown error'}`)
      }
    } finally {
      setSocialLoading(null)
    }
  }
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),

  })

  const password = watch('password')

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' }
    if (pwd.length < 8) return { strength: 1, label: 'Weak', color: 'bg-destructive' }
    if (pwd.length < 12) return { strength: 2, label: 'Medium', color: 'bg-primary' }
    return { strength: 3, label: 'Strong', color: 'bg-green-500' }
  }

  const { strength, label, color } = getPasswordStrength(password)

  function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return 'OM' + code
  }

const onSubmit = async (data: SignupFormData) => {
  try {
    setLoading(true)
    setError(null)
    setFormError(null)

    const auth = await getFirebaseAuth()
    const modules = await getFirebaseModules()

    if (!auth || !modules.auth) {
      setFormError('Authentication service not available.')
      router.push('/login')
      return
    }

    const {
      createUserWithEmailAndPassword,
      updateProfile,
      signOut,
    } = modules.auth

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    )

    const firebaseUser = userCredential.user

    if (!firebaseUser) {
      setFormError('Signup failed.')
      router.push('/login')
      return
    }

    const fullName = `${data.firstName} ${data.lastName}`

    await updateProfile(firebaseUser, {
      displayName: fullName,
    })

    const db = await getFirebaseDb()

    if (!db || !modules.firestore) {
      try {
        await firebaseUser.delete()
      } catch {
        console.log('Delete skipped')
      }

      setFormError('Database unavailable.')
      router.push('/login')
      return
    }

    const firestore = modules.firestore

    const {
      doc,
      setDoc,
      serverTimestamp,
      collection,
      query,
      where,
      getDocs,
      updateDoc,
      increment,
    } = firestore

    const myReferralCode = generateReferralCode()
    const usedCode = data.referralCodeUsed?.trim().toUpperCase() || ''

    let validReferralCode = ''
    let referredBy = '' // referrer's UID — used later to award referral coins

    if (usedCode) {
      const q = query(
        collection(db, 'users'),
        where('referralCode', '==', usedCode)
      )

      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const referrerDoc = snapshot.docs[0]

        await updateDoc(referrerDoc.ref, {
          totalReferrals: increment(1),
        })

        validReferralCode = usedCode
        referredBy = referrerDoc.id // store the referrer's UID
      }
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      name: fullName,
      email: data.email,
      phone: data.phone || '',
      role: 'USER',
      tier: 'Hope',
      loyaltyPoints: 0,
      totalCoinsEarned: 0,
      annualOmniaValue: 0,
      referralCode: myReferralCode,
      referralCodeUsed: validReferralCode,
      referredBy,                // ← referrer's UID (empty string if none)
      totalReferrals: 0,
      createdAt: serverTimestamp(),
    })

    await signOut(auth)

    alert('Account created successfully. Please login.')

    router.push('/login')
  } catch (error: any) {
    console.log('Signup error:', error)

    setFormError(error?.message || 'Signup failed. Please try again.')

    router.push('/login')
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Decoration */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80')] bg-cover bg-center opacity-20 dark:opacity-10" />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-lg">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Start Your Adventure</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Join thousands of travelers who trust OMNIA for their business and leisure travel needs.
            </p>

            {/* Benefits */}
            <div className="mt-10 space-y-4 text-left">
              {['Exclusive member-only deals', 'Priority customer support', 'Flexible booking options', 'Earn rewards on every trip'].map(
                (benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 xl:px-24 bg-background overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-block mb-8">
            <Image src="/images/omnia-logo.png" alt="OMNIA" width={160} height={90} className="h-20 w-auto object-contain" />
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">Create Account</h1>
            <p className="text-muted-foreground text-lg">Join us and explore the world like never before</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit, () => {})} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground font-medium">
                  First Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    className={`pl-12 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground ${
                      errors.firstName ? 'border-destructive' : ''
                    }`}
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground font-medium">
                  Last Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    className={`pl-12 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground ${
                      errors.lastName ? 'border-destructive' : ''
                    }`}
                    {...register('lastName')}
                  />
                </div>
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className={`pl-12 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground ${
                    errors.email ? 'border-destructive' : ''
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="pl-12 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  {...register('phone')}
                />
              </div>
            </div>
<div className="space-y-2">
  <Label htmlFor="referralCodeUsed" className="text-foreground font-medium">
    Referral Code (Optional)
  </Label>
  <Input
    id="referralCodeUsed"
    type="text"
    placeholder="Enter referral code"
    className="h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary text-foreground"
    {...register('referralCodeUsed')}
  />
</div>
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className={`pl-12 pr-12 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground ${
                    errors.password ? 'border-destructive' : ''
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${strength >= level ? color : 'bg-border'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Password strength: {label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className={`pl-12 pr-12 h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground ${
                    errors.confirmPassword ? 'border-destructive' : ''
                  }`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms Agreement */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Controller
                  name="agreeTerms"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <Checkbox
                      id="terms"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  )}
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:text-primary/80 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:text-primary/80 font-medium">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {errors.agreeTerms && <p className="text-xs text-destructive">{errors.agreeTerms.message}</p>}
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {formError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-xl shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 group"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Or sign up with</span>
            </div>
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-4">
            <Button type="button" variant="outline" disabled={!!socialLoading} onClick={() => handleSocialAuth('google')} className="h-12 bg-transparent border-border hover:bg-secondary/50 text-foreground font-medium">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {socialLoading === 'google' ? 'Signing up...' : 'Google'}
            </Button>
            <Button type="button" variant="outline" disabled={!!socialLoading} onClick={() => handleSocialAuth('apple')} className="h-12 bg-transparent border-border hover:bg-secondary/50 text-foreground font-medium">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
              {socialLoading === 'apple' ? 'Signing up...' : 'Apple'}
            </Button>
          </div>

          {/* Login Link */}
          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
