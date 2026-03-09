import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Metadata } from 'next'
import { MapPin, Mail, Phone, Clock, Send } from 'lucide-react'
import { ScrollReveal } from '@/components/scroll-reveal'
import { ContactForm } from '@/components/contact-form'

export const metadata: Metadata = {
  title: 'Contact Us - Omnia Destinations',
  description: 'Get in touch with Omnia Destinations. We are here to help you plan your perfect journey.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-75 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="container relative z-10 flex h-full items-center justify-center px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground">
              Contact <span className="text-primary">Us</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question or ready to start your journey? We're here to help!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="container px-4">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Contact Information */}
            <div className="lg:col-span-2 space-y-8">
              <ScrollReveal direction="left">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                    Get In <span className="text-primary">Touch</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    Whether you're planning your next adventure or have questions about our services, 
                    our team is ready to assist you.
                  </p>
                </div>
              </ScrollReveal>

              {/* Contact Cards */}
              <div className="space-y-4">
                <ScrollReveal direction="left" delay={0.1}>
                  <div className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300">
                    <div className="shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">Our Location</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Bole, by Gazebo roundabout,<br />
                        Rizq building, 9th floor,<br />
                        Addis Ababa, Ethiopia
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="left" delay={0.2}>
                  <div className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300">
                    <div className="shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">Email Us</h3>
                      <a 
                        href="mailto:info@omniadestinations.com" 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@omniadestinations.com
                      </a>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="left" delay={0.3}>
                  <div className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300">
                    <div className="shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">Call Us</h3>
                      <a 
                        href="tel:+251925919293" 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        +251-925-919-293
                      </a>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="left" delay={0.4}>
                  <div className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300">
                    <div className="shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">Business Hours</h3>
                      <p className="text-sm text-muted-foreground">
                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                        Saturday: 10:00 AM - 4:00 PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <ScrollReveal direction="right" delay={0.2}>
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:p-10 shadow-xl">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                    Send Us A <span className="text-primary">Message</span>
                  </h2>
                  <ContactForm />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container px-4">
          <ScrollReveal direction="up">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-8">
              Find Us On The <span className="text-primary">Map</span>
            </h2>
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d985.1712287771848!2d38.76635026948687!3d9.001112624031121!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b851a385e5d77%3A0xd89cdef8196ca3e5!2sOmnia%20Business%20and%20Leisure%20Travel%20(Omnia%20travel)!5e0!3m2!1sen!2set!4v1770298655140!5m2!1sen!2set" 
                width="100%" 
                height="450" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  )
}
