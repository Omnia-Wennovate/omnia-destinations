import Image from 'next/image'
import { Metadata } from 'next'
import { ScrollReveal } from '@/components/scroll-reveal'
import { TypewriterText } from '@/components/typewriter-text'

export const metadata: Metadata = {
  title: 'About Us - Omnia Destinations',
  description: 'Learn about Omnia Destinations, your ultimate travel partner for all your wanderlust and business travel needs.',
}

export default function AboutPage() {
  const partners = [
    {
      name: 'Ethiopian Airlines',
      logo: '/images/partners/ethiopian-airlines.png',
    },
    {
      name: 'Ethiopia Land of Origins',
      logo: '/images/partners/ethiopia-land-of-origins.png',
    },
    {
      name: 'Visit Oromia',
      logo: '/images/partners/visit-oromia.png',
    },
    {
      name: 'Oromia Tourism Commission',
      logo: '/images/partners/oromia-tourism-commission.png',
    },
  ]

  return (
    <main className="min-h-screen">
      {/* Hero Section with Team Photo Background */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/team-photo.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-background/80" />
        <div className="container relative z-10 flex h-full items-end pb-12 sm:pb-16 justify-center px-4">
          <TypewriterText 
            text="About Us" 
            highlightWord="Us"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white text-center drop-shadow-lg"
            speed={120}
          />
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="container px-4">
          <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Text Content */}
            <ScrollReveal direction="left">
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                  Welcome to <span className="text-primary">Omnia</span>
                </h2>
                <div className="space-y-4 text-base sm:text-lg leading-relaxed text-foreground/80">
                  <p>
                    Welcome to <span className="font-semibold text-primary">Omnia</span> Destinations, your ultimate travel partner for all your wanderlust and business travel needs. We are a travel company founded by <span className="font-semibold text-foreground">Alamin</span>, a passionate traveler and entrepreneur, with the vision to help people explore and experience the world like never before.
                  </p>
                  <p>
                    The idea of <span className="font-semibold text-primary">Omnia</span> Destinations was born during the Indonesian trade expo in partnership with the embassy in Addis Ababa. Alamin was amazed by the beauty and diversity of Indonesia and felt a strong urge to share this with the world. He realized that there was a need for a travel company that not only offered <span className="font-semibold text-foreground">personalized travel experiences</span> but also focused on <span className="font-semibold text-foreground">responsible tourism</span>.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Team Photo */}
            <ScrollReveal direction="right">
              <div className="relative order-first lg:order-last">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl">
                  <Image
                    src="/images/team-photo.jpg"
                    alt="Omnia Destinations Team at Soft Opening"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
                <div className="absolute -bottom-4 sm:-bottom-6 -right-4 sm:-right-6 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -top-4 sm:-top-6 -left-4 sm:-left-6 h-32 sm:h-40 w-32 sm:w-40 rounded-full bg-primary/10 blur-3xl" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-8 sm:mb-12">
            Companies We <span className="text-primary">Work With</span>
          </h2>
          
          {/* Scrolling Logo Container */}
          <div className="relative overflow-hidden">
            {/* Gradient overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-muted/30 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-muted/30 to-transparent z-10" />
            
            {/* Scrolling logos */}
            <div className="flex animate-scroll-horizontal">
              {/* First set of logos */}
              {partners.map((partner, index) => (
                <div
                  key={`partner-1-${index}`}
                  className="flex-shrink-0 mx-6 sm:mx-8 lg:mx-12 flex items-center justify-center h-20 sm:h-24 w-36 sm:w-48"
                >
                  <Image
                    src={partner.logo || "/placeholder.svg"}
                    alt={partner.name}
                    width={192}
                    height={96}
                    className="object-contain transition-all duration-300 hover:scale-110"
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {partners.map((partner, index) => (
                <div
                  key={`partner-2-${index}`}
                  className="flex-shrink-0 mx-6 sm:mx-8 lg:mx-12 flex items-center justify-center h-20 sm:h-24 w-36 sm:w-48"
                >
                  <Image
                    src={partner.logo || "/placeholder.svg"}
                    alt={partner.name}
                    width={192}
                    height={96}
                    className="object-contain transition-all duration-300 hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="container px-4">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            <ScrollReveal direction="up" delay={0}>
              <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg transition-shadow hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">Our Mission</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  To provide personalized and sustainable travel experiences that inspire, educate, and create
                  lasting memories for our clients.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.1}>
              <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg transition-shadow hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">Our Values</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Integrity, sustainability, customer satisfaction, and cultural respect guide everything we do
                  in creating exceptional travel experiences.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
              <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg transition-shadow hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">Our Vision</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  To be the leading travel company that connects people with authentic experiences across the
                  globe through responsible and innovative tourism.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </main>
  )
}
