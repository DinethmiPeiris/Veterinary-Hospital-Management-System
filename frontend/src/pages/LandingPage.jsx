import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import PetsBanner from '../components/PetsBanner'
import About from '../components/About'
import Services from '../components/Services'
import WhyUs from '../components/WhyUs'
import CTA from '../components/CTA'
import Footer from '../components/Footer'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <PetsBanner />
      <About />
      <Services />
      <WhyUs />
      <CTA />
      <Footer />
    </>
  )
}
