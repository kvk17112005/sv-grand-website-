import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaStar,
  FaCheckCircle,
  FaWifi,
  FaBolt,
  FaWater,
  FaCar,
  FaSnowflake,
  FaBed,
  FaConciergeBell,
  FaPhoneAlt,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaAward,
  FaHeart,
  FaArrowRight,
} from "react-icons/fa";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "./Home.css";

const ROOMS_DATA = [
  {
    type: "ac-single",
    name: "AC Single Room",
    category: "AC ROOM",
    image: "/hotel/ac-room-1.jpg",
  },
  {
    type: "ac-family",
    name: "AC Family Room",
    category: "AC ROOM",
    image: "/hotel/premium-ac-room.jpg",
  },
  {
    type: "non-ac-double",
    name: "Non-AC Double Room",
    category: "NON-AC ROOM",
    image: "/hotel/non-ac-room-2.jpg",
  },
  {
    type: "non-ac-single",
    name: "Non-AC Single Room",
    category: "NON-AC ROOM",
    image: "/hotel/non-ac-room-1.jpg",
  },
];

const AMENITIES_DATA = [
  {
    icon: FaSnowflake,
    title: "Climate-Controlled AC",
    desc: "High-efficiency split air-conditioners to ensure quick, silent, and refreshing cooling.",
    image:
      "https://images.unsplash.com/photo-1582239052618-4e2324cef034?auto=format&fit=crop&w=800&q=70",
  },
  {
    icon: FaBolt,
    title: "24/7 Power Backup",
    desc: "Dedicated industrial generator keeps ACs, lifts, lights, and sockets uninterrupted 24 hours.",
    image:
      "https://images.unsplash.com/photo-1509390144018-eeaf65052242?auto=format&fit=crop&w=800&q=70",
  },
  {
    icon: FaWater,
    title: "24/7 Hot & Cold Water",
    desc: "Instant geysers and constant water pressure for refreshing morning and night baths.",
    image:
      "https://images.unsplash.com/photo-1656646523409-46f291d67d2a?auto=format&fit=crop&w=800&q=70",
  },
  {
    icon: FaWifi,
    title: "High-Speed Fiber Wi-Fi",
    desc: "Complimentary enterprise-grade Wi-Fi across every room and reception for work and streaming.",
    image:
      "https://images.unsplash.com/photo-1750712263185-edde9f359e33?auto=format&fit=crop&w=800&q=70",
  },
  {
    icon: FaCar,
    title: "Secure Gated Parking",
    desc: "Spacious on-site car and bike parking with 24/7 CCTV surveillance and security guards.",
    image:
      "https://images.unsplash.com/photo-1587813369290-091c9d432daf?auto=format&fit=crop&w=800&q=70",
  },
  {
    icon: FaBed,
    title: "Plush Spring Mattresses",
    desc: "Orthopedic pocket-spring mattresses, crisp cotton bedsheets, and plush pillows for deep sleep.",
    image:
      "https://images.unsplash.com/photo-1772476361154-e894ba10d757?auto=format&fit=crop&w=800&q=70",
  },
  {
    icon: FaShieldAlt,
    title: "Spotless Cleanliness",
    desc: "Rigorous multi-point housekeeping protocols and daily sanitization of every room.",
    image:
      "https://images.unsplash.com/photo-1760722974657-f64bce2f9cc5?auto=format&fit=crop&w=800&q=70",
  },
  {
    icon: FaConciergeBell,
    title: "24/7 Concierge & Care",
    desc: "Friendly reception desk ready 24/7 for wake-up calls, travel assistance, and room service.",
    image:
      "https://images.unsplash.com/photo-1759038085950-1234ca8f5fed?auto=format&fit=crop&w=800&q=70",
  },
];

