import { useEffect, useRef } from 'react'

function CountUp({ target, suffix = '' }) {
  const ref = useRef(null)
  const counted = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true
          const duration = 2000
          const step = target / (duration / 16)
          let current = 0
          const timer = setInterval(() => {
            current += step
            if (current >= target) { current = target; clearInterval(timer) }
            el.textContent = Math.floor(current).toLocaleString()
          }, 16)
        }
      })
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>0</span>
}

export default function WhyUs() {
  const leftRef = useRef(null)
  const rightRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible')
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    if (leftRef.current) observer.observe(leftRef.current)
    if (rightRef.current) observer.observe(rightRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="why" id="why" aria-labelledby="why-title">
      <div className="why-mesh" aria-hidden="true"></div>
      <div className="paw-bg" aria-hidden="true"></div>
      <div className="container">
        <div className="why-inner">
          <div className="reveal-left why-left" ref={leftRef}>
            <span className="section-label">⭐ Why Choose Us</span>
            <h2 className="section-title" id="why-title">The Smart Choice for<br/><span>Your Pet's Health</span></h2>
            <p className="section-subtitle">We combine decades of veterinary expertise with modern technology to deliver healthcare that is accessible, transparent, and truly caring.</p>
            <div className="why-grid">
              <div className="why-card">
                <div className="why-card-icon">👨‍⚕️</div>
                <h4>Expert Veterinarians</h4>
                <p>Board-certified specialists with 10+ years of experience across all animal species.</p>
              </div>
              <div className="why-card">
                <div className="why-card-icon">🔬</div>
                <h4>Modern Technology</h4>
                <p>Latest diagnostic imaging, in-house lab, and advanced surgical equipment.</p>
              </div>
              <div className="why-card">
                <div className="why-card-icon">📋</div>
                <h4>Digital Records</h4>
                <p>Comprehensive electronic health records accessible anytime, anywhere online.</p>
              </div>
              <div className="why-card">
                <div className="why-card-icon">🤝</div>
                <h4>Trusted Pet Care</h4>
                <p>Over 15 years of building trust with families across Sri Lanka.</p>
              </div>
              <div className="why-card">
                <div className="why-card-icon">📅</div>
                <h4>Easy Appointments</h4>
                <p>Book, reschedule or cancel appointments instantly from your device.</p>
              </div>
            </div>
          </div>
          <div className="why-right reveal-right" ref={rightRef}>
            <div className="why-quote">
              <p className="why-quote-text">"Sri Jayawardanapura Animal Hospital saved my dog Buddy's life last year. The doctors were incredibly skilled, the facility was spotless, and the online system made everything so easy. I would not trust any other hospital with my pets."</p>
              <div className="why-quote-author">
                <div className="wqa-avatar">🧑</div>
                <div className="wqa-info">
                  <strong>Priya Mendis</strong>
                  <span>Pet Owner &bull; Colombo, Sri Lanka</span>
                </div>
              </div>
            </div>
            <div className="why-numbers">
              <div className="wn-card"><strong><CountUp target={1200} />+</strong><span>Patients Treated</span></div>
              <div className="wn-card"><strong><CountUp target={98} />%</strong><span>Satisfaction Rate</span></div>
              <div className="wn-card"><strong><CountUp target={18} />+</strong><span>Specialist Vets</span></div>
            </div>
            <div className="why-quote" style={{padding:'28px 36px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'16px'}}>
                <div style={{width:'48px',height:'48px',background:'rgba(249,168,37,.2)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>🏆</div>
                <div>
                  <div style={{fontWeight:800,color:'white',fontSize:'.95rem'}}>ISO 9001:2015 Certified</div>
                  <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.6)'}}>International Quality Standard</div>
                </div>
              </div>
              <p style={{fontSize:'.85rem',color:'rgba(255,255,255,.75)',lineHeight:1.6}}>Our commitment to quality is recognized at an international level. We maintain rigorous standards in every aspect of veterinary care and hospital management.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
