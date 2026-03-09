import type { Package } from '@/lib/types'

export const PACKAGES: Package[] = [
  {
    id: '1',
    title: 'Maldives Paradise',
    location: 'Maldives',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&auto=format&fit=crop&q=80',
    duration: '7 Days',
    price: 2500,
    rating: 4.9,
    reviews: 856,
    groupSize: 'Private or Group',
    nextAvailable: 'Year Round',
    description: 'Escape to paradise with our exclusive 7-day Maldives package. Experience pristine white sand beaches, crystal-clear turquoise waters, and world-class luxury resorts. Perfect for honeymooners, couples, and anyone seeking a tropical paradise.',
    difficulty: 'Easy',
    minAge: 0,
    maxPeople: 20,
    highlights: [
      'Stay in overwater bungalows with private pools',
      'Daily breakfast and dinner included',
      'Snorkeling in vibrant coral reefs',
      'Sunset dolphin cruise',
      'Spa treatments and water sports',
      'Private beach access'
    ],
    included: [
      'Roundtrip airport transfers',
      '6 nights accommodation in 5-star resort',
      'Daily breakfast and dinner',
      'Complimentary water sports activities',
      'Snorkeling equipment',
      'Sunset cruise',
      'Welcome drink and tropical fruit basket'
    ],
    excluded: [
      'International flights',
      'Lunch and beverages',
      'Spa treatments (can be added)',
      'Diving excursions (optional)',
      'Travel insurance'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&auto=format&fit=crop&q=80'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Paradise',
        description: 'Welcome to the Maldives! Begin your tropical adventure with a warm greeting and seamless transfer to your luxurious resort.',
        activities: [
          'Arrive at Velana International Airport',
          'Meet and greet by resort representative',
          'Speedboat or seaplane transfer to resort',
          'Check-in to overwater villa',
          'Welcome drink and resort orientation',
          'Leisure time to explore the resort',
          'Sunset beach walk'
        ],
        meals: ['Dinner'],
        accommodation: '5-Star Overwater Villa'
      },
      {
        day: 2,
        title: 'Island Exploration & Snorkeling',
        description: 'Discover the underwater wonders of the Maldives with guided snorkeling in pristine coral reefs.',
        activities: [
          'Breakfast at resort restaurant',
          'Morning snorkeling session at house reef',
          'Spot tropical fish, sea turtles, and rays',
          'Beach relaxation and swimming',
          'Optional water sports (kayaking, paddleboarding)',
          'Sunset viewing from your private deck'
        ],
        meals: ['Breakfast', 'Dinner'],
        accommodation: '5-Star Overwater Villa'
      },
      {
        day: 3,
        title: 'Dolphin Cruise & Spa',
        description: 'Experience the magic of dolphins at sunset and indulge in rejuvenating spa treatments.',
        activities: [
          'Leisurely breakfast',
          'Free morning for relaxation',
          'Afternoon spa session (optional upgrade)',
          'Sunset dolphin watching cruise',
          'Champagne toast at sea',
          'Romantic beach dinner under the stars'
        ],
        meals: ['Breakfast', 'Dinner'],
        accommodation: '5-Star Overwater Villa'
      },
      {
        day: 4,
        title: 'Water Sports & Beach Day',
        description: 'Embrace adventure with exciting water sports or simply relax on pristine white sand beaches.',
        activities: [
          'Breakfast with ocean views',
          'Jet skiing and banana boat rides',
          'Beach volleyball and games',
          'Infinity pool lounging',
          'Afternoon tea service',
          'Evening cultural show and dinner'
        ],
        meals: ['Breakfast', 'Dinner'],
        accommodation: '5-Star Overwater Villa'
      },
      {
        day: 5,
        title: 'Island Hopping Adventure',
        description: 'Explore nearby local islands and experience authentic Maldivian culture and hospitality.',
        activities: [
          'Early breakfast',
          'Speedboat to local inhabited island',
          'Village tour and cultural exchange',
          'Local craft shopping',
          'Traditional Maldivian lunch',
          'Return to resort for evening relaxation'
        ],
        meals: ['Breakfast', 'Lunch', 'Dinner'],
        accommodation: '5-Star Overwater Villa'
      },
      {
        day: 6,
        title: 'Free Day in Paradise',
        description: 'Enjoy a full day at leisure to create your own perfect paradise experience.',
        activities: [
          'Breakfast at your convenience',
          'Optional diving excursion (additional cost)',
          'Spa and wellness treatments available',
          'Private beach cabana relaxation',
          'Sunset photography session',
          'Farewell dinner with special menu'
        ],
        meals: ['Breakfast', 'Dinner'],
        accommodation: '5-Star Overwater Villa'
      },
      {
        day: 7,
        title: 'Departure Day',
        description: 'Bid farewell to paradise with cherished memories and plans to return.',
        activities: [
          'Final breakfast overlooking the ocean',
          'Check-out and packing',
          'Last-minute resort photos',
          'Transfer to airport via speedboat/seaplane',
          'Departure with unforgettable memories'
        ],
        meals: ['Breakfast']
      }
    ]
  },
  {
    id: '2',
    title: 'Roman Holiday',
    location: 'Rome, Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
    duration: '5 Days',
    price: 1800,
    rating: 4.8,
  },
  {
    id: '3',
    title: 'Singapore Explorer',
    location: 'Singapore',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop&q=80',
    duration: '4 Days',
    price: 1500,
    rating: 4.7,
  },
]