const REVIEWS_DATA = [
  {
    author: "Rajesh V.",
    city: "Hyderabad",
    type: "Temple Pilgrimage & Family",
    rating: 5,
    quote:
      "We visited Tadipatri for the Bugga Ramalingeswara temple darshan with our elderly parents. SV Grand exceeded every expectation! Spotless rooms, genuinely clean bathrooms, and the staff helped us with early morning hot water. Will definitely stay here again.",
  },
  {
    author: "Suresh Reddy",
    city: "Bengaluru",
    type: "Business Executive",
    rating: 5,
    quote:
      "Without doubt the best and most professional hotel in Tadipatri. Fast Wi-Fi for my Zoom calls, 24/7 generator backup so the AC never stopped, and very safe gated parking for my car. Highly recommended for business travelers.",
  },
  {
    author: "Dr. Ananya M.",
    city: "Chennai",
    type: "Belum Caves & Gandikota Tour",
    rating: 5,
    quote:
      "Stayed at SV Grand during our road trip to Belum Caves and Gandikota. The rooms are grand, luxurious, and completely peaceful. The owner and reception team were extraordinarily courteous and guided us with great local tips.",
  },
  {
    author: "Venkat Rao & Family",
    city: "Vijayawada",
    type: "Wedding & Family Stay",
    rating: 5,
    quote:
      "We booked multiple rooms for our family wedding in Tadipatri. All our relatives praised the comfortable beds, prompt room service, and central location. Excellent hospitality and outstanding value for money!",
  },
  {
    author: "Mahesh Babu P.",
    city: "Tirupati",
    type: "Spiritual Pilgrimage",
    rating: 5,
    quote:
      "Very neat and well-maintained property. Only 5 minutes from Chintala Venkataramana Temple. Clean linens, quiet atmosphere, and very polite reception staff. 10/10 recommendation for anyone visiting Tadipatri.",
  },
  {
    author: "Priya S.",
    city: "Kurnool",
    type: "Solo Vacation",
    rating: 5,
    quote:
      "As a solo traveler, safety and cleanliness are my top priorities. SV Grand felt completely secure with 24/7 CCTV and attentive staff. Pure RO water is provided on every floor. A truly delightful stay!",
  },
];

const ATTRACTIONS_DATA = [
  {
    name: "Sri Bugga Ramalingeswara Swamy Temple",
    category: "ANCIENT TEMPLE",
    distance: "5 Mins Drive",
    desc: "A breathtaking Vijayanagara architectural marvel situated along the holy Penna river, famous for its eternal underground water spring.",
  },
  {
    name: "Sri Chintala Venkataramana Swamy Temple",
    category: "HISTORIC MONUMENT",
    distance: "7 Mins Drive",
    desc: "Famous for its intricately carved stone chariot and exquisite Ramayana & Mahabharata wall sculptures.",
  },
  {
    name: "Belum Caves",
    category: "NATURAL WONDER",
    distance: "35 Mins Drive",
    desc: "India's second-largest cave network with grand limestone stalactites, underground passages, and meditation chambers.",
  },
  {
    name: "Gandikota Grand Canyon",
    category: "SCENIC EXPEDITION",
    distance: "1 Hr 15 Mins Drive",
    desc: "Known as the Grand Canyon of India, featuring breathtaking gorges carved by the River Penna and an ancient stone fort.",
  },
];

