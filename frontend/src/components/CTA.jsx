import { useEffect, useRef } from 'react'

export default function CTA() {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible')
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const scrollToContact = () => {
    const el = document.getElementById('contact')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToAbout = () => {
    const el = document.getElementById('about')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="cta-section" aria-labelledby="cta-title">
      <div className="paw-bg" aria-hidden="true"></div>
      <div className="container">
        <div className="cta-inner reveal" ref={ref}>
          <span className="section-label">🚀 Get Started Today</span>
          <h2 className="section-title" id="cta-title">Ready to Give Your Pet the<br/><span>Best Healthcare?</span></h2>
          <p className="section-subtitle">Join thousands of pet families who trust Sri Jayawardanapura Animal Hospital for all their veterinary needs.</p>
          <div className="cta-btns">
            <button className="btn btn-primary" id="cta-book-btn" onClick={scrollToContact}>🐾 Book an Appointment</button>
            <button className="btn btn-secondary" id="cta-learn-btn" onClick={scrollToAbout}>Learn More About Us</button>
          </div>
        </div>
      </div>
    </section>
  )
}
