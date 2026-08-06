import { useEffect, useRef } from 'react'

export default function Services() {
  const refs = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseFloat(entry.target.style.transitionDelay || '0') * 1000
          setTimeout(() => entry.target.classList.add('visible'), delay > 0 ? delay : 0)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    refs.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  return (
    <section className="services" id="services" aria-labelledby="services-title">
      <div className="container">
        <div className="services-header reveal" ref={(el) => { refs.current[0] = el }}>
          <span className="section-label">🏥 Our Services</span>
          <h2 className="section-title" id="services-title">Comprehensive <span>Veterinary Care</span></h2>
          <p className="section-subtitle">From routine check-ups to emergency surgeries, we provide a full spectrum of veterinary services with the highest standards of care.</p>
        </div>
        <div className="services-grid">
          <article className="service-card sc-1 reveal" tabIndex="0" ref={(el) => { refs.current[1] = el }}>
            <div className="service-icon-wrap si-1">🩺</div>
            <h3>Pet Consultations</h3>
            <p>Comprehensive wellness exams and health consultations by our experienced veterinary team.</p>
          </article>
          <article className="service-card sc-2 reveal" tabIndex="0" style={{transitionDelay:'.08s'}} ref={(el) => { refs.current[2] = el }}>
            <div className="service-icon-wrap si-2">💉</div>
            <h3>Vaccinations</h3>
            <p>Complete vaccination programs to protect your pets from preventable diseases and infections.</p>
          </article>
          <article className="service-card sc-3 reveal" tabIndex="0" style={{transitionDelay:'.16s'}} ref={(el) => { refs.current[3] = el }}>
            <div className="service-icon-wrap si-3">🔪</div>
            <h3>Surgery</h3>
            <p>State-of-the-art surgical facilities with board-certified veterinary surgeons and modern equipment.</p>
          </article>
          <article className="service-card sc-5 reveal" tabIndex="0" style={{transitionDelay:'.24s'}} ref={(el) => { refs.current[4] = el }}>
            <div className="service-icon-wrap si-5">📊</div>
            <h3>Health Monitoring</h3>
            <p>Advanced diagnostic tools and continuous health monitoring to track your pet's wellness journey.</p>
          </article>
        </div>
      </div>
    </section>
  )
}
