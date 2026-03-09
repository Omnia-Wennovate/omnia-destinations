import type { NavLink, Currency } from '@/lib/types'

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/packages', label: 'Packages' },
  { href: '/business-travel', label: 'Business Travel' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
]

export const CURRENCIES: Currency[] = ['ETB', 'USD', 'EUR', 'GBP']
