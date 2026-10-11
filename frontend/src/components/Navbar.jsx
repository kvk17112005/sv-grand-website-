import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FaUser,
  FaChevronDown,
  FaMoon,
  FaSun,
  FaSuitcase,
  FaUserCircle,
  FaSignOutAlt,
  FaShieldAlt,
} from "react-icons/fa";
import { Hotel } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useHotel } from "../context/HotelContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, status, signOut } = useAuth();
  const { setIsMyBookingsOpen } = useHotel();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("svGrandDarkMode") === "true"
  );

  const isStaff = user?.role === "admin" || user?.role === "super_admin";

  /*
    Dark / Light mode
  */
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("svGrandDarkMode", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("svGrandDarkMode", "false");
    }
  }, [darkMode]);

  /*
    Close dropdown when clicking outside
  */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
    Logout
  */
  const handleLogout = async () => {
    setLogoutError("");
    try {
      await signOut();
      setMenuOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(error.message);
    }
  };

  /*
    Dark / Light mode
  */
  const handleThemeToggle = () => {
    setDarkMode((previous) => !previous);
  };

  return (
    <header className="navbar">

      {/* OLD LOGO - DO NOT CHANGE */}
      <Link to={user ? "/user-portal" : "/"} className="hotel-logo">

        <img
          src="/hotel/sv-logo-mark.png"
          alt="SV Grand Luxury Rooms"
        />

        <div className="hotel-logo-text">
          <span className="hotel-logo-main">
            SV GRAND
          </span>

          <span className="hotel-logo-sub">
            LUXURY ROOMS
          </span>
        </div>

      </Link>

      {/* NAVIGATION */}
      <nav className="nav-links">

        {!user && (
          <>
            <Link to="/">HOME</Link>
            <Link to="/rooms">ROOMS</Link>
          </>
        )}

        {isStaff && (
          <Link to="/hotel-admin" style={{ color: "#059669", fontWeight: "700" }}>
            HOTEL ADMIN
          </Link>
        )}

        {user?.role === "super_admin" && (
          <Link to="/super-admin" style={{ color: "#dc2626", fontWeight: "700" }}>
            SUPER ADMIN
          </Link>
        )}

        {!user && (
          <>
            <Link to="/about">ABOUT</Link>
            <Link to="/contact">CONTACT</Link>
          </>
        )}


        {/* NOT LOGGED IN → BOOK NOW */}
        {status === "ready" && !user && (
          <Link
            to="/login"
            className="nav-book-btn"
          >
            BOOK NOW
            <span>→</span>
          </Link>
        )}


        {/* LOGGED IN → THEME AND USER MENU */}
        {status === "ready" && user && (
          <div className="user-nav-controls">
            <button
              type="button"
              className="theme-toggle-button"
              onClick={handleThemeToggle}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Light Mode" : "Dark Mode"}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>

            <div
              className="navbar-user"
              ref={menuRef}
            >
              <button
                type="button"
                className="user-menu-button"
                onClick={() =>
                  setMenuOpen(
                    (previous) => !previous
                  )
                }
                aria-label="User menu"
              >
                <FaUser />

                <FaChevronDown
                  className={`user-chevron ${
                    menuOpen ? "open" : ""
                  }`}
                />
              </button>


              {/* USER DROPDOWN */}
              {menuOpen && (
                <div className="user-dropdown">

                  {/* USER DETAILS */}
                  <div className="user-dropdown-header">

                    <div className="user-avatar">
                      <FaUser />
                    </div>

                    <div className="user-info">
                      <strong>
                        {user.name || user.fullName || user.email}
                      </strong>

                      <span>
                        {user.email}
                      </span>
                    </div>

                  </div>


                  <div className="user-dropdown-divider"></div>

                  {/* MY BOOKINGS */}
                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsMyBookingsOpen(true);
                    }}
                  >
                    <FaSuitcase />
                    <span>My Bookings</span>
                  </button>

                  {/* MY PROFILE */}
                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <FaUserCircle />
                    <span>My Profile</span>
                  </button>

                  {/* STAFF PANELS */}
                  {isStaff && (
                    <>
                      <div className="user-dropdown-divider"></div>
                      <div style={{ padding: "4px 16px", fontSize: "10px", fontWeight: "800", color: "#a67c32", letterSpacing: "0.5px" }}>
                        STAFF CONSOLES
                      </div>

                      <button
                        type="button"
                        className="user-dropdown-item"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/hotel-admin");
                        }}
                        style={{ color: "#059669", fontWeight: "600" }}
                      >
                        <Hotel size={14} />
                        <span>2. Hotel Admin Panel</span>
                      </button>

                      {user?.role === "super_admin" && (
                        <button
                          type="button"
                          className="user-dropdown-item"
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/super-admin");
                          }}
                          style={{ color: "#dc2626", fontWeight: "600" }}
                        >
                          <FaShieldAlt />
                          <span>3. Super Admin Panel</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="user-dropdown-item"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/admin");
                        }}
                      >
                        <span>📊 Database Overview</span>
                      </button>
                    </>
                  )}
                  {logoutError && (
                    <p className="navbar-error" role="alert">{logoutError}</p>
                  )}


                  <div className="user-dropdown-divider"></div>


                  {/* LOGOUT */}
                  <button
                    type="button"
                    className="user-dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt />

                    <span>
                      Logout
                    </span>
                  </button>

                </div>
              )}

            </div>
          </div>
        )}

      </nav>

    </header>
  );
}

export default Navbar;