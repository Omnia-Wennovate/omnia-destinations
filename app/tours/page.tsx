'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAllTours, Tour } from "@/lib/services/tours.service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, DollarSign, Loader2 } from "lucide-react"

export default function ToursPage() {

  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTours() {
      const data = await getAllTours()
      setTours(data)
      setLoading(false)
    }

    loadTours()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">

      <h1 className="text-4xl font-bold mb-8">
        Explore Our Tours
      </h1>

      {tours.length === 0 ? (
        <p>No tours available</p>
      ) : (

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {tours.map((tour) => (

            <Card key={tour.id} className="hover:shadow-lg transition">

              <CardContent className="p-5">

                <h2 className="text-xl font-semibold mb-2">
                  {tour.city}, {tour.country}
                </h2>

                <p className="text-sm text-muted-foreground mb-4">
                  {tour.description}
                </p>

                <div className="flex items-center gap-2 text-sm mb-2">
                  <Calendar className="h-4 w-4" />
                  {tour.startDate}
                </div>

                <div className="flex items-center gap-2 text-sm mb-2">
                  <Users className="h-4 w-4" />
                  Max {tour.maxGuests} Guests
                </div>

                <div className="flex items-center gap-2 font-semibold mb-4">
                  <DollarSign className="h-4 w-4" />
                  {tour.price}
                </div>

                <Link href={`/tours/${tour.slug}`}>
                  <Button className="w-full">
                    View Tour
                  </Button>
                </Link>

              </CardContent>

            </Card>

          ))}

        </div>
      )}

    </div>
  )
}