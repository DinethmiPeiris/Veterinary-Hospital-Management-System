import { useEffect, useRef } from 'react'

export default function About() {
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
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="paw-bg" aria-hidden="true"></div>
      <div className="container">
        <div className="about-inner">
          <div className="about-img-block reveal-left" ref={leftRef}>
            <img src="/dog_and_cat.jpg" alt="Happy Dog and Cat Sitting Together" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%',boxShadow:'0 12px 36px rgba(0,0,0,0.15)'}} />
            <div className="about-badge-float">
              <div className="abf-icon">🏆</div>
              <div className="abf-text">
                <strong>15+</strong>
                <span>Years of Trusted Care</span>
              </div>
            </div>
            <div className="about-badge-float-2">
              <div className="abf2-text">
                <strong>ISO Certified</strong>
                Veterinary Excellence
              </div>
            </div>
          </div>
          <div className="reveal-right" ref={rightRef}>
            <span className="section-label">🏥 About Us</span>
            <h2 className="section-title" id="about-title">Where Pets Receive the<br/><span>Best Care Possible</span></h2>
            <p className="section-subtitle">Sri Jayawardanapura Animal Hospital is Sri Lanka's premier veterinary facility, combining cutting-edge medical technology with warm, compassionate care for every pet.</p>
            <p className="section-subtitle" style={{marginTop:'14px'}}>Our state-of-the-art digital management system ensures seamless coordination between pet owners, doctors, and hospital administrators &mdash; making pet healthcare easier, faster, and more transparent than ever before.</p>
            <div className="about-features">
              <div className="about-feat">
                <div className="about-feat-icon">🩺</div>
                <div><p>Specialist Veterinarians</p><small>Board-certified experts in every discipline</small></div>
              </div>
              <div className="about-feat">
                <div className="about-feat-icon">💻</div>
                <div><p>Digital Health Records</p><small>Complete pet health history at your fingertips</small></div>
              </div>
              <div className="about-feat">
                <div className="about-feat-icon">🔬</div>
                <div><p>Advanced Diagnostics</p><small>In-house lab, imaging &amp; pathology</small></div>
              </div>
              <div className="about-feat">
                <div className="about-feat-icon">📱</div>
                <div><p>Online Appointments</p><small>Book &amp; manage visits from anywhere</small></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
