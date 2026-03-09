import type { Tour } from '@/lib/types'

export const TOURS: Tour[] = [
  {
    id: '1',
    title: 'Grand Canyon Helicopter Tour',
    location: 'Arizona, USA',
    duration: '4 hours',
    price: 299,
    rating: 4.9,
    reviews: 1247,
    image: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&auto=format&fit=crop&q=80',
    groupSize: 'Max 6',
    nextAvailable: 'Tomorrow',
    description: 'Experience the breathtaking beauty of the Grand Canyon from a bird\'s eye view. This once-in-a-lifetime helicopter tour offers unparalleled views of one of the world\'s most spectacular natural wonders.',
    difficulty: 'Easy',
    minAge: 8,
    maxPeople: 6,
    highlights: [
      'Aerial views of the Grand Canyon\'s North and South Rims',
      'Fly over the Colorado River and Hoover Dam',
      'Expert pilot commentary throughout the flight',
      'Complimentary photo opportunities',
      'Hotel pickup and drop-off included'
    ],
    included: [
      'Round-trip helicopter flight',
      'Professional pilot and guide',
      'Hotel pickup and drop-off',
      'Complimentary bottled water',
      'All taxes and fees'
    ],
    excluded: [
      'Gratuities (optional)',
      'Souvenir photos',
      'Personal expenses'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    itinerary: [
      {
        day: 1,
        title: 'Grand Canyon Helicopter Adventure',
        description: 'Your unforgettable Grand Canyon helicopter tour begins with hotel pickup and takes you on an aerial journey over one of the world\'s greatest natural wonders.',
        activities: [
          'Hotel pickup from Las Vegas Strip',
          'Safety briefing and helicopter boarding',
          'Scenic flight over Hoover Dam and Lake Mead',
          'Fly through the Grand Canyon with multiple viewpoints',
          'Aerial views of the Colorado River',
          'Photo opportunities throughout the flight',
          'Return flight and hotel drop-off'
        ],
        meals: ['Light snacks and water provided']
      }
    ]
  },
  {
    id: '2',
    title: 'Northern Lights Adventure',
    location: 'Reykjavik, Iceland',
    duration: '8 hours',
    price: 189,
    rating: 4.8,
    reviews: 892,
    image: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=800&auto=format&fit=crop&q=80',
    groupSize: 'Max 12',
    nextAvailable: 'Dec 15',
  },
  {
    id: '3',
    title: 'Tokyo Food & Culture Tour',
    location: 'Tokyo, Japan',
    duration: '6 hours',
    price: 149,
    rating: 5.0,
    reviews: 2103,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop&q=80',
    groupSize: 'Max 8',
    nextAvailable: 'Today',
    description: 'Immerse yourself in Tokyo\'s vibrant food scene and rich culture. This guided walking tour takes you through bustling markets, hidden alleyways, and iconic neighborhoods while sampling authentic Japanese cuisine.',
    difficulty: 'Easy',
    minAge: 12,
    maxPeople: 8,
    highlights: [
      'Visit Tsukiji Outer Market for fresh sushi and seafood',
      'Explore traditional temples and shrines',
      'Sample street food in Shibuya and Harajuku',
      'Experience a traditional tea ceremony',
      'Learn about Japanese culture and history',
      'Small group for personalized experience'
    ],
    included: [
      'Professional English-speaking guide',
      'All food tastings (10+ dishes)',
      'Green tea ceremony experience',
      'Public transportation during tour',
      'Digital photo memories'
    ],
    excluded: [
      'Hotel pickup and drop-off',
      'Additional food and drinks',
      'Personal shopping',
      'Gratuities (optional)'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&auto=format&fit=crop&q=80'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    itinerary: [
      {
        day: 1,
        title: 'Tokyo Food & Culture Adventure',
        description: 'A delicious journey through Tokyo\'s most authentic food spots and cultural landmarks.',
        activities: [
          'Meet at Tsukiji Station',
          'Explore Tsukiji Outer Market - fresh sushi tasting',
          'Visit traditional Japanese knife shop',
          'Walk to historic temple',
          'Sample taiyaki (fish-shaped cake)',
          'Ramen lunch at local favorite spot',
          'Green tea ceremony experience',
          'Explore Harajuku and Takeshita Street',
          'Crepe and mochi tasting',
          'Shibuya Crossing photo stop',
          'Yakitori dinner in local izakaya'
        ],
        meals: ['Multiple tastings throughout the day']
      }
    ]
  },
  {
    id: '4',
    title: 'Safari & Wildlife Experience',
    location: 'Serengeti, Tanzania',
    duration: '3 days',
    price: 1299,
    rating: 4.9,
    reviews: 634,
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&auto=format&fit=crop&q=80',
    groupSize: 'Max 10',
    nextAvailable: 'Jan 5',
  },
  {
    id: '5',
    title: 'Santorini Sunset Cruise',
    location: 'Santorini, Greece',
    duration: '5 hours',
    price: 179,
    rating: 4.8,
    reviews: 1456,
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&auto=format&fit=crop&q=80',
    groupSize: 'Max 15',
    nextAvailable: 'Tomorrow',
  },
  {
    id: '6',
    title: 'Machu Picchu Hiking Tour',
    location: 'Cusco, Peru',
    duration: '4 days',
    price: 899,
    rating: 5.0,
    reviews: 987,
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&auto=format&fit=crop&q=80',
    groupSize: 'Max 12',
    nextAvailable: 'Dec 20',
  },
]
