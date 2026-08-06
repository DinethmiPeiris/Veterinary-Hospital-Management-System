import { useEffect, useRef, useCallback } from 'react'

const petEmojis = ['🐕','🐈','🐇','🦜','🐠','🐹','🐾','🦮','🐩','🐈‍⬛','🦔','🐢']

function CountUp({ target }) {
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

export default function Hero() {
  const floatingRef = useRef(null)

  const createPet = useCallback(() => {
    const container = floatingRef.current
    if (!container) return
    const pet = document.createElement('div')
    pet.classList.add('floating-pet')
    pet.textContent = petEmojis[Math.floor(Math.random() * petEmojis.length)]
    pet.style.left = Math.random() * 100 + '%'
    const dur = 18 + Math.random() * 20
    const del = Math.random() * 5
    pet.style.animationDuration = dur + 's'
    pet.style.animationDelay = del + 's'
    pet.style.fontSize = (1.2 + Math.random() * 1.5) + 'rem'
    container.appendChild(pet)
    setTimeout(() => { if (pet.parentNode) pet.parentNode.removeChild(pet) }, (dur + del) * 1000 + 500)
  }, [])

  useEffect(() => {
    const timeouts = []
    for (let i = 0; i < 6; i++) timeouts.push(setTimeout(createPet, i * 600))
    const interval = setInterval(createPet, 3000)
    return () => { timeouts.forEach(clearTimeout); clearInterval(interval) }
  }, [createPet])

  useEffect(() => {
    const onScroll = () => {
      const pattern = document.querySelector('.hero-paw-pattern')
      if (pattern) pattern.style.transform = 'translateY(' + window.scrollY * 0.3 + 'px)'
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="hero" id="hero">
      <div className="hero-mesh" aria-hidden="true"></div>
      <div className="hero-paw-pattern" aria-hidden="true"></div>
      <div className="floating-pets-container" aria-hidden="true" ref={floatingRef}></div>
      <div className="container">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot"></span>
              Sri Lanka's Premier Veterinary Hospital
            </div>
            <p className="hero-hospital-name">Sri Jayawardanapura Animal Hospital</p>
            <h1 className="hero-title">Compassionate Care.<br/><span style={{color:'#7ee9d1'}}>Advanced Technology.</span></h1>
            <p style={{fontSize:'clamp(1.1rem,2.5vw,1.55rem)',fontWeight:500,color:'rgba(255,255,255,0.82)',marginBottom:'16px'}}>Healthier Pets. Happier Families.</p>
            <p className="hero-desc">A modern veterinary hospital that blends compassionate pet care with advanced digital management tools &mdash; giving pet owners, doctors, and administrators a seamless healthcare experience.</p>
            <div className="hero-btns"></div>
            <div className="hero-stats">
              <div className="hero-stat">
                <strong><CountUp target={1200} />+</strong>
                <span>Happy Patients</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <strong><CountUp target={18} />+</strong>
                <span>Expert Vets</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <strong><CountUp target={15} />+</strong>
                <span>Years of Care</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-deco hero-deco-1" aria-hidden="true"></div>
            <div className="hero-deco hero-deco-2" aria-hidden="true"></div>
            <div className="hero-card-main">
              <div className="db-window-controls" style={{display:'flex',gap:'8px',marginBottom:'20px',padding:'0 4px'}}>
                <span style={{width:'12px',height:'12px',borderRadius:'50%',background:'#ff5f56',display:'inline-block',boxShadow:'0 0 0 1px rgba(255,255,255,.1)'}}></span>
                <span style={{width:'12px',height:'12px',borderRadius:'50%',background:'#ffbd2e',display:'inline-block',boxShadow:'0 0 0 1px rgba(255,255,255,.1)'}}></span>
                <span style={{width:'12px',height:'12px',borderRadius:'50%',background:'#27c93f',display:'inline-block',boxShadow:'0 0 0 1px rgba(255,255,255,.1)'}}></span>
              </div>
              <div className="dashboard-preview" style={{marginBottom:0}}>
                <div className="db-header">
                  <span className="db-title">🏥 Control Center</span>
                  <span className="db-badge">● Live Sync</span>
                </div>
                <div className="db-stats-row">
                  <div className="db-stat-card"><div className="num">47</div><div className="lbl">Appts</div></div>
                  <div className="db-stat-card"><div className="num">12</div><div className="lbl">Admitted</div></div>
                  <div className="db-stat-card"><div className="num">5</div><div className="lbl">Staff</div></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  <div className="db-chart" style={{marginBottom:0}}>
                    <div className="db-chart-label">Traffic (7d)</div>
                    <div className="db-chart-bars">
                      <div className="bar" style={{height:'45%'}}></div>
                      <div className="bar" style={{height:'62%'}}></div>
                      <div className="bar" style={{height:'50%'}}></div>
                      <div className="bar" style={{height:'80%'}}></div>
                      <div className="bar active" style={{height:'95%'}}></div>
                      <div className="bar" style={{height:'70%'}}></div>
                      <div className="bar" style={{height:'55%'}}></div>
                    </div>
                  </div>
                  <div className="db-activity-feed" style={{background:'rgba(255,255,255,.12)',borderRadius:'10px',padding:'12px',border:'1px solid rgba(255,255,255,.2)'}}>
                    <div className="db-chart-label">Live Activity</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,.15)',padding:'8px',borderRadius:'8px'}}>
                        <div style={{width:'28px',height:'28px',background:'rgba(77,184,160,.4)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>🐕</div>
                        <div>
                          <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--white)',lineHeight:1.2}}>Buddy Checked-in</div>
                          <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.8)',fontWeight:600,marginTop:'2px'}}>Dr. Perera • 2m ago</div>
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,.15)',padding:'8px',borderRadius:'8px'}}>
                        <div style={{width:'28px',height:'28px',background:'rgba(233,30,99,.3)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>💉</div>
                        <div>
                          <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--white)',lineHeight:1.2}}>Luna Vaccinated</div>
                          <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.8)',fontWeight:600,marginTop:'2px'}}>Room 3 • 15m ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{marginTop:'16px',background:'rgba(255,255,255,.12)',borderRadius:'10px',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',border:'1px solid rgba(255,255,255,.3)',boxShadow:'0 6px 20px rgba(0,0,0,.15)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
                  <div style={{display:'flex'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#4db8a0',border:'2px solid rgba(255,255,255,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',color:'white',zIndex:3,boxShadow:'0 2px 8px rgba(0,0,0,.25)'}}>🧑‍⚕️</div>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#2a9dcc',border:'2px solid rgba(255,255,255,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',color:'white',marginLeft:'-12px',zIndex:2,boxShadow:'0 2px 8px rgba(0,0,0,.25)'}}>👩‍⚕️</div>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#f9a825',border:'2px solid rgba(255,255,255,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',color:'white',marginLeft:'-12px',zIndex:1,boxShadow:'0 2px 8px rgba(0,0,0,.25)'}}>👨‍⚕️</div>
                  </div>
                  <div>
                    <div style={{fontSize:'.75rem',fontWeight:800,color:'white'}}>Medical Team Online</div>
                    <div style={{fontSize:'.65rem',color:'rgba(255,255,255,.9)',fontWeight:600}}>3 Specialists available</div>
                  </div>
                </div>
                <div style={{width:'10px',height:'10px',borderRadius:'50%',background:'#7ee9d1',boxShadow:'0 0 0 4px rgba(126,233,209,.4)',animation:'pulse 2s infinite'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
