import { ArrowDownRight, ArrowUpRight, Clock3, MapPin, MessageCircle, Phone } from "lucide-react";
import hotelFront from "../assets/hotel/hotel-front.jpg";
import reception from "../assets/hotel/reception.jpg";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "./Contact.css";

const phoneNumber = "9885449702";
const whatsappLink = "https://wa.me/919885449702";
const address = "Opp. to Town Police Station, Gandhi Katta, Tadipatri Rural, Andhra Pradesh 515411";
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`SV GRAND, ${address}`)}`;
const mapEmbedUrl = "https://www.openstreetmap.org/export/embed.html?bbox=78.003%2C14.906%2C78.016%2C14.913&layer=mapnik&marker=14.9094017%2C78.0093965";

function Contact() {
  useScrollReveal();

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-photo" data-reveal="left">
          <div className="contact-hero-photo-inner">
            <img src={hotelFront} alt="SV GRAND in Tadipatri" />
            <span className="contact-hero-sheen" aria-hidden="true" />
            <span className="contact-photo-tag"><MapPin size={15} /> Gandhi Katta, Tadipatri</span>
          </div>
        </div>
        <div className="contact-hero-copy">
          <span className="contact-kicker" data-reveal="fade"><span /> We’re just a message away</span>
          <h1 data-reveal>Let’s make your<br /><em>stay easy.</em></h1>
          <p data-reveal>
            Questions about a room or planning your visit? Get in touch with
            our team. We’ll be glad to help you find your way to SV GRAND.
          </p>
          <a href="#contact-options" className="contact-scroll-link" data-reveal="fade">
            Get in touch <ArrowDownRight size={17} />
          </a>
          <span className="contact-hero-note" data-reveal="fade"><Clock3 size={15} /> Here to help with your stay</span>
        </div>
      </section>

      <section className="contact-content" id="contact-options">
        <div className="contact-section-heading" data-reveal>
          <span className="contact-kicker"><span /> Reach out your way</span>
          <h2>A real person is ready to help.</h2>
        </div>

        <div className="contact-options">
          <article className="contact-option-card contact-call-card" data-reveal="up">
            <div className="contact-option-photo">
              <img src={hotelFront} alt="" loading="lazy" />
              <span className="contact-option-icon"><Phone size={21} /></span>
            </div>
            <div className="contact-option-copy">
              <span className="contact-card-label">Prefer a quick call?</span>
              <h3>Let’s talk.</h3>
              <p>Call for room enquiries, help with a reservation, or directions.</p>
              <a className="contact-option-link" href={`tel:${phoneNumber}`}>
                +91 {phoneNumber} <ArrowUpRight size={17} />
              </a>
            </div>
          </article>
          <article className="contact-option-card contact-whatsapp-card" data-reveal="up">
            <div className="contact-option-photo">
              <img src={reception} alt="" loading="lazy" />
              <span className="contact-option-icon"><MessageCircle size={21} /></span>
            </div>
            <div className="contact-option-copy">
              <span className="contact-card-label">Prefer to message?</span>
              <h3>Chat on WhatsApp.</h3>
              <p>Send us a message about your visit and we’ll get back to you.</p>
              <a className="contact-option-link" href={whatsappLink} target="_blank" rel="noreferrer">
                Start a conversation <ArrowUpRight size={17} />
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="contact-location-section">
        <div className="contact-location-copy" data-reveal="left">
          <span className="contact-kicker"><span /> Find us in Tadipatri</span>
          <h2>Close to where you need to be.</h2>
          <p className="contact-location-description">
            SV GRAND is near the town police station at Gandhi Katta. Open the
            map for directions and plan your route before you arrive.
          </p>
          <div className="contact-address">
            <span className="contact-address-icon"><MapPin size={18} /></span>
            <p>{address}</p>
          </div>
          <a className="contact-directions-button" href={directionsUrl} target="_blank" rel="noreferrer">
            Get directions <ArrowUpRight size={17} />
          </a>
          <a className="contact-google-link" href="https://www.google.com/maps/place/SV+GRAND/@14.9094017,78.0093965,17z" target="_blank" rel="noreferrer">
            See our Google listing <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="contact-map-frame" data-reveal="right">
          <iframe
            title="Map showing SV GRAND in Tadipatri"
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="contact-map-caption"><MapPin size={15} /> SV GRAND · Gandhi Katta, Tadipatri</div>
        </div>
      </section>

      <section className="contact-arrival">
        <div className="contact-arrival-heading" data-reveal>
          <span className="contact-kicker"><span /> Arriving by public transport?</span>
          <h2>Getting here is straightforward.</h2>
          <p>Use these nearby transit points to plan the last part of your journey.</p>
        </div>
        <div className="contact-transit-list">
          <div className="contact-transit-item" data-reveal="up">
            <span className="contact-transit-number">01</span>
            <div><strong>Tadipatri Railway Station</strong><span>About 400 m · 5 min walk</span></div>
            <ArrowUpRight size={17} />
          </div>
          <div className="contact-transit-item" data-reveal="up">
            <span className="contact-transit-number">02</span>
            <div><strong>APSRTC Bus Complex</strong><span>About 350 m · 4 min walk</span></div>
            <ArrowUpRight size={17} />
          </div>
        </div>
      </section>
    </main>
  );
}

export default Contact;
