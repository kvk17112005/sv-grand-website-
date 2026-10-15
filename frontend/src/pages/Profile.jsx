import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaLock,
  FaKey,
  FaCalendarAlt,
  FaIdCard,
  FaCheckCircle,
  FaSuitcase,
  FaShieldAlt,
  FaConciergeBell,
  FaWifi,
  FaSignOutAlt,
  FaArrowRight,
  FaWhatsapp,
} from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";
import { Eye, EyeOff } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "./Profile.css";

function formatMembershipDate(dateString) {
  if (!dateString) return "Recent Member";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Recent Member";
  }
}

function getBookingCounts(bookings) {
  if (!Array.isArray(bookings)) return { total: 0, upcoming: 0, completed: 0 };
  const today = new Date().toISOString().slice(0, 10);
  let upcoming = 0;
  let completed = 0;

  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    if (b.checkIn > today) {
      upcoming++;
    } else {
      completed++;
    }
  }

  return {
    total: bookings.length,
    upcoming,
    completed,
  };
}

function Profile() {
  const { user, updateProfile, changePassword, signOut } = useAuth();
  const navigate = useNavigate();

  useScrollReveal();

  // Personal details state
  const [name, setName] = useState(user?.name || user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Bookings stats
  const [bookings, setBookings] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const isStaff = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    let active = true;
    apiRequest("/api/bookings")
      .then((payload) => {
        if (active && Array.isArray(payload?.bookings)) {
          setBookings(payload.bookings);
        }
      })
      .catch(() => {
        // Soft fail for stats in profile
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileNotice("");

    if (!name.trim()) {
      setProfileError("Full name is required.");
      return;
    }

    if (!phone.trim() || phone.trim().length < 7) {
      setProfileError("Please enter a valid phone number (at least 7 digits).");
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      setProfileNotice("Your profile details have been saved successfully.");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordNotice("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 10) {
      setPasswordError("New password must be at least 10 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordNotice("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (err) {
      setProfileError(err.message || "Error signing out.");
    }
  };

  const stats = getBookingCounts(bookings);
  const initials = (name || user?.email || "G").slice(0, 1).toUpperCase();
  const displayRole =
    user?.role === "super_admin"
      ? "Super Administrator"
      : user?.role === "admin"
      ? "Hotel Administrator"
      : "Luxury Guest Member";

  const customerId = user?.id
    ? `SVG-${user.id.slice(0, 8).toUpperCase()}`
    : "SVG-GUEST";

  return (
    <main className="profile-page">
      <section className="profile-heading">
        <p className="section-label" data-reveal="fade">SV GRAND LUXURY ROOMS</p>
        <h1 data-reveal>Guest Profile</h1>
        <p data-reveal>Manage your personal information, contact credentials, and reservation preferences.</p>
      </section>

      <div className="profile-layout">
        {/* SIDEBAR IDENTITY CARD */}
        <aside className="profile-sidebar">
          <div className="profile-card profile-badge-card" data-reveal="left">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{initials}</div>
              <div className="profile-verified-badge" title="Verified Account">
                <FaCheckCircle />
              </div>
            </div>

            <h2 className="profile-user-name">{name || "Valued Guest"}</h2>
            <span className={`profile-role-pill role-${user?.role || "customer"}`}>
              {displayRole}
            </span>

            <div className="profile-quick-stats">
              <div className="stat-item">
                <span>Bookings</span>
                <strong>{statsLoading ? "—" : stats.total}</strong>
              </div>
              <div className="stat-item">
                <span>Upcoming</span>
                <strong>{statsLoading ? "—" : stats.upcoming}</strong>
              </div>
              <div className="stat-item">
                <span>Completed</span>
                <strong>{statsLoading ? "—" : stats.completed}</strong>
              </div>
            </div>

            <div className="profile-id-row">
              <span>Customer ID:</span>
              <code>{customerId}</code>
            </div>
            <div className="profile-id-row">
              <span>Member Since:</span>
              <span>{formatMembershipDate(user?.createdAt)}</span>
            </div>
          </div>

          {/* QUICK SHORTCUTS */}
          <div className="profile-card profile-shortcuts" data-reveal="left">
            <p className="profile-shortcuts-title">Quick Actions</p>

            <Link to="/my-bookings" className="profile-shortcut-link">
              <span>
                <FaSuitcase /> My Bookings
              </span>
              <FaArrowRight size={12} />
            </Link>

            <Link to="/rooms" className="profile-shortcut-link">
              <span>
                <FaConciergeBell /> Explore Rooms & Reserve
              </span>
              <FaArrowRight size={12} />
            </Link>

            {isStaff && (
              <Link to="/admin" className="profile-shortcut-link">
                <span>
                  <FaShieldAlt /> Management Dashboard
                </span>
                <FaArrowRight size={12} />
              </Link>
            )}
          </div>
        </aside>

        {/* MAIN EDITABLE SECTIONS */}
        <section className="profile-main-content">
          {/* PERSONAL DETAILS CARD */}
          <div className="profile-card" data-reveal="up">
            <div className="profile-card-header">
              <div className="profile-card-header-left">
                <div className="profile-card-icon">
                  <FaUser />
                </div>
                <div>
                  <h2>Personal Information</h2>
                  <p>Update your display name and contact phone number.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="profile-grid-fields">
                <div className="profile-field">
                  <label htmlFor="profile-name">
                    <FaUser size={12} /> Full Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                  />
                  <span className="field-helper">Used for booking confirmations and check-in greeting.</span>
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-phone">
                    <FaPhoneAlt size={12} /> Phone Number
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit phone number"
                  />
                  <span className="field-helper">For reservation SMS reminders and desk assistance.</span>
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-email">
                    <FaEnvelope size={12} /> Registered Email
                    <span className="field-badge">Verified</span>
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={user?.email || ""}
                    readOnly
                  />
                  <span className="field-helper">Email is bound to your account and login credentials.</span>
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-role">
                    <FaIdCard size={12} /> Membership Tier
                  </label>
                  <input
                    id="profile-role"
                    type="text"
                    value={displayRole}
                    readOnly
                  />
                  <span className="field-helper">SV Grand privileges and booking role status.</span>
                </div>
              </div>

              {profileNotice && (
                <div className="profile-alert alert-success" role="status">
                  <FaCheckCircle /> {profileNotice}
                </div>
              )}

              {profileError && (
                <div className="profile-alert alert-error" role="alert">
                  {profileError}
                </div>
              )}

              <div className="profile-button-row">
                <button
                  type="submit"
                  className="profile-submit-btn"
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving Details…" : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>

          {/* ACCOUNT SECURITY CARD */}
          <div className="profile-card" data-reveal="up">
            <div className="profile-card-header">
              <div className="profile-card-header-left">
                <div className="profile-card-icon">
                  <FaKey />
                </div>
                <div>
                  <h2>Security & Password</h2>
                  <p>Change your account password to keep your SV Grand profile safe.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="profile-grid-fields single-col">
                <div className="profile-field">
                  <label htmlFor="profile-current-password">
                    <FaLock size={12} /> Current Password
                  </label>
                  <div className="login-password-wrapper">
                    <input
                      id="profile-current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      title={showCurrentPassword ? "Hide password" : "Show password"}
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="profile-grid-fields">
                  <div className="profile-field">
                    <label htmlFor="profile-new-password">
                      <FaKey size={12} /> New Password
                    </label>
                    <div className="login-password-wrapper">
                      <input
                        id="profile-new-password"
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 10 characters"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        title={showNewPassword ? "Hide password" : "Show password"}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <span className="field-helper">Must be at least 10 characters long.</span>
                  </div>

                  <div className="profile-field">
                    <label htmlFor="profile-confirm-password">
                      <FaKey size={12} /> Confirm New Password
                    </label>
                    <div className="login-password-wrapper">
                      <input
                        id="profile-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <span className="field-helper">Must match new password.</span>
                  </div>
                </div>
              </div>

              {passwordNotice && (
                <div className="profile-alert alert-success" role="status">
                  <FaCheckCircle /> {passwordNotice}
                </div>
              )}

              {passwordError && (
                <div className="profile-alert alert-error" role="alert">
                  {passwordError}
                </div>
              )}

              <div className="profile-button-row">
                <button
                  type="submit"
                  className="profile-submit-btn"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "Updating Password…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* GUEST PRIVILEGES & CONCIERGE CARD */}
          <div className="profile-card" data-reveal="up">
            <div className="profile-card-header">
              <div className="profile-card-header-left">
                <div className="profile-card-icon">
                  <FaConciergeBell />
                </div>
                <div>
                  <h2>SV Grand Guest Privileges</h2>
                  <p>Exclusive benefits included with your stay.</p>
                </div>
              </div>
            </div>

            <div className="profile-perks-grid">
              <div className="profile-perk-item" data-reveal="zoom">
                <div className="profile-perk-icon">
                  <FaWifi />
                </div>
                <strong>High-Speed Wi-Fi</strong>
                <p>Complimentary fiber Wi-Fi throughout hotel rooms & lobby.</p>
              </div>

              <div className="profile-perk-item" data-reveal="zoom">
                <div className="profile-perk-icon">
                  <FaConciergeBell />
                </div>
                <strong>24/7 Front Desk</strong>
                <p>Round-the-clock check-in support, luggage assistance & concierge.</p>
              </div>

              <div className="profile-perk-item" data-reveal="zoom">
                <div className="profile-perk-icon">
                  <FaCalendarAlt />
                </div>
                <strong>Flexible Stays</strong>
                <p>Priority room allocation and fast express check-in.</p>
              </div>
            </div>

            <div className="profile-support-banner">
              <div>
                <h3>Need Assistance With Your Stay?</h3>
                <p>Reach our hotel desk 24 hours a day for reservations or room service.</p>
              </div>
              <div className="profile-support-actions">
                <a href="tel:9885449702" className="profile-support-btn call-btn">
                  <FaPhoneAlt size={12} /> Call Desk
                </a>
                <a
                  href="https://wa.me/919885449702"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-support-btn whatsapp-btn"
                >
                  <FaWhatsapp size={14} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER SESSION ROW */}
      <div className="profile-footer-bar" data-reveal="fade">
        <span>Signed in as <strong>{user?.email}</strong></span>
        <button
          type="button"
          className="profile-signout-btn"
          onClick={handleSignOut}
        >
          <FaSignOutAlt /> Sign Out
        </button>
      </div>
    </main>
  );
}

export default Profile;
