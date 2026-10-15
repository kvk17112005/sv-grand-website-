import { ArrowUpRight, BusFront, MapPin, ShieldCheck, Star, TrainFront, Users } from "lucide-react";
import { Link } from "react-router-dom";
import hotelFront from "../assets/hotel/hotel-front.jpg";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "./About.css";

const googleListingUrl = "https://www.google.com/maps/place/SV+GRAND/@14.9094017,78.0093965,17z";
const address = "Opp. to Town Police Station, Gandhi Katta, Tadipatri Rural, Andhra Pradesh 515411";
const nearbyImages = {
  railway: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=900&q=80",
  bus: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=900&q=80",
  temples: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=900&q=80",
};

function About() {
  useScrollReveal();

  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <span className="about-kicker" data-reveal="fade"><span /> A Tadipatri welcome</span>
          <h1 data-reveal>Come for the journey.<br /><em>Stay for the comfort.</em></h1>
          <p data-reveal>
            A warm, easy place to land in the heart of Tadipatri. Whether you’re
            travelling solo or bringing the family, find a room that feels right
            for your stay.
          </p>
          <div className="about-hero-actions" data-reveal="fade">
            <a href="#nearby" className="about-primary-link">
              Discover Tadipatri <ArrowUpRight size={17} />
            </a>
            <Link to="/contact" className="about-secondary-link">
              Talk to our team
            </Link>
          </div>
          <a className="about-google-rating" href={googleListingUrl} target="_blank" rel="noreferrer" data-reveal="fade">
            <span className="about-rating-star"><Star size={15} fill="currentColor" /></span>
            <strong>3.8</strong>
            <span>· 116 Google reviews</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="about-hero-visual" data-reveal="right">
          <div className="about-hero-photo">
            <img src={hotelFront} alt="SV GRAND hotel exterior in Tadipatri" />
            <span className="about-hero-sheen" aria-hidden="true" />
          </div>
          <div className="about-image-caption">
            <MapPin size={16} />
            <span>Right in the heart of Tadipatri</span>
          </div>
          <div className="about-hero-stamp"><span>SV</span><small>GRAND<br />TADIPATRI</small></div>
        </div>
      </section>

      <section className="about-welcome">
        <div className="about-section-heading" data-reveal>
          <span className="about-kicker"><span /> A stay made simple</span>
          <h2>Comfort, without the fuss.</h2>
        </div>
        <p data-reveal>
          At SV GRAND, the little things matter: a comfortable room to return to,
          a convenient location, and a friendly team ready to help. We’re here
          to make your Tadipatri visit feel that much easier.
        </p>
        <span className="about-welcome-detail" data-reveal="fade">A thoughtful stay, in the heart of town</span>
      </section>

      <section className="about-nearby" id="nearby">
        <div className="about-section-heading about-nearby-heading" data-reveal>
          <div>
            <span className="about-kicker"><span /> Get to know the neighborhood</span>
            <h2>A good place to start exploring.</h2>
          </div>
          <p>Temples, local life, and easy connections are all part of a Tadipatri stay.</p>
        </div>
        <div className="about-nearby-grid">
          <article className="about-nearby-card" data-reveal="up">
            <div className="about-nearby-image">
              <img src={nearbyImages.railway} alt="Passenger train travelling along a railway" loading="lazy" />
              <span className="about-nearby-icon"><TrainFront size={20} /></span>
            </div>
            <span className="about-nearby-distance">400 m · about 5 min walk</span>
            <h3>Tadipatri Railway Station</h3>
            <p>Convenient access for guests arriving by train.</p>
          </article>
          <article className="about-nearby-card" data-reveal="up">
            <div className="about-nearby-image">
              <img src={nearbyImages.bus} alt="Bus on a city street" loading="lazy" />
              <span className="about-nearby-icon"><BusFront size={20} /></span>
            </div>
            <span className="about-nearby-distance">350 m · about 4 min walk</span>
            <h3>APSRTC Bus Complex</h3>
            <p>Local and regional bus connections close by.</p>
          </article>
          <article className="about-nearby-card" data-reveal="up">
            <div className="about-nearby-image">
              <img src={nearbyImages.temples} alt="Carved stone temple architecture" loading="lazy" />
              <span className="about-nearby-icon"><MapPin size={20} /></span>
            </div>
            <span className="about-nearby-distance">A short drive away</span>
            <h3>Tadipatri’s historic temples</h3>
            <p>Bugga Ramalingeswara and Chintala Venkataramana temples.</p>
          </article>
        </div>
      </section>

      <section className="about-location">
        <div className="about-location-mark" data-reveal="zoom"><MapPin size={22} /></div>
        <div className="about-location-copy" data-reveal>
          <span className="about-kicker"><span /> Easy to find</span>
          <h2>Make your way to SV GRAND.</h2>
          <p>{address}</p>
        </div>
        <a className="about-primary-link" href={googleListingUrl} target="_blank" rel="noreferrer" data-reveal="right">
          Open Google Maps <ArrowUpRight size={17} />
        </a>
      </section>

      <section className="about-values">
        <div data-reveal="up"><ShieldCheck size={20} /><span>Comfort-first rooms</span></div>
        <div data-reveal="up"><MapPin size={20} /><span>Central Tadipatri location</span></div>
        <div data-reveal="up"><Users size={20} /><span>Stays for solo guests & families</span></div>
      </section>
    </main>
  );
}

export default About;
