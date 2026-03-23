export interface NavLink {
  href: string
  label: string
}

export interface Package {
  id: string
  title: string
  location: string
  image: string
  duration: string
  price?: number
  singlePrice: number
  sharingPrice: number
  rating: number
  // Extended details for product page
  description?: string
  highlights?: string[]
  included?: string[]
  excluded?: string[]
  gallery?: string[]
  videoUrl?: string
  itinerary?: DayItinerary[]
  difficulty?: 'Easy' | 'Moderate' | 'Challenging'
  minAge?: number
  maxPeople?: number
  reviews?: number
  groupSize?: string
  nextAvailable?: string
}

export interface DayItinerary {
  day: number
  title: string
  description: string
  activities: string[]
  meals?: string[]
  accommodation?: string
}

export interface Tour {
  id: string
  title: string
  location: string
  duration: string
  price?: number
  singlePrice?: number
  sharingPrice?: number
  rating: number
  reviews: number
  image: string
  groupSize: string
  nextAvailable: string
  // Extended details for product page
  description?: string
  highlights?: string[]
  included?: string[]
  excluded?: string[]
  gallery?: string[]
  videoUrl?: string
  itinerary?: DayItinerary[]
  difficulty?: 'Easy' | 'Moderate' | 'Challenging'
  minAge?: number
  maxPeople?: number
}

export interface Destination {
  id: string
  name: string
  image: string
  tours: number
  description?: string
}

export type Currency = 'ETB' | 'USD' | 'EUR' | 'GBP'

export type Duration = '1-3 Days' | '4-7 Days' | '1-2 Weeks' | '2-3 Weeks' | '1 Month+'
