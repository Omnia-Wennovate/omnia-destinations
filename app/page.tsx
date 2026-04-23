import { SearchSection } from '@/components/search-section'
import { PackagesSection } from '@/components/packages-section'
import { TestimonialsSlider } from '@/components/testimonials-slider'
import { PopularToursSection } from '@/components/popular-tours-section'

export default function Home() {
  return (
    <>
      <SearchSection />
      <PackagesSection />
      <TestimonialsSlider />
      <PopularToursSection />
    </>
  )
}
