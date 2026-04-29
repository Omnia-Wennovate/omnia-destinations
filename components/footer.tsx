'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react'
import { addSubscriber } from '@/lib/services/newsletter.service'

/** TikTok icon — lucide-react doesn't include one, so we use a matching SVG */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

const quickLinks = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/packages', label: 'Packages' },
  { href: '/business-travel', label: 'Business Travel' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
]

const socialLinks = [
  { href: 'https://www.facebook.com/share/1GwnijTTHn/', icon: Facebook, label: 'Facebook' },
  { href: 'https://www.tiktok.com/@omniadestinations', icon: TikTokIcon, label: 'TikTok' },
  { href: 'https://www.instagram.com/omniadestinations', icon: Instagram, label: 'Instagram' },
]

export function Footer() {
  const [subEmail, setSubEmail] = useState('')
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subEmail.trim()) return
    setSubStatus('loading')
    try {
      console.log('[v0] Subscribing email:', subEmail.trim().toLowerCase())
      await addSubscriber(subEmail.trim().toLowerCase())
      console.log('[v0] Subscription successful')
      setSubStatus('success')
      setSubEmail('')
      setTimeout(() => setSubStatus('idle'), 4000)
    } catch (err: any) {
      console.log('[v0] Subscription error:', err?.code, err?.message, err)
      if (err?.message === 'already-subscribed') {
        setSubStatus('already')
      } else {
        setSubStatus('error')
      }
      setTimeout(() => setSubStatus('idle'), 4000)
    }
  }

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Image
              src="/images/omnia-logo.png"
              alt="OMNIA Business and Leisure Travel"
              width={120}
              height={70}
              className="h-16 w-auto object-contain"
            />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your trusted partner for business and leisure travel experiences around the world.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Addis Ababa, Ethiopia
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">+251 911 123 456</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">info@omniatravel.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Newsletter</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Subscribe to get special offers and travel updates.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Your email"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                required
                className="rounded-md border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={subStatus === 'loading'}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {subStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
              {subStatus === 'success' && (
                <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" /> Subscribed successfully!
                </p>
              )}
              {subStatus === 'already' && (
                <p className="text-xs text-amber-600 dark:text-amber-400">You are already subscribed.</p>
              )}
              {subStatus === 'error' && (
                <p className="text-xs text-destructive">Something went wrong. Try again.</p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} OMNIA Travel. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
