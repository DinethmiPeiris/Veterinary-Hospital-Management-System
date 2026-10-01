import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const petEmojis = ['🐕', '🐈', '🐇', '🦜', '🐠', '🐹', '🐾', '🦮', '🐩', '🐈‍⬛', '🦔', '🐢'];

function CountUp({ target }) {
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const duration = 2000;
          const step = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = Math.floor(current).toLocaleString();
          }, 16);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>0</span>;
}

export default function Hero() {
  const floatingRef = useRef(null);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [syncStatus, setSyncStatus] = useState('LOADING');

  const fetchLiveData = async () => {
    try {
      if (!navigator.onLine) {
        setSyncStatus('OFFLINE');
        return;
      }
      const [apptsData, usersData] = await Promise.all([
        api.getAppointments().catch(() => null),
        api.getAllUsers().catch(() => null)
      ]);

      if (apptsData === null && usersData === null) {
        setSyncStatus('ERROR');
      } else {
        setSyncStatus('LIVE');
        if (Array.isArray(apptsData)) setAppointments(apptsData);
        if (Array.isArray(usersData)) setUsers(usersData);
      }
    } catch (err) {
      setSyncStatus('ERROR');
    }
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  const createPet = useCallback(() => {
    const container = floatingRef.current;
    if (!container) return;
    const pet = document.createElement('div');
    pet.classList.add('floating-pet');
    pet.textContent = petEmojis[Math.floor(Math.random() * petEmojis.length)];
    pet.style.left = Math.random() * 100 + '%';
    const dur = 18 + Math.random() * 20;
    const del = Math.random() * 5;
    pet.style.animationDuration = dur + 's';
    pet.style.animationDelay = del + 's';
    pet.style.fontSize = (1.2 + Math.random() * 1.5) + 'rem';
    container.appendChild(pet);
    setTimeout(() => { if (pet.parentNode) pet.parentNode.removeChild(pet); }, (dur + del) * 1000 + 500);
  }, []);

  useEffect(() => {
    const timeouts = [];
    for (let i = 0; i < 6; i++) timeouts.push(setTimeout(createPet, i * 600));
    const interval = setInterval(createPet, 3000);
    return () => { timeouts.forEach(clearTimeout); clearInterval(interval); };
  }, [createPet]);

  useEffect(() => {
    const onScroll = () => {
      const pattern = document.querySelector('.hero-paw-pattern');
      if (pattern) pattern.style.transform = 'translateY(' + window.scrollY * 0.3 + 'px)';
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Compute live dashboard metrics
  const totalAppts = appointments.length;
  const admittedCount = appointments.filter(a => a.status === 'APPROVED' || a.status === 'COMPLETED').length;

  const doctorsList = users.filter(u => u.role === 'DOCTOR' && u.status !== 'INACTIVE' && u.status !== 'DEACTIVATED');
  const staffCount = doctorsList.length;

  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const trafficData = last7Days.map(dateStr => appointments.filter(a => a.date === dateStr).length);
  const maxTraffic = Math.max(...trafficData, 1);

  const recentAppts = [...appointments]
    .sort((a, b) => {
      const da = a.bookedAt || a.date || '';
      const db = b.bookedAt || b.date || '';
      return db.localeCompare(da);
    })
    .slice(0, 2);

  const minutesAgo = (appt) => {
    if (!appt.bookedAt) return '';
    const diff = Math.floor((Date.now() - new Date(appt.bookedAt).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    return `${hrs}h ago`;
  };

  const getStatusActionText = (status) => {
    if (status === 'APPROVED') return 'Checked-in';
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'PENDING_APPROVAL') return 'Requested';
    if (status === 'REJECTED') return 'Declined';
    return 'Scheduled';
  };

  const getEmojiForAction = (status) => {
    if (status === 'APPROVED') return '🐕';
    if (status === 'COMPLETED') return '💉';
    return '📅';
  };

  const getEmojiColor = (status) => {
    if (status === 'COMPLETED') return 'rgba(233,30,99,.3)';
    return 'rgba(77,184,160,.4)';
  };

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
            <p className="hero-hospital-name">Sri Jayawardenapura Animal Hospital</p>
            <h1 className="hero-title" style={{ color: '#ffffff' }}>Compassionate Care.<br /><span style={{ color: '#7ee9d1' }}>Advanced Technology.</span></h1>
            <p style={{ fontSize: 'clamp(1.1rem,2.5vw,1.55rem)', fontWeight: 500, color: 'rgba(255,255,255,0.82)', marginBottom: '16px' }}>Healthier Pets. Happier Families.</p>
            <p className="hero-desc">A modern veterinary hospital that blends compassionate pet care with advanced digital management tools &mdash; giving pet owners, doctors, and administrators a seamless healthcare experience.</p>
            <div className="hero-btns">
              <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ background: 'var(--white)', color: 'var(--primary-dark)', fontWeight: 800, padding: '14px 32px', fontSize: '1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>🐾 Book an Appointment</button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <strong><CountUp target={1200} />+</strong>
                <span className="hero-stat-label">Happy Patients</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <strong><CountUp target={5} /></strong>
                <span className="hero-stat-label">Expert Vets</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <strong><CountUp target={15} />+</strong>
                <span className="hero-stat-label">Years of Care</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-deco hero-deco-1" aria-hidden="true"></div>
            <div className="hero-deco hero-deco-2" aria-hidden="true"></div>
            <div className="hero-card-main">
              <div className="db-window-controls" style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '0 4px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block', boxShadow: '0 0 0 1px rgba(255,255,255,.1)' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block', boxShadow: '0 0 0 1px rgba(255,255,255,.1)' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', display: 'inline-block', boxShadow: '0 0 0 1px rgba(255,255,255,.1)' }}></span>
              </div>
              <div className="dashboard-preview" style={{ marginBottom: 0 }}>
                <div className="db-header">
                  <span className="db-title">🏥 Control Center</span>
                  <span className="db-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: syncStatus === 'LIVE' ? 'rgba(46, 213, 115, 0.2)' : syncStatus === 'ERROR' ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 165, 2, 0.2)', color: syncStatus === 'LIVE' ? '#2ed573' : syncStatus === 'ERROR' ? '#ff4757' : '#ffa502' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: syncStatus === 'LIVE' ? '0 0 6px currentColor' : 'none' }}></span> {syncStatus === 'LIVE' ? 'Live Sync' : syncStatus === 'LOADING' ? 'Connecting' : 'Disconnected'}
                  </span>
                </div>
                <div className="db-stats-row">
                  <div className="db-stat-card"><div className="num">{totalAppts}</div><div className="lbl">Appts</div></div>
                  <div className="db-stat-card"><div className="num">{admittedCount}</div><div className="lbl">Admitted</div></div>
                  <div className="db-stat-card"><div className="num">{staffCount}</div><div className="lbl">Staff</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="db-chart" style={{ marginBottom: 0 }}>
                    <div className="db-chart-label">Traffic (7d)</div>
                    <div className="db-chart-bars">
                      {trafficData.map((count, i) => (
                        <div key={i} className={`bar ${i === 6 ? 'active' : ''}`} style={{ height: Math.max(10, (count / maxTraffic) * 100) + '%' }} title={`${count} appts`} />
                      ))}
                    </div>
                  </div>
                  <div className="db-activity-feed" style={{ background: 'rgba(255,255,255,.12)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,.2)' }}>
                    <div className="db-chart-label">Live Activity</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {recentAppts.length === 0 ? (
                        <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.8)', textAlign: 'center', marginTop: '10px' }}>No recent activity</div>
                      ) : (
                        recentAppts.map((appt, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,.15)', padding: '8px', borderRadius: '8px' }}>
                            <div style={{ width: '28px', height: '28px', background: getEmojiColor(appt.status), borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                              {getEmojiForAction(appt.status)}
                            </div>
                            <div>
                              <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--white)', lineHeight: 1.2 }}>{(appt.petName || 'Patient').split(' ')[0]} {getStatusActionText(appt.status)}</div>
                              <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.8)', fontWeight: 600, marginTop: '2px' }}>{appt.doctorName || 'Veterinarian'}{minutesAgo(appt) ? ` • ${minutesAgo(appt)}` : ''}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,.12)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,.3)', boxShadow: '0 6px 20px rgba(0,0,0,.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex' }}>
                    {doctorsList.slice(0, 3).map((doc, i) => (
                      <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: i % 2 === 0 ? '#4db8a0' : '#2a9dcc', border: '2px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'white', marginLeft: i > 0 ? '-12px' : '0', zIndex: 3 - i, boxShadow: '0 2px 8px rgba(0,0,0,.25)', overflow: 'hidden' }}>
                        {doc.photoUrl ? <img src={doc.photoUrl} alt="doc" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (doc.name || 'D').charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {doctorsList.length === 0 && (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f9a825', border: '2px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'white', zIndex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.25)' }}>👩‍⚕️</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '.75rem', fontWeight: 800, color: 'white' }}>Medical Team Online</div>
                    <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>{staffCount} Specialist{staffCount !== 1 && 's'} available</div>
                  </div>
                </div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: syncStatus === 'LIVE' ? '#7ee9d1' : (syncStatus === 'ERROR' ? '#ff4757' : '#ffa502'), boxShadow: syncStatus === 'LIVE' ? '0 0 0 4px rgba(126,233,209,.4)' : 'none', animation: syncStatus === 'LIVE' ? 'pulse 2s infinite' : 'none' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
