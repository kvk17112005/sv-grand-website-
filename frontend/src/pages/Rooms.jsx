import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarCheck,
  FaShieldAlt,
  FaClock,
  FaWifi,
  FaCar,
  FaThLarge,
} from "react-icons/fa";

import { RedBusRoomGrid } from "../components/outlineUser/RedBusRoomGrid";
import { OffersSection } from "../components/outlineUser/OffersSection";
import { useAuth } from "../context/useAuth";
import acRoom1 from "../assets/hotel/ac-room-1.jpg";
import premiumAcRoom from "../assets/hotel/premium-ac-room.jpg";
import nonAcRoom1 from "../assets/hotel/non-ac-room-1.jpg";
import nonAcRoom2 from "../assets/hotel/non-ac-room-2.jpg";
import "./Rooms.css";

const ROOMS_CATALOG = [
  {
    id: "ac-single",
    category: "ac",
    name: "AC Single Room",
    image: acRoom1,
  },
  {
    id: "ac-family",
    category: "ac",
    name: "AC Family Room",
    image: premiumAcRoom,
  },
  {
    id: "non-ac-double",
    category: "non-ac",
    name: "Non-AC Double Room",
    image: nonAcRoom2,
  },
  {
    id: "non-ac-single",
    category: "non-ac",
    name: "Non-AC Single Room",
    image: nonAcRoom1,
  },
];

function Rooms() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [showFloorGrid, setShowFloorGrid] = useState(false);
  const showcaseRef = useRef(null);

  const filteredRooms =
    filter === "all"
      ? ROOMS_CATALOG
      : ROOMS_CATALOG.filter((r) => r.category === filter);

  useLayoutEffect(() => {
    const showcase = showcaseRef.current;

    if (!showcase || !("IntersectionObserver" in window)) {
      return undefined;
    }

    showcase.classList.add("scroll-reveal-ready");
    const rows = showcase.querySelectorAll(".suite-editorial-row");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" },
    );

    rows.forEach((row) => observer.observe(row));

    return () => observer.disconnect();
  }, [filter]);

  return (
    <main className="rooms-page-wrap">
      {/* =========================================
          HERO EDITORIAL HEADER
      ========================================= */}
      <section className="rooms-hero-header">
        <p className="section-label-gold">SV GRAND LUXURY ROOMS · TADIPATRI</p>
        <h1>Accommodations & Suites</h1>
        <p>
          Every room at SV Grand is an architectural retreat of quietude, spotless hygiene, and modern amenities. Crafted to provide restful slumber for pilgrims, families, and professionals.
        </p>
      </section>

      {/* =========================================
          CATEGORY FILTER SWITCHER
      ========================================= */}
      <section className="rooms-filter-bar">
        <button
          type="button"
          className={`filter-tab-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Accommodations
          <span className="filter-count-badge">{ROOMS_CATALOG.length}</span>
        </button>

        <button
          type="button"
          className={`filter-tab-btn ${filter === "ac" ? "active" : ""}`}
          onClick={() => setFilter("ac")}
        >
          AC Luxury Rooms
          <span className="filter-count-badge">
            {ROOMS_CATALOG.filter((r) => r.category === "ac").length}
          </span>
        </button>

        <button
          type="button"
          className={`filter-tab-btn ${filter === "non-ac" ? "active" : ""}`}
          onClick={() => setFilter("non-ac")}
        >
          Non-AC Rooms
          <span className="filter-count-badge">
            {ROOMS_CATALOG.filter((r) => r.category === "non-ac").length}
          </span>
        </button>

        {user ? (
          <button
            type="button"
            className={`filter-tab-btn ${showFloorGrid ? "active" : ""}`}
            onClick={() => setShowFloorGrid((prev) => !prev)}
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <FaThLarge size={12} />
            {showFloorGrid ? "Hide Floor Map" : "View Live Room Availability"}
          </button>
        ) : (
          <Link
            to="/login"
            state={{ redirectTo: "/rooms" }}
            className="filter-tab-btn"
            style={{ marginLeft: "auto" }}
          >
            Sign in to view live availability
          </Link>
        )}
      </section>

      {/* LIVE FLOOR ROOM MAP (TOGGLEABLE) */}
      {showFloorGrid && (
        <section style={{ maxWidth: "1180px", margin: "0 auto 40px", padding: "0 20px" }}>
          <RedBusRoomGrid />
        </section>
      )}

      {/* =========================================
          EDITORIAL SUITE SHOWCASES (MAGAZINE ROWS)
      ========================================= */}
      <section
        className="suites-showcase-container"
        ref={showcaseRef}
      >
        {filteredRooms.map((room, index) => {
          const isReversed = index % 2 === 1;

          return (
            <article
              className={`suite-editorial-row ${isReversed ? "row-reversed" : ""}`}
              key={room.id}
            >
              {/* MEDIA COLUMN */}
              <div className="suite-media-column">
                <div className="suite-main-image-wrap">
                  <img src={room.image} alt={room.name} />
                </div>
              </div>

              {/* INFORMATION COLUMN */}
              <div className="suite-info-column">
                <h2 className="suite-title">{room.name}</h2>

                {/* ACTIONS & BOOKING */}
                <div className="suite-action-row">
                  <div className="suite-buttons-group">
                    <Link
                      to={`/booking/${room.id}`}
                      className="btn-book-suite"
                    >
                      <FaCalendarCheck /> Reserve Room <FaArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* =========================================
          EXCLUSIVE BOOKING PROMOTIONS & VIP SAVINGS
      ========================================= */}
      <section style={{ maxWidth: "1180px", margin: "40px auto", padding: "0 20px" }}>
        {user && (
          <OffersSection />
        )}
      </section>

      {/* =========================================
          DIRECT BOOKING INCLUSIONS STRIP
      ========================================= */}
      <section className="rooms-perks-banner">
        <div className="rooms-perks-inner">
          <div className="perk-box">
            <div className="perk-box-icon">
              <FaShieldAlt />
            </div>
            <div>
              <strong>Direct Booking Support</strong>
              <span>Book directly with our team for personalized assistance.</span>
            </div>
          </div>

          <div className="perk-box">
            <div className="perk-box-icon">
              <FaClock />
            </div>
            <div>
              <strong>Flexible Check-In</strong>
              <span>Check-in 12:00 PM · Check-out 11:00 AM · 24/7 desk support.</span>
            </div>
          </div>

          <div className="perk-box">
            <div className="perk-box-icon">
              <FaWifi />
            </div>
            <div>
              <strong>High-Speed Fiber Wi-Fi</strong>
              <span>Complimentary fast Internet in every room and lobby.</span>
            </div>
          </div>

          <div className="perk-box">
            <div className="perk-box-icon">
              <FaCar />
            </div>
            <div>
              <strong>Secure Gated Parking</strong>
              <span>Safe on-site vehicle parking with 24/7 CCTV surveillance.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Rooms;