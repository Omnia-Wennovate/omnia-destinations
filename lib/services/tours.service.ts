import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config"

export interface Tour {
  id: string
  city: string
  country: string
  description: string
  price: number
  startDate: string
  expireDate: string
  maxGuests: number
  itinerary: string
  priceIncludes: string[]
  priceExcludes: string[]
  slug: string
}

export async function getAllTours(): Promise<Tour[]> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()

  if (!db || !modules.firestore) return []

  const { collection, getDocs } = modules.firestore

  try {
    const snapshot = await getDocs(collection(db, "tours"))

    const tours: Tour[] = []

    snapshot.forEach((doc: any) => {
      const data = doc.data()

      tours.push({
        id: doc.id,
        city: data.city || "",
        country: data.country || "",
        description: data.description || "",
        price: data.price || 0,
        startDate: data.startDate || "",
        expireDate: data.expireDate || "",
        maxGuests: data.maxGuests || 0,
        itinerary: data.itinerary || "",
        priceIncludes: data.priceIncludes || [],
        priceExcludes: data.priceExcludes || [],
        slug: data.slug || ""
      })
    })

    return tours
  } catch (error) {
    console.error("Error loading tours:", error)
    return []
  }
}