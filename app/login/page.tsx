'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { getFirebaseAuth, getFirebaseDb, getFirebaseModules } from '@/lib/firebase/config'
import { signInWithGoogle, signInWithApple } from '@/lib/services/social-auth.service'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

import { sendPasswordResetEmail } from "firebase/auth"


export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
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
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)

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
      if (result.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/home')
      }
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || 
        error?.code === 'auth/cancelled-popup-request') {
        // User closed popup, no error needed
      } else if (error?.code === 'auth/popup-blocked' || 
        error?.code === 'auth/operation-not-supported-in-this-environment') {
        setFormError('Popups are blocked. Please allow popups for this site or try email login.')
      } else if (error?.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : ''
        setFormError(`Add "${currentDomain}" to Firebase Console > Authentication > Settings > Authorized domains.`)
      } else {
        setFormError(`Social sign-in failed: ${error?.message || 'Unknown error'}`)
      }
    } finally {
      setSocialLoading(null)
    }
  }

const [showForgot, setShowForgot] = useState(false)
const [resetEmail, setResetEmail] = useState("")
const [resetMessage, setResetMessage] = useState<string | null>(null)
const handleResetPassword = async () => {
  try {
    const auth = await getFirebaseAuth()

    if (!auth) {
      setResetMessage("Firebase not available")
      return
    }

    await sendPasswordResetEmail(auth, resetEmail)

    setResetMessage("Password reset email sent. Check your inbox or spam. search for nonreply@firebaseapp.com")
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      setResetMessage("No account found with this email.")
    } else if (error.code === "auth/invalid-email") {
      setResetMessage("Invalid email address.")
    } else {
      setResetMessage("Failed to send reset email.")
    }
  }
}

const onSubmit = async (data: LoginFormData) => {
  try {
    setLoading(true)
    setError(null)
    setFormError(null)

    const auth = await getFirebaseAuth()
    const db = await getFirebaseDb()
    const modules = await getFirebaseModules()

    if (!auth || !modules?.auth || !modules?.firestore || !db) {
      setFormError('Firebase services not available.')
      return
    }

    const { signInWithEmailAndPassword } = modules.auth
    const { doc, getDoc } = modules.firestore

    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    )

    const firebaseUser = userCredential.user

    if (!firebaseUser) {
      setFormError('Login failed.')
      return
    }

    // 🔹 Check if user exists in admins collection
    const adminRef = doc(db, "admins", firebaseUser.uid)
    const adminSnap = await getDoc(adminRef)

    const role = adminSnap.exists() ? "ADMIN" : "USER"

    const name = firebaseUser.displayName || ""

    setUser({
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      firstName: name.split(" ")[0] || "",
      lastName: name.split(" ").slice(1).join(" ") || "",
      role
    })

    // 🔹 Redirect based on role
    if (role === "ADMIN") {
      router.push("/admin")
    } else {
      router.push("/dashboard")
    }

  } catch (error: any) {
    const code = error?.code || ""
    let message = "Invalid username or password."

    if (code === "auth/too-many-requests") {
      message = "Too many failed attempts."
    } else if (code === "auth/user-disabled") {
      message = "This account has been disabled."
    }

    setFormError(message)
    setError(message)
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 xl:px-24 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-block mb-12">
            <Image
              src="/images/omnia-logo.png"
              alt="OMNIA"
              width={160}
              height={90}
              className="h-20 w-auto object-contain"
            />
          </Link>

          {/* Welcome Text */}
          <div className="mb-10">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">Welcome Back</h1>
            <p className="text-muted-foreground text-lg">Sign in to continue your journey with us</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit, () => {})} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your email or username"
                  {...register('email')}
                  className="pl-12 h-14 bg-secondary/50 border-border focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
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
                  placeholder="Enter your password"
                  {...register('password')}
                  className="pl-12 pr-12 h-14 bg-secondary/50 border-border focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Controller
                  name="rememberMe"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <Checkbox
                      id="remember"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  )}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me
                </Label>
              </div>
              <button
  type="button"
  onClick={() => setShowForgot(true)}
  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
>
  Forgot Password?
</button>
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
              {isSubmitting ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              disabled={!!socialLoading}
              onClick={() => handleSocialAuth('google')}
              className="h-14 bg-transparent border-border hover:bg-secondary/50 text-foreground font-medium"
            >
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
              {socialLoading === 'google' ? 'Signing in...' : 'Google'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!!socialLoading}
              onClick={() => handleSocialAuth('apple')}
              className="h-14 bg-transparent border-border hover:bg-secondary/50 text-foreground font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
              {socialLoading === 'apple' ? 'Signing in...' : 'Apple'}
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-10 text-center text-muted-foreground">
            {"Don't have an account?"}{' '}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Decoration */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80')] bg-cover bg-center opacity-20 dark:opacity-10" />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-lg">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Discover the World</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              From pristine beaches to ancient cities, unlock exclusive travel packages designed for unforgettable experiences.
            </p>
            <div className="mt-10 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Destinations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Happy Travelers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.9</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showForgot && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md space-y-4">

      <h2 className="text-xl font-bold">Reset Password</h2>

      <Input
        type="email"
        placeholder="Enter your email"
        value={resetEmail}
        onChange={(e) => setResetEmail(e.target.value)}
      />

      {resetMessage && (
        <p className="text-sm text-muted-foreground">{resetMessage}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setShowForgot(false)
            setResetMessage(null)
          }}
        >
          Cancel
        </Button>

        <Button onClick={handleResetPassword}>
          Send Reset Link
        </Button>
      </div>

    </div>
  </div>
)}
    </div>
  )
}
