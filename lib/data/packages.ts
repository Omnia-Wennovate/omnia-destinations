import type { Package } from '@/lib/types'

export const PACKAGES: Package[] = [
  {
    id: 'mombasa',
    slug: 'mombasa',
    title: 'Mombasa',
    location: 'Mombasa, Kenya',
    image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&auto=format&fit=crop&q=80',
    duration: '5 Days',
    durationDays: 5,
    singlePrice: 249000,
    sharingPrice: 219000,
    hidePricing: false,
    rating: 4.9,
    reviews: 242,
    groupSize: 'Private or Small Group',
    nextAvailable: 'Year Round',
    description: 'Embark on an extraordinary 5-day Kenyan coastal escape to tropical Mombasa and pristine Diani Beach. From powdery white coral sands and dolphin encounters at Kisite Marine Park to a candlelit Kongo River mangrove sunset canoe expedition and historic Swahili culture, experience the finest Indian Ocean paradise.',
    difficulty: 'Easy',
    minAge: 0,
    maxPeople: 16,
    highlights: [
      'Relax in beachfront luxury at Diani Reef Beach Resort & Spa, Kenya',
      'Full-day Wasini Island dolphin cruise & Kisite Marine Park reef snorkeling',
      'Candlelit Kongo River sundowner canoe trip through coastal mangroves',
      'Traditional Swahili seafood feast on Wasini Island',
      'Explore Fort Jesus & historic Old Town Mombasa',
      'Scenic Indian Ocean coastal relaxation on award-winning Diani Beach'
    ],
    included: [
      'All airport transfers to and from Mombasa Moi International Airport (MBA)',
      '4 nights 5-star accommodation at Diani Reef Beach Resort & Spa',
      'Daily buffet breakfast at the resort',
      'Traditional Swahili seafood feast on Wasini Island',
      'Kongo River mangrove sunset canoe expedition & dinner',
      'All national marine park entrance fees & conservation charges',
      'Private air-conditioned vehicle transfers throughout',
      'Licensed bilingual local guides and boat captains',
      'Snorkeling gear and safety equipment'
    ],
    excluded: [
      'International long-haul flights from country of origin',
      'Kenya tourist entry visa (e-Visa)',
      'Travel and medical insurance (mandatory)',
      'Dinner drinks & alcoholic beverages (unless specified)',
      'Personal expenses, laundry, and souvenirs',
      'Discretionary tips and gratuities for guides and drivers'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Mombasa & Transfer to Diani Beach',
        description: 'Touchdown at Moi International Airport (MBA) in Mombasa. Our private chauffeur greets you and whisks you south along the Kenyan coast to the award-winning Diani Reef Beach Resort & Spa. Check in, enjoy welcome tropical cocktails, and unwind on the powdery white coral sands before a coastal welcome dinner.',
        activities: [
          'Airport VIP meet & greet',
          'Scenic private coastal transfer to Diani',
          'Resort orientation & beachfront check-in',
          'Sunset stroll on Diani Beach',
          'Welcome dinner at Coral Rock Restaurant'
        ],
        meals: ['Dinner'],
        accommodation: 'Diani Reef Beach Resort & Spa (5-Star)'
      },
      {
        day: 2,
        title: 'Wasini Island Ocean Safari & Kisite Marine Park',
        description: 'Early morning departure for Shimoni jetty to board a traditional handcrafted dhow. Sail into the open Indian Ocean watching for resident spinner and bottlenose dolphins. Anchor at Kisite Mpunguti Marine Park for world-class snorkeling amid pristine coral gardens, followed by a lavish Swahili crab and seafood feast on Wasini Island.',
        activities: [
          'Dhow sailing in the Indian Ocean',
          'Wild dolphin encounter',
          'Guided reef snorkeling at Kisite Marine Park',
          'Swahili seafood banquet on Wasini Island',
          'Wasini cultural village walk'
        ],
        meals: ['Breakfast', 'Lunch'],
        accommodation: 'Diani Reef Beach Resort & Spa (5-Star)'
      },
      {
        day: 3,
        title: 'Kongo River Mangrove Sunset Canoe & Beach Sundowner',
        description: 'Enjoy a relaxed morning indulging in spa treatments or ocean swimming. In the late afternoon, journey to the Kongo River estuary where sweet river water meets the sea. Glide through dense mangrove forests by traditional wooden dugout canoe, spotting kingfishers and herons as the African sun melts into the horizon.',
        activities: [
          'Morning beach relaxation & watersports',
          'Guided Kongo River mangrove canoe paddle',
          'Estuary bird watching',
          'Golden hour photography session',
          'Candlelit beach dinner'
        ],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Diani Reef Beach Resort & Spa (5-Star)'
      },
      {
        day: 4,
        title: 'Historic Old Town Mombasa & Fort Jesus',
        description: 'Take a fascinating cultural day excursion into historic Mombasa Old Town. Wander atmospheric alleys reflecting Portuguese, Arab, and British architecture, visit the UNESCO World Heritage Fort Jesus museum, and shop for handcrafted souvenirs at the spice and woodcarving markets.',
        activities: [
          'Guided tour of Fort Jesus UNESCO site',
          'Mombasa Old Town cultural walk',
          'Spice market exploration and souvenir shopping',
          'Afternoon leisure on Diani Beach',
          'Seafood dinner by the ocean'
        ],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Diani Reef Beach Resort & Spa (5-Star)'
      },
      {
        day: 5,
        title: 'Diani Beach Leisure & Departure Transfer',
        description: 'Savor a relaxed final morning breakfast overlooking the turquoise Indian Ocean waves. Take a last refreshing swim before your private chauffeur transfers you back to Moi International Airport (MBA) in Mombasa for your outbound journey.',
        activities: [
          'Leisurely oceanfront breakfast',
          'Beach relaxation & hotel checkout',
          'Private transfer to Mombasa International Airport',
          'Departure assistance'
        ],
        meals: ['Breakfast']
      }
    ]
  },
  {
    id: 'zanzibar',
    slug: 'zanzibar',
    title: 'Zanzibar',
    location: 'Zanzibar, Tanzania',
    image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=1200&auto=format&fit=crop&q=80',
    duration: '5 Days',
    durationDays: 5,
    singlePrice: 339000,
    sharingPrice: 299000,
    hidePricing: false,
    rating: 4.9,
    reviews: 312,
    groupSize: 'Private or Small Group',
    nextAvailable: 'Year Round',
    description: 'Immerse yourself in the exotic charm of Zanzibar, the legendary Spice Island of Tanzania. Discover UNESCO-listed Stone Town alleys, cruise to Prison Island to encounter giant Aldabra tortoises, swim alongside wild dolphins at Mnemba Atoll, take a dip with sea turtles at Salaam Cave, and dine at the world-famous The Rock Restaurant.',
    difficulty: 'Easy',
    minAge: 0,
    maxPeople: 16,
    highlights: [
      '4 nights luxury beachfront resort accommodation in Nungwi & Stone Town',
      'Private marine safari to Mnemba Atoll with wild dolphin swimming',
      'UNESCO World Heritage Stone Town walking tour & House of Wonders',
      'Prison Island boat expedition & endangered Aldabra giant tortoise sanctuary',
      'Zanzibar spice plantation tour & exotic tropical fruit tasting',
      'Swim with sea turtles at Salaam Cave & dine at the iconic The Rock Restaurant'
    ],
    included: [
      'Roundtrip private airport transfers from Abeid Amani Karume Airport (ZNZ)',
      '4 nights luxury beachfront resort accommodation in Stone Town & Nungwi',
      'Daily buffet breakfast at all resorts',
      'Spice farm tour with authentic Swahili culinary tasting',
      'Private boat rides to Prison Island & Mnemba Atoll',
      'All national marine park entrance fees & conservation charges',
      'Private air-conditioned vehicle transfers throughout',
      'Licensed bilingual local guides and boat captains',
      'Snorkeling gear and safety equipment'
    ],
    excluded: [
      'International long-haul flights from country of origin',
      'Tanzania tourist entry visa (e-Visa)',
      'Travel and medical insurance (mandatory)',
      'Dinner drinks & alcoholic beverages (unless specified)',
      'Personal expenses, laundry, and souvenirs',
      'Discretionary tips and gratuities for guides and drivers'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&auto=format&fit=crop&q=80'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Zanzibar & Historic Stone Town',
        description: 'Arrive at Abeid Amani Karume International Airport (ZNZ) in Zanzibar. Meet your private chauffeur and transfer into the heart of Stone Town, a UNESCO World Heritage site. Wander labyrinthine cobblestone alleys admiring ornate brass-studded Arab doors, the Old Fort, and the Sultan’s Palace before sunset at Forodhani Night Food Market.',
        activities: [
          'Arrival meet & greet at Abeid Amani Karume Airport',
          'Stone Town heritage walking tour',
          'House of Wonders and Old Fort exploration',
          'Forodhani Gardens street food tasting',
          'Check-in & welcome dinner'
        ],
        meals: ['Dinner'],
        accommodation: 'Zanzibar Serena Hotel / Maru Maru Stone Town'
      },
      {
        day: 2,
        title: 'Zanzibar Spice Farm Experience & Prison Island Tortoises',
        description: 'Venture into lush interior plantations to experience why Zanzibar is renowned as the Spice Island. Smell, touch, and taste fresh cloves, nutmeg, cinnamon, vanilla, and black pepper. In the afternoon, cruise by private wooden motorboat to Prison Island to feed the historic 19th-century giant Aldabra tortoises.',
        activities: [
          'Guided organic spice plantation walk',
          'Seasonal tropical fruit tasting',
          'Traditional Zanzibari organic farm lunch',
          'Private boat ride to Prison Island',
          'Encounter giant Aldabra tortoises & peacock sanctuary'
        ],
        meals: ['Breakfast', 'Lunch'],
        accommodation: 'Nungwi Dreams Beach Resort (Ocean View)'
      },
      {
        day: 3,
        title: 'Mnemba Atoll Coral Reef Snorkeling & Dolphin Cruise',
        description: 'Board a private speedboat heading north toward the world-famous Mnemba Atoll. Swim alongside wild spinner dolphins in their natural playground and plunge into the turquoise shallow coral gardens surrounded by clownfish, blue-tang, and giant clams. Afternoon leisure on the crystal beaches of Nungwi.',
        activities: [
          'Mnemba Atoll private boat cruise',
          'Wild dolphin watching and swimming',
          'Reef snorkeling at Mnemba marine sanctuary',
          'Beachfront relaxation in Nungwi',
          'Cocktails at sunset'
        ],
        meals: ['Breakfast'],
        accommodation: 'Nungwi Dreams Beach Resort (Ocean View)'
      },
      {
        day: 4,
        title: 'Salaam Cave Turtle Sanctuary & The Rock Restaurant',
        description: 'Head east to explore the ancient natural Salaam Cave Aquarium, where you can swim in crystal-clear natural limestone pools alongside gentle, rescued green sea turtles. Finish this magical day with an unforgettable dining experience at The Rock Restaurant, perched high on a solitary coral outcrop in the open sea.',
        activities: [
          'Natural limestone cave swimming with green sea turtles',
          'Interaction and feeding session at turtle sanctuary',
          'Transfer to Michamvi peninsula',
          'Iconic ocean dining at The Rock Restaurant',
          'Stargazing over the Indian Ocean'
        ],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'Nungwi Dreams Beach Resort (Ocean View)'
      },
      {
        day: 5,
        title: 'Zanzibar Farewell & Departure Transfer',
        description: 'Savor a leisurely breakfast overlooking the turquoise lagoon. Take a final swim or pick up aromatic spices and Swahili handicraft souvenirs before your private chauffeur transfers you to Zanzibar Airport for your outbound flight.',
        activities: [
          'Leisurely oceanfront breakfast',
          'Last-minute souvenir and spice shopping',
          'Private airport transfer to Zanzibar International Airport',
          'Departure assistance'
        ],
        meals: ['Breakfast']
      }
    ]
  },
  {
    id: 'bali-indonesia',
    slug: 'bali-indonesia',
    title: 'Bali, Indonesia',
    location: 'Bali & Jakarta, Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=80',
    duration: '9 Days',
    durationDays: 9,
    singlePrice: 369000,
    sharingPrice: 339000,
    hidePricing: false,
    rating: 4.9,
    reviews: 482,
    groupSize: 'Private or Small Group',
    nextAvailable: 'Year Round',
    description: 'Discover the enchanting magic of the Indonesian archipelago on an unforgettable 9-day journey through cultural Jakarta and the tropical wonders of Bali. From Jakarta’s colonial heritage and Monas monument to the mist-veiled rice terraces of Ubud, sacred sea temples of Tanah Lot and Uluwatu, adrenaline-pumping ATV jungle treks, thrilling Nusa Penida island speedboat safaris with manta rays, and restorative Balinese spa rituals, experience the island of the gods in absolute luxury.',
    difficulty: 'Easy',
    minAge: 0,
    maxPeople: 16,
    highlights: [
      'Explore Jakarta’s historic Old Batavia (Kota Tua) & Monas National Monument',
      'Visit the iconic sea temple of Tanah Lot at sunset',
      'White-water or ATV quad adventure through Ubud jungle and rice paddies',
      'UNESCO World Heritage Tegallalang Rice Terraces & sacred Monkey Forest',
      'Spectacular Uluwatu clifftop temple with hypnotic Kecak & Fire Dance',
      'Full-day Nusa Penida speedboat tour: Kelingking T-Rex cliff & manta ray snorkeling',
      'Jimbaran Bay sunset beachfront candlelight seafood barbecue',
      'Authentic 2-hour Balinese herbal spa massage & flower bath ritual'
    ],
    included: [
      'Domestic flight from Jakarta (CGK) to Bali Ngurah Rai (DPS)',
      '2 nights 5-star hotel in central Jakarta (Grand Mercure / Pullman)',
      '4 nights private luxury pool villa in Ubud & 2 nights 5-star beachfront resort in Seminyak',
      'Daily gourmet buffet breakfasts',
      'Traditional Indonesian welcome dinner in Jakarta',
      'Jimbaran Bay seafood dinner under the stars',
      'High-speed round-trip catamaran/speedboat transfers to Nusa Penida',
      'Full-day Nusa Penida island guided tour with air-conditioned vehicle',
      'All temple entrance fees, sarong rentals, and Kecak dance tickets',
      'Private air-conditioned luxury vehicle transfers throughout with English-speaking chauffeur',
      'Professional 2-hour Balinese massage & traditional spa treatment'
    ],
    excluded: [
      'International flights to/from Jakarta',
      'Indonesia tourist visa-on-arrival (USD 35)',
      'Comprehensive travel and health insurance (mandatory)',
      'Lunches and dinners not explicitly specified in the itinerary',
      'Personal shopping, alcoholic drinks, and phone/data expenses',
      'Tips and gratuities for guides, boat crews, and chauffeurs'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&auto=format&fit=crop&q=80'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Jakarta – Gateway to the Archipelago',
        description: 'Touch down at Soekarno-Hatta International Airport (CGK) in Jakarta. Our representative warmly greets you with private transport to your 5-star hotel. Unpack, freshen up, and gather for an exquisite welcome dinner featuring authentic Indonesian rijsttafel specialties.',
        activities: [
          'Airport VIP meet and transfer',
          'Hotel check-in and leisure',
          'Welcome dinner featuring Indonesian delicacies',
          'Evening skyline views of Jakarta'
        ],
        meals: ['Dinner'],
        accommodation: 'Grand Mercure Jakarta Harmoni (5-Star)'
      },
      {
        day: 2,
        title: 'Colonial Old Batavia & Flight to the Island of the Gods',
        description: 'Discover the captivating historical tapestry of Jakarta with visits to the iconic National Monument (Monas), the grand Istiqlal Mosque, and the Dutch colonial architecture of Fatahillah Square in Kota Tua. In the afternoon, board your flight across the Java Sea to Bali, landing in Denpasar before transferring to Ubud.',
        activities: [
          'Monas National Monument tour',
          'Old Batavia (Kota Tua) heritage stroll',
          'Transfer to airport and domestic flight to Bali',
          'Scenic drive into the lush hills of Ubud',
          'Check-in to private pool villa'
        ],
        meals: ['Breakfast'],
        accommodation: 'Komaneka at Monkey Forest / Ubud Private Pool Villa'
      },
      {
        day: 3,
        title: 'Ubud Rice Terraces, Sacred Monkey Forest & Artisan Villages',
        description: 'Awaken to the soothing sounds of the jungle. Explore the Sacred Monkey Forest Sanctuary with hundreds of playful Balinese macaques among moss-covered temple ruins. Stroll the stepped green emerald landscape of Tegallalang Rice Terraces, test your courage on the jungle swing, and visit the artisan woodcarving village of Mas.',
        activities: [
          'Guided walk through Ubud Sacred Monkey Forest',
          'Tegallalang Rice Terrace valley hike',
          'Famous jungle swing photo opportunity',
          'Mas and Celuk artisan silver workshops',
          'Ubud Royal Palace & traditional market'
        ],
        meals: ['Breakfast'],
        accommodation: 'Ubud Private Pool Villa'
      },
      {
        day: 4,
        title: 'Jungle ATV Quad Adventure & Tirta Empul Holy Spring',
        description: 'Gear up for an exhilarating off-road ATV quad bike adventure cutting through dense tropical rainforests, mud tracks, bamboo groves, and hidden waterfalls. Afterward, cleanse your spirit at Tirta Empul Temple, where sacred mountain spring waters have been used for purification ceremonies for over a thousand years.',
        activities: [
          'All-terrain quad bike (ATV) jungle expedition',
          'Hidden waterfall swimming break',
          'Traditional Balinese buffet lunch',
          'Tirta Empul holy spring water purification experience',
          'Coffee plantation Luwak tasting'
        ],
        meals: ['Breakfast', 'Lunch'],
        accommodation: 'Ubud Private Pool Villa'
      },
      {
        day: 5,
        title: 'Besakih Mother Temple & Sunset at Tanah Lot',
        description: 'Journey up the slopes of Mount Agung to Besakih, Bali’s grandest and holiest temple complex comprising over 80 individual shrines. In the late afternoon, head west to the Indian Ocean coast to witness the dramatic sunset silhouette of Tanah Lot Temple, perched dramatically on a wave-carved offshore rock.',
        activities: [
          'Besakih Mother Temple guided tour',
          'Scenic mountain highland vistas',
          'Afternoon coastal drive to Tanah Lot',
          'Sunset viewing over Tanah Lot rock temple',
          'Transfer to Seminyak beachfront resort'
        ],
        meals: ['Breakfast'],
        accommodation: 'The Seminyak Beach Resort & Spa'
      },
      {
        day: 6,
        title: 'Nusa Penida Island Safari: Kelingking T-Rex Cliff & Manta Rays',
        description: 'Early departure by private luxury speedboat to the dramatic offshore island of Nusa Penida. Marvel at the breathtaking T-Rex headland at Kelingking Beach, gaze down into the natural infinity pool of Angel’s Billabong, admire Broken Beach’s circular cliff arch, and snorkel with majestic manta rays in Crystal Bay.',
        activities: [
          'High-speed catamaran to Nusa Penida',
          'Kelingking Beach iconic viewpoint photography',
          'Angel\'s Billabong & Broken Beach exploration',
          'Snorkeling with giant manta rays in Crystal Bay',
          'Return speedboat to mainland Bali'
        ],
        meals: ['Breakfast', 'Lunch'],
        accommodation: 'The Seminyak Beach Resort & Spa'
      },
      {
        day: 7,
        title: 'Uluwatu Clifftop Temple, Kecak Dance & Jimbaran Seafood Dinner',
        description: 'Spend a relaxing morning lounging by the Seminyak infinity pool or surfing gentle swells. In the late afternoon, travel to the southern tip of Bali at Uluwatu, perched 70 meters above churning ocean waves. Watch the hypnotic Kecak Fire Dance as twilight falls, followed by an oceanfront candlelight seafood feast right on the sand at Jimbaran Bay.',
        activities: [
          'Leisure morning in Seminyak',
          'Uluwatu Clifftop Temple tour',
          'Hypnotic sunset Kecak & Fire Dance show',
          'Jimbaran Bay beachfront grilled seafood dinner under the stars'
        ],
        meals: ['Breakfast', 'Dinner'],
        accommodation: 'The Seminyak Beach Resort & Spa'
      },
      {
        day: 8,
        title: 'Balinese Luxury Spa Ritual & Seminyak Sunset',
        description: 'Pamper yourself with a 2-hour signature Balinese spa therapy, combining traditional body scrub, deep tissue acupressure massage with aromatic oils, and a therapeutic tropical flower petal bath. Spend the afternoon exploring Seminyak’s chic designer boutiques and beach clubs.',
        activities: [
          '2-hour holistic Balinese massage & flower bath',
          'Seminyak boutiques & art gallery stroll',
          'Afternoon tea at beachfront club',
          'Farewell sunset cocktails'
        ],
        meals: ['Breakfast'],
        accommodation: 'The Seminyak Beach Resort & Spa'
      },
      {
        day: 9,
        title: 'Departure – Farewell Bali',
        description: 'Relish a final tropical breakfast by the ocean waves. Savor your last dip in the pool before your private chauffeur transfers you to Ngurah Rai International Airport (DPS) for your homeward journey.',
        activities: [
          'Leisurely beachfront breakfast',
          'Hotel checkout with concierge assistance',
          'Private luxury transfer to Ngurah Rai International Airport',
          'Departure homeward'
        ],
        meals: ['Breakfast']
      }
    ]
  }
]
