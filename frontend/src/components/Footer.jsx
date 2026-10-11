import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="site-footer">

      <div className="footer-main">

        {/* LOGO */}
        <Link to="/" className="footer-logo">
          <img
            src="/hotel/sv-grand-logo-transparent.png"
            alt="SV Grand Luxury Rooms"
          />
        </Link>

        {/* FOOTER LINKS */}
        <div className="footer-links">
          <Link to="/about">About Us</Link>
          <Link to="/rooms">Rooms</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/terms/ac-deluxe">Terms & Conditions</Link>
        </div>

        {/* SOCIAL ICONS */}
        <div className="footer-social">
          <a href="#" aria-label="Facebook">
            <FaFacebookF />
          </a>

          <a href="#" aria-label="Instagram">
            <FaInstagram />
          </a>

          <a href="#" aria-label="Twitter">
            <FaTwitter />
          </a>

          <a href="#" aria-label="LinkedIn">
            <FaLinkedinIn />
          </a>
        </div>

      </div>

      {/* FOOTER BOTTOM */}
      <div className="footer-bottom">

        <p>
          © 2026 SV Grand Luxury Rooms. All rights reserved.
        </p>

        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Refund & Cancellation</a>
          <Link to="/terms/ac-deluxe">T&C</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

      </div>

      <div className="footer-credit">
        Made for SV Grand Luxury Rooms
      </div>

    </footer>
  );
}

export default Footer;