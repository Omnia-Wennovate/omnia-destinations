import React from "react"
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ScrollToTop } from '@/components/scroll-to-top'
import { WhatsAppFloat } from '@/components/whatsapp-float'
import { OmniaChatbot } from '@/components/omnia-chatbot'
import './globals.css'
<<<<<<< HEAD
import AutoLogout from '@/components/auto-logout'
=======
>>>>>>> 4c57566027f0d79a8001fe43943a3fa318651381

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

const lato = { variable: '--font-lato' } // Declaring the lato variable

export const metadata: Metadata = {
  title: 'OMNIA - Business and Leisure Travel',
  description: 'OMNIA Business and Leisure Travel - Your gateway to extraordinary travel experiences',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body className={`${poppins.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
<<<<<<< HEAD
        <AutoLogout />
=======
>>>>>>> 4c57566027f0d79a8001fe43943a3fa318651381
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ScrollToTop />
            <WhatsAppFloat />
            <OmniaChatbot />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
