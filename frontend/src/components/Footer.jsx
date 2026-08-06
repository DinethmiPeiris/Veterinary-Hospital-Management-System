export default function Footer() {
  return (
    <footer className="footer" id="contact" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">🐾</div>
              <div className="footer-logo-text">
                <strong>Sri Jayawardanapura Animal Hospital</strong>
                <span>Compassionate Care for Every Pet</span>
              </div>
            </div>
            <p className="footer-desc">A premier veterinary hospital providing exceptional healthcare for pets across Sri Lanka. Combining compassion, expertise, and technology to serve every pet family.</p>
            <div className="footer-social">
              <a href="#" id="footer-fb" aria-label="Facebook">📘</a>
              <a href="#" id="footer-ig" aria-label="Instagram">📸</a>
              <a href="#" id="footer-tw" aria-label="Twitter">𝕏</a>
              <a href="#" id="footer-yt" aria-label="YouTube">📺</a>
              <a href="#" id="footer-wa" aria-label="WhatsApp">💬</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About Hospital</a></li>
              <li><a href="#services">Our Services</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              <li><a href="#services">Pet Consultations</a></li>
              <li><a href="#services">Vaccinations</a></li>
              <li><a href="#services">Surgery</a></li>
              <li><a href="#services">Health Monitoring</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            <div className="footer-contact-item">
              <div className="fci-icon">📍</div>
              <div className="fci-text"><strong>Address</strong>No34, Parliament Road, Ethul Kotte, Kotte., Perakumba Mawatha, Sri Jayawardenepura Kotte.</div>
            </div>
            <div className="footer-contact-item">
              <div className="fci-icon">📞</div>
              <div className="fci-text"><strong>Phone</strong>0112 888 291</div>
            </div>
            <div className="footer-contact-item">
              <div className="fci-icon">🕒</div>
              <div className="fci-text"><strong>Hours</strong>Mon&ndash;Sun: 11AM&ndash;2PM, 3PM&ndash;8PM</div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Sri Jayawardanapura Animal Hospital. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
