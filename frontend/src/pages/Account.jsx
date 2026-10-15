import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";
import { useScrollReveal } from "../hooks/useScrollReveal";

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Account() {
  const { user, updateProfile, signOut } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [bookingsError, setBookingsError] = useState("");
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [name, setName] = useState(user.name || user.fullName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useScrollReveal(bookings.length);

  useEffect(() => {
    let active = true;

    apiRequest("/api/bookings?scope=mine")
      .then((payload) => {
        if (!Array.isArray(payload?.bookings)) {
          throw new Error("The account service returned an invalid bookings response.");
        }
        if (active) setBookings(payload.bookings);
      })
      .catch((requestError) => {
        if (active) setBookingsError(requestError.message);
      })
      .finally(() => {
        if (active) setBookingsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);

    try {
      await updateProfile({ name, phone });
      setNotice("Your profile has been updated.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    try {
      await signOut();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="account-page">
      <section className="account-heading">
        <p className="section-label" data-reveal="fade">SV GRAND LUXURY ROOMS</p>
        <h1 data-reveal>Your Account</h1>
        <p data-reveal="fade">Manage your profile and keep track of your stays.</p>
      </section>

      <div className="account-layout">
        <section className="account-card account-profile" data-reveal="left">
          <div className="account-card-heading">
            <div className="account-avatar">
              {(name || user.email || "G").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="section-label">PROFILE</p>
              <h2>{name || "Guest"}</h2>
            </div>
          </div>

          <form className="account-form" onSubmit={handleSave}>
            <label className="login-field">
              <span>Full name</span>
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="login-field">
              <span>Email address</span>
              <input value={user.email} readOnly />
            </label>
            <label className="login-field">
              <span>Phone number</span>
              <input
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="form-success" role="status">{notice}</p>}
            <button className="gold-button account-save" disabled={saving}>
              {saving ? "SAVING…" : "SAVE PROFILE"}
            </button>
          </form>
        </section>

        <section className="account-card account-history" data-reveal="right">
          <div className="account-section-heading">
            <div>
              <p className="section-label">YOUR STAYS</p>
              <h2>Recent booking history</h2>
            </div>
            <Link to="/my-bookings">View all</Link>
          </div>

          {bookingsError ? (
            <p className="account-inline-error" role="alert">{bookingsError}</p>
          ) : bookingsLoading ? (
            <p className="account-empty">Loading your recent bookings…</p>
          ) : bookings.length === 0 ? (
            <div className="account-empty">
              <p>Your reservations will appear here after booking.</p>
              <Link className="gold-button" to="/rooms">EXPLORE ROOMS</Link>
            </div>
          ) : (
            <div className="account-history-list">
              {bookings.slice(0, 4).map((booking) => (
                <article className="account-history-item" key={booking.bookingId} data-reveal="up">
                  <div>
                    <strong>{booking.roomName}</strong>
                    <span>{formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}</span>
                  </div>
                  <div className="account-history-meta">
                    <strong>₹{Number(booking.grandTotal || 0).toLocaleString("en-IN")}</strong>
                    <span>{booking.status || "Confirmed"}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="account-logout-row" data-reveal="fade">
        <span>Signed in as {user.email}</span>
        <button type="button" className="account-logout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </main>
  );
}

export default Account;
