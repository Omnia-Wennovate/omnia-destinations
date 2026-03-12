import { SearchSection } from '@/components/search-section'
import { PackagesSection } from '@/components/packages-section'
import { TopDestinationsSection } from '@/components/top-destinations-section'
import { PopularToursSection } from '@/components/popular-tours-section'

export default function Home() {
  return (
    <>
      <SearchSection />
      <PackagesSection />
      <TopDestinationsSection />
      <PopularToursSection />
    </>
  )
}
