'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, ChevronDown, Sun, Moon, User, LogOut, LayoutDashboard } from 'lucide-react'
import { getFirebaseAuth, getFirebaseModules } from '@/lib/firebase/config'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_LINKS, CURRENCIES } from '@/lib/constants/navigation'

const navLinks = NAV_LINKS
const currencies = CURRENCIES

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [currency, setCurrency] = useState('ETB')
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { resolvedTheme, toggleTheme } = useThemeStore()
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleSignOut = async () => {
    try {
      // Only sign out from Firebase if not the hardcoded admin
      if (user?.id !== 'admin') {
        const auth = await getFirebaseAuth()
        const modules = await getFirebaseModules()
        if (auth && modules.auth) {
          const { signOut } = modules.auth
          await signOut(auth)
        }
      }
      logout()
      router.push('/')
    } catch {
      logout()
      router.push('/')
    }
  }

  const userInitials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U'
    : ''

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  // Only show transparent navbar on homepage
  const isHomePage = pathname === '/'
  const shouldBeTransparent = isHomePage && !scrolled

  return (
    <header suppressHydrationWarning className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      shouldBeTransparent
        ? 'bg-transparent' 
        : 'bg-background/95 backdrop-blur-md shadow-lg'
    }`}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/omnia-logo.png"
            alt="OMNIA Business and Leisure Travel"
            width={140}
            height={80}
            className="h-16 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-sm font-medium transition-colors hover:text-primary ${
                isActiveLink(link.href)
                  ? 'text-primary after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary'
                  : shouldBeTransparent ? 'text-white' : 'text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={shouldBeTransparent ? 'text-white hover:bg-white/10' : 'text-foreground'}
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Currency Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-1 ${
                  shouldBeTransparent ? 'text-white hover:bg-white/10' : 'text-foreground'
                }`}
              >
                {currency}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {CURRENCIES.map((curr) => (
                <DropdownMenuItem key={curr} onClick={() => setCurrency(curr)}>
                  {curr}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex items-center gap-2 rounded-full px-2 pr-4 h-11 ${
                    shouldBeTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    {user.photoURL && <AvatarImage src={user.photoURL} alt={user.firstName} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.firstName}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                  <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard'}>
                    <LayoutDashboard className="h-4 w-4" />
                    {user.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {/* Signup Button */}
              <Link href="/signup">
                <Button 
                  variant="outline" 
                  className={`rounded-full px-6 transition-all ${
                    shouldBeTransparent
                      ? 'border-white/50 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm'
                      : 'border-primary text-primary hover:bg-primary/10 bg-transparent' 
                  }`}
                >
                  Sign Up
                </Button>
              </Link>

              {/* Login Button */}
              <Link href="/login">
                <Button className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90 shadow-lg">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={shouldBeTransparent ? 'text-white hover:bg-white/10' : 'text-foreground'}
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={shouldBeTransparent ? 'text-white hover:bg-white/10' : 'text-foreground'}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-md p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col h-full">
                {/* Header Section */}
                <div className="p-6 border-b border-border bg-muted/30">
                  <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
                    <Image
                      src="/images/omnia-logo.png"
                      alt="OMNIA Business and Leisure Travel"
                      width={140}
                      height={80}
                      className="h-16 w-auto object-contain"
                    />
                  </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-2">
                    {NAV_LINKS.map((link, index) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`group flex items-center justify-between rounded-xl px-4 py-4 text-base font-medium transition-all duration-200 ${
                          isActiveLink(link.href)
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-foreground hover:bg-muted hover:text-primary'
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <span>{link.label}</span>
                        {isActiveLink(link.href) && (
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </Link>
                    ))}
                  </div>
                </nav>

                {/* Footer Section */}
                <div className="p-6 space-y-3 border-t border-border bg-muted/20">
                  {/* Currency Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-12 rounded-xl bg-background hover:bg-muted transition-colors"
                      >
                        <span className="text-sm font-medium">Currency: {currency}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[calc(85vw-3rem)] max-w-[calc(28rem-3rem)]">
                      {CURRENCIES.map((curr) => (
                        <DropdownMenuItem 
                          key={curr} 
                          onClick={() => setCurrency(curr)}
                          className="cursor-pointer"
                        >
                          {curr}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Action Buttons */}
                  {isAuthenticated && user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <Avatar className="h-10 w-10">
                          {user.photoURL && <AvatarImage src={user.photoURL} alt={user.firstName} />}
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard'} onClick={() => setIsOpen(false)} className="flex-1">
                          <Button 
                            variant="outline" 
                            className="w-full h-12 rounded-xl border-2 border-primary text-primary hover:bg-primary/10 bg-transparent font-semibold transition-all hover:scale-[1.02]"
                          >
                            {user.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => { setIsOpen(false); handleSignOut() }}
                          variant="outline"
                          className="h-12 rounded-xl border-2 border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent font-semibold transition-all hover:scale-[1.02] px-4"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link href="/signup" onClick={() => setIsOpen(false)} className="flex-1">
                        <Button 
                          variant="outline" 
                          className="w-full h-12 rounded-xl border-2 border-primary text-primary hover:bg-primary/10 bg-transparent font-semibold transition-all hover:scale-[1.02]"
                        >
                          Sign Up
                        </Button>
                      </Link>
                      <Link href="/login" onClick={() => setIsOpen(false)} className="flex-1">
                        <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]">
                          Login
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