function Home() {
  const [showLandingVideo, setShowLandingVideo] = useState(
    () => sessionStorage.getItem("svGrandLandingShown") !== "true"
  );

  const heroSectionRef = useRef(null);
  const heroVideoRef = useRef(null);

  useScrollReveal();

  const handleVideoEnd = () => {
    sessionStorage.setItem("svGrandLandingShown", "true");
    setShowLandingVideo(false);
  };

  /*
    Pause the looping hero video while it is scrolled out of view.
    A continuously playing full-screen video keeps decoding/compositing
    and makes scrolling the rest of the page feel janky.
  */
  useEffect(() => {
    const section = heroSectionRef.current;
    const video = heroVideoRef.current;

    if (!section || !video || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <main className="home-container">
      {/* =========================================
          FULL SCREEN LANDING VIDEO (FIRST VISIT)
      ========================================= */}
      {showLandingVideo && (
        <section className="landing-video-screen">
          <video
            className="landing-video"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnd}
          >
            <source src="/hotel/hero-logo.mp4" type="video/mp4" />
          </video>
          <div className="landing-video-overlay" />
          <button
            type="button"
            className="landing-skip-btn"
            onClick={handleVideoEnd}
            style={{
              position: "absolute",
              bottom: "30px",
              right: "30px",
              zIndex: 10,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: "20px",
              padding: "8px 18px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Skip Intro →
          </button>
        </section>
      )}

      {/* =========================================
          ORIGINAL STARTING MAIN HERO SECTION
      ========================================= */}
      <section className="hero-section" ref={heroSectionRef}>
        <video
          ref={heroVideoRef}
          className="hero-video"
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
        >
          <source src="/hotel/hero-logo.mp4" type="video/mp4" />
        </video>

        <div className="hero-video-overlay" />

        <div className="hero-content">
          <p className="hero-label" data-reveal="fade">WELCOME TO</p>

          <h1 data-reveal>
            SV GRAND
            <br />
            LUXURY
            <br />
            ROOMS
          </h1>

          <p className="hero-description" data-reveal="fade">
            Comfortable rooms, warm hospitality and a convenient stay in Tadipatri.
          </p>

          <Link to="/rooms" className="hero-button" data-reveal="zoom">
            VIEW ROOMS
          </Link>
        </div>
      </section>

      {/* =========================================
          1. ABOUT THE HOTEL / OWNER'S WELCOME
      ========================================= */}
      <section id="about-hotel" className="home-about-section">
        <div className="home-about-grid">
          <div className="home-about-images" data-reveal="left">
            <img
              src="/hotel/reception.jpg"
              alt="SV Grand Reception & Front Desk"
              className="about-main-img"
              loading="lazy"
              decoding="async"
            />
            <div className="about-floating-badge">
              <strong>#1</strong>
              <span>Rated Hotel in Tadipatri</span>
            </div>
          </div>

          <div className="home-about-text">
            <div className="owner-welcome-badge" data-reveal="fade">
              <FaAward /> FROM THE MANAGEMENT & OWNERS
            </div>

            <h2 data-reveal>A Legacy of True Comfort & Rayalaseema Hospitality</h2>

            <p data-reveal>
              Welcome to <strong>SV Grand Luxury Rooms</strong>. As hotel owners, our passion was to build a sanctuary in Tadipatri where travelers never have to compromise on hygiene, comfort, or personalized care.
            </p>

            <div className="owner-quote-box" data-reveal="zoom">
              <p>
                "At SV Grand, we treat every traveler not just as a customer, but as a revered guest in our home. Your restful sleep, safety, and satisfaction are our personal commitments."
              </p>
              <span>— The Management Team, SV Grand</span>
            </div>

            <p data-reveal>
              Strategically located in central Tadipatri, our hotel is minutes away from the celebrated Bugga Ramalingeswara Swamy and Chintala Venkataramana Swamy Temples, and within easy reach of Belum Caves and Gandikota.
            </p>

            <div className="about-features-checks" data-reveal>
              <div><FaCheckCircle /> 100% Sanitized & Clean Linens</div>
              <div><FaCheckCircle /> Pure Spring RO Water Included</div>
              <div><FaCheckCircle /> High-Speed Fiber Wi-Fi</div>
              <div><FaCheckCircle /> Gated CCTV Secured Parking</div>
              <div><FaCheckCircle /> 24-Hour Front Desk Support</div>
              <div><FaCheckCircle /> In-Room Dining & Room Service</div>
            </div>

            <div data-reveal>
              <Link to="/about" className="hero-btn-primary" style={{ padding: "12px 26px" }}>
                LEARN MORE ABOUT US <FaArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          2. HIGHLIGHTS & KEY AMENITIES
      ========================================= */}
      <section className="home-highlights-section">
        <div className="section-header-center">
          <p className="section-label-gold" data-reveal="fade">WHY CHOOSE SV GRAND</p>
          <h2 className="section-main-title" data-reveal>Highlighted Amenities & Features</h2>
          <p className="section-subtitle-text" data-reveal>
            Every feature at SV Grand is handpicked to provide you with an effortless, restful, and safe stay.
          </p>
        </div>

        <div className="highlights-grid">
          {AMENITIES_DATA.map((amenity) => {
            const Icon = amenity.icon;
            return (
              <article className="highlight-card" data-reveal="up" key={amenity.title}>
                <div className="highlight-media">
                  <img
                    src={amenity.image}
                    alt={amenity.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="highlight-media-sheen" aria-hidden="true" />
                </div>

                <span className="highlight-icon-circle">
                  <Icon />
                </span>

                <div className="highlight-card-body">
                  <h3>{amenity.title}</h3>
                  <p>{amenity.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =========================================
          3. FEATURED ROOMS SHOWCASE
      ========================================= */}
      <section className="home-rooms-section">
        <div className="section-header-center">
          <p className="section-label-gold" data-reveal="fade">ACCOMMODATION COLLECTION</p>
          <h2 className="section-main-title" data-reveal>Handcrafted Rooms for Every Need</h2>
          <p className="section-subtitle-text" data-reveal>
            Choose from our premium AC and non-AC rooms, each crafted with care for an elevated stay experience.
          </p>
        </div>

        <div className="home-suites-showcase">
          {ROOMS_DATA.map((room, index) => {
            const isReversed = index % 2 === 1;
            return (
              <article
                className={`home-suite-row ${isReversed ? "row-reversed" : ""}`}
                key={room.type}
                data-reveal={isReversed ? "right" : "left"}
              >
                <div className="home-suite-media">
                  <img src={room.image} alt={room.name} loading="lazy" decoding="async" />
                  <span className="home-suite-badge">{room.category}</span>
                </div>

                <div className="home-suite-info">
                  <span className="home-suite-category">Signature Accommodation</span>
                  <h3 className="home-suite-title">{room.name}</h3>

                  <div className="home-suite-bottom">
                    <div className="home-suite-cta-btns">
                      <Link
                        to={`/booking/${room.type}`}
                        className="home-btn-book"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =========================================
          4. REVIEWS & TESTIMONIALS
      ========================================= */}
      <section className="home-reviews-section">
        <div className="section-header-center">
          <div className="reviews-summary-badge" data-reveal="zoom">
            <div className="reviews-stars-wrap">
              <FaStar /> <FaStar /> <FaStar /> <FaStar /> <FaStar />
            </div>
            <strong>4.8 out of 5</strong>
            <span>(450+ Verified Guest Reviews)</span>
          </div>

          <p className="section-label-gold" data-reveal="fade">GUEST EXPERIENCES & REVIEWS</p>
          <h2 className="section-main-title" data-reveal>What Our Cherished Guests Say</h2>
          <p className="section-subtitle-text" data-reveal>
            Real feedback from pilgrims, corporate professionals, tourists, and families who made SV Grand their home in Tadipatri.
          </p>
        </div>

        <div className="reviews-marquee" data-reveal="fade">
          <div className="reviews-track">
            {[...REVIEWS_DATA, ...REVIEWS_DATA].map((rev, index) => (
              <article
                className="review-card"
                key={index}
                aria-hidden={index >= REVIEWS_DATA.length}
              >
                <div className="review-card-header">
                  <div className="review-stars">
                    {[...Array(rev.rating)].map((_, i) => (
                      <FaStar key={i} />
                    ))}
                  </div>
                  <span className="review-type-pill">{rev.type}</span>
                </div>

                <p className="review-quote">"{rev.quote}"</p>

                <div className="review-author-wrap">
                  <div className="review-avatar">
                    {rev.author.slice(0, 1)}
                  </div>
                  <div className="review-author-info">
                    <strong>{rev.author}</strong>
                    <span>{rev.city}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          5. HOTEL PHOTO GALLERY
      ========================================= */}
      <section className="home-gallery-section">
        <div className="section-header-center">
          <p className="section-label-gold" data-reveal="fade">A VISUAL TOUR</p>
          <h2 className="section-main-title" data-reveal>Experience the Ambiance</h2>
          <p className="section-subtitle-text" data-reveal>
            Take a look inside our pristine property, corridors, and welcoming reception.
          </p>
        </div>

        <div className="gallery-grid">
          <div className="gallery-item" data-reveal="zoom">
            <img src="/hotel/hotel-front.jpg" alt="SV Grand Grand Entrance" loading="lazy" decoding="async" />
            <div className="gallery-caption">Hotel Entrance & Facade</div>
          </div>
          <div className="gallery-item" data-reveal="zoom">
            <img src="/hotel/reception.jpg" alt="SV Grand Reception Desk" loading="lazy" decoding="async" />
            <div className="gallery-caption">24/7 Front Desk & Lobby</div>
          </div>
          <div className="gallery-item" data-reveal="zoom">
            <img src="/hotel/corridor.jpg" alt="SV Grand Corridor" loading="lazy" decoding="async" />
            <div className="gallery-caption">Quiet & Clean Corridors</div>
          </div>
          <div className="gallery-item" data-reveal="zoom">
            <img src="/hotel/double-bed-room.jpg" alt="SV Grand Deluxe Bedroom" loading="lazy" decoding="async" />
            <div className="gallery-caption">Plush Deluxe Bedrooms</div>
          </div>
        </div>
      </section>

      {/* =========================================
          6. LOCAL SIGHTSEEING IN TADIPATRI
      ========================================= */}
      <section className="home-attractions-section">
        <div className="section-header-center">
          <p className="section-label-gold" data-reveal="fade">EXPLORE TADIPATRI</p>
          <h2 className="section-main-title" data-reveal>Nearby Attractions & Temples</h2>
          <p className="section-subtitle-text" data-reveal>
            SV Grand is the ideal base to explore famous historical temples, natural caves, and scenic landmarks.
          </p>
        </div>

        <div className="attractions-grid">
          {ATTRACTIONS_DATA.map((att, i) => (
            <article className="attraction-card" key={i} data-reveal="up">
              <span className="attraction-tag">{att.category}</span>
              <h3>{att.name}</h3>
              <p>{att.desc}</p>
              <div className="attraction-distance">
                <FaMapMarkerAlt /> {att.distance}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =========================================
          7. OWNER'S PROMISE & 24/7 CONCIERGE BANNER
      ========================================= */}
      <section className="home-owner-promise-section">
        <div className="owner-promise-card">
          <div className="owner-promise-left" data-reveal="left">
            <p className="section-label-gold">THE OWNER'S GUARANTEE</p>
            <h2>Your Comfort & Peace of Mind Are Guaranteed</h2>
            <p>
              We pride ourselves on providing the highest standard of hospitality in Tadipatri. Need early check-in, temple route assistance, or special dietary arrangements? Speak directly with our front desk team.
            </p>

            <div className="owner-badges-row">
              <div className="owner-badge-item">
                <FaAward /> Best Rate Direct Booking
              </div>
              <div className="owner-badge-item">
                <FaHeart /> 100% Guest Satisfaction
              </div>
              <div className="owner-badge-item">
                <FaShieldAlt /> Safe for Families & Solo Travelers
              </div>
            </div>
          </div>

          <div className="owner-promise-right" data-reveal="right">
            <Link to="/rooms" className="owner-btn-book">
              RESERVE YOUR ROOM
            </Link>
            <a href="tel:9885449702" className="owner-btn-call">
              <FaPhoneAlt size={12} /> Call Desk: 9885449702
            </a>
            <a
              href="https://wa.me/919885449702"
              target="_blank"
              rel="noopener noreferrer"
              className="owner-btn-whatsapp"
            >
              <FaWhatsapp size={14} /> WhatsApp Assistance
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;