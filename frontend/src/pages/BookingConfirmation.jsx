import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { apiRequest } from "../services/api";

function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state;
  useScrollReveal();

  const [settings, setSettings] = useState(null);
  const [utr, setUtr] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(
    booking?.paymentStatus || "awaiting_payment"
  );
  const [paymentMessage, setPaymentMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest("/api/hotel")
      .then((data) => setSettings(data.settings))
      .catch(() => {});
  }, []);

  if (!booking) {
    return (
      <main className="confirmation-page">
        <section className="confirmation-empty">
          <div className="confirmation-empty-icon" data-reveal="zoom">
            !
          </div>

          <p className="section-label" data-reveal="fade">
            SV GRAND LUXURY ROOMS
          </p>

          <h1 data-reveal>Booking Details Not Found</h1>

          <p data-reveal="fade">
            This booking confirmation is no longer available on this page. Please make a new
            booking.
          </p>

          <Link to="/rooms" className="gold-button" data-reveal="fade">
            VIEW ROOMS
          </Link>
        </section>
      </main>
    );
  }

  const reference = booking.requestReference || booking.bookingId;

  const submitPayment = async (event) => {
    event.preventDefault();
    setPaymentMessage("");
    setSubmitting(true);
    try {
      const result = await apiRequest(
        `/api/bookings/${encodeURIComponent(reference)}/payment`,
        { method: "POST", body: JSON.stringify({ utr: utr.trim() }) }
      );
      setPaymentStatus(result?.booking?.paymentStatus || "reference_submitted");
      setPaymentMessage(
        "Payment reference submitted. Our front desk will verify it and confirm your booking shortly."
      );
    } catch (error) {
      setPaymentMessage(error.message || "Could not submit the payment reference.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="confirmation-page">
      <section className="confirmation-header">
        <div className="confirmation-success-icon" data-reveal="zoom">
          ✓
        </div>

        <p className="section-label" data-reveal="fade">
          SV GRAND LUXURY ROOMS
        </p>

        <h1 data-reveal>Booking Request Received</h1>

        <p data-reveal="fade">
          Your booking request has been successfully submitted. Please keep your reference safe.
        </p>
      </section>

      <section className="confirmation-container">
        <div className="booking-id-card" data-reveal="up">
          <div>
            <p className="booking-id-label">
              {booking.status === "pending_payment" && paymentStatus !== "reference_submitted"
                ? "YOUR REQUEST REFERENCE"
                : "YOUR BOOKING ID / REFERENCE"}
            </p>

            <h2>{reference}</h2>

            <p>
              {booking.status === "pending_payment" && paymentStatus !== "reference_submitted"
                ? "This reference holds your room for a limited time. Complete the UPI payment below to confirm your booking."
                : "Please show this reference at the hotel reception during check-in."}
            </p>
          </div>

          <div className="booking-id-check">✓</div>
        </div>

        {(booking.status === "pending_payment" || paymentStatus === "reference_submitted") && (
          <div className="booking-id-card" data-reveal="up" style={{ display: "block" }}>
            <p className="booking-id-label">COMPLETE YOUR PAYMENT</p>
            <h2>₹{Number(booking.grandTotal || 0).toLocaleString("en-IN")}</h2>
            <p>
              Pay via UPI to <strong>{settings?.upiId || "3341101017051@cnrb"}</strong> (
              {settings?.upiPayeeName || "Kummara Papamma"}), then enter the UPI reference (UTR)
              below.
            </p>
            <img
              src={settings?.qrImagePath || "/payment-qr.jpeg"}
              alt="UPI payment QR code"
              style={{ width: 220, borderRadius: 12, margin: "12px 0" }}
            />
            {paymentStatus === "reference_submitted" ? (
              <p style={{ color: "#1f7a3d", fontWeight: 600 }}>
                ✓ Payment reference received. Awaiting front-desk verification.
              </p>
            ) : (
              <form onSubmit={submitPayment} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={utr}
                  onChange={(event) => setUtr(event.target.value)}
                  placeholder="Enter UPI UTR / transaction ID"
                  required
                  minLength={6}
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #d8c9a3",
                  }}
                />
                <button type="submit" className="gold-button" disabled={submitting}>
                  {submitting ? "SUBMITTING…" : "SUBMIT PAYMENT"}
                </button>
              </form>
            )}
            {paymentMessage && <p data-reveal="fade">{paymentMessage}</p>}
          </div>
        )}
      </section>
    </main>
  );
}

export default BookingConfirmation;
