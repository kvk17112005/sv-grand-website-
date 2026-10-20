import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { apiRequest } from "../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function BookingConfirmation() {
  const location = useLocation();
  const initialBooking = location.state;
  useScrollReveal();

  const [booking, setBooking] = useState(initialBooking || null);
  const [intent, setIntent] = useState(null);
  const [message, setMessage] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const bookingId = booking?.id;
  const paymentId = intent?.paymentId;

  const startPayment = useCallback(async () => {
    if (!bookingId) return;
    setIsStarting(true);
    setMessage("");
    try {
      const result = await apiRequest(
        `/api/bookings/${encodeURIComponent(bookingId)}/payment-intent`,
        { method: "POST", body: JSON.stringify({}) }
      );
      setIntent(result.intent);
      setBooking((current) =>
        current
          ? {
              ...current,
              bookingStatus: result.booking.bookingStatus,
              status: result.booking.status,
              paymentStatus: result.booking.paymentStatus,
            }
          : current
      );
    } catch (error) {
      setMessage(error.message || "Could not create a UPI payment request.");
    } finally {
      setIsStarting(false);
    }
  }, [bookingId]);

  const checkPayment = useCallback(async () => {
    if (!paymentId) return;
    setIsChecking(true);
    try {
      const result = await apiRequest(`/api/payments/${encodeURIComponent(paymentId)}`);
      setIntent((current) => ({ ...current, status: result.payment.status }));
      setBooking((current) =>
        current
          ? {
              ...current,
              bookingStatus: result.booking.bookingStatus,
              status: result.booking.status,
              paymentStatus: result.booking.paymentStatus,
            }
          : current
      );
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Payment status could not be refreshed. It remains unverified.");
    } finally {
      setIsChecking(false);
    }
  }, [paymentId]);

  useEffect(() => {
    if (!paymentId || intent.status !== "pending") return undefined;
    const interval = window.setInterval(checkPayment, 5000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkPayment();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", checkPayment);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", checkPayment);
    };
  }, [paymentId, intent?.status, checkPayment]);

  if (!booking) {
    return (
      <main className="confirmation-page">
        <section className="confirmation-empty">
          <div className="confirmation-empty-icon" data-reveal="zoom">!</div>
          <p className="section-label" data-reveal="fade">SV GRAND LUXURY ROOMS</p>
          <h1 data-reveal>Booking Details Not Found</h1>
          <p data-reveal="fade">
            This booking request is no longer available on this page. Please start a new booking.
          </p>
          <Link to="/rooms" className="gold-button" data-reveal="fade">VIEW ROOMS</Link>
        </section>
      </main>
    );
  }

  const reference = booking.bookingId || booking.requestReference;
  const paymentStatus = intent?.status || booking.paymentStatus || "pending";
  const isConfirmed = booking.status === "confirmed";
  const isSettled = ["success", "verified", "paid"].includes(String(paymentStatus).toLowerCase());
  const canRetry = ["failed", "cancelled"].includes(String(paymentStatus).toLowerCase());

  return (
    <main className="confirmation-page">
      <section className="confirmation-header">
        <div className="confirmation-success-icon" data-reveal="zoom">
          {isConfirmed ? "✓" : "…"}
        </div>
        <p className="section-label" data-reveal="fade">SV GRAND LUXURY ROOMS</p>
        <h1 data-reveal>
          {isConfirmed
            ? "Booking Confirmed"
            : isSettled
              ? "Payment Received — Confirmation Pending"
              : "Booking Request Received"}
        </h1>
        <p data-reveal="fade">
          {isConfirmed
            ? "Your payment was verified and your reservation is confirmed."
            : isSettled
              ? "Payment is verified. The room is awaiting final confirmation; please contact the hotel if the status does not update."
              : "Your booking request is pending payment verification. The room is not confirmed yet, and availability may change. Returning from a UPI app does not confirm payment."}
        </p>
      </section>

      <section className="confirmation-container">
        <div className="booking-id-card" data-reveal="up">
          <div>
            <p className="booking-id-label">{isConfirmed ? "BOOKING ID" : "BOOKING REFERENCE"}</p>
            <h2>{reference}</h2>
            <p>
              {booking.checkIn} to {booking.checkOut} &middot; {booking.roomName}
            </p>
            <p className="mt-2">
              Booking status: <strong>{isConfirmed ? "Confirmed" : "Pending payment verification"}</strong>
            </p>
          </div>
          <div className="booking-id-check">{isConfirmed ? "✓" : "…"}</div>
        </div>

        {booking.paymentMethod === "pay_at_hotel" ? (
          <div className="booking-id-card" data-reveal="up" style={{ display: "block" }}>
            <p className="booking-id-label">PAYMENT AT HOTEL</p>
            <h2>{formatCurrency(booking.grandTotal)}</h2>
            <p>Payment has not been collected or verified online. The booking remains unconfirmed.</p>
          </div>
        ) : (
          <div className="booking-id-card" data-reveal="up" style={{ display: "block" }}>
            <p className="booking-id-label">UPI PAYMENT</p>
            <h2>{formatCurrency(intent?.amount ?? booking.grandTotal)}</h2>
            <p>
              Payment status: <strong>{isSettled ? "SUCCESS" : paymentStatus.toUpperCase()}</strong>
            </p>

            {intent?.upiUri && !isSettled && (
              <a
                className="gold-button"
                href={intent.upiUri}
                aria-label={`Pay ${formatCurrency(intent.amount)} now with a compatible UPI app`}
              >
                Pay {formatCurrency(intent.amount)} Now
              </a>
            )}

            {(!intent || canRetry) && !isSettled && (
              <button
                type="button"
                className="gold-button"
                onClick={startPayment}
                disabled={isStarting}
              >
                {isStarting
                  ? "PREPARING PAYMENT…"
                  : canRetry
                    ? "RETRY PAYMENT"
                    : "PREPARE UPI PAYMENT"}
              </button>
            )}

            {intent?.paymentId && (
              <button
                type="button"
                className="gold-button"
                onClick={checkPayment}
                disabled={isChecking}
                style={{ marginLeft: 8 }}
              >
                {isChecking ? "CHECKING…" : "CHECK PAYMENT STATUS"}
              </button>
            )}

            <p className="mt-3">
              A UPI link only starts a payment request. This page updates to success only after
              the backend receives a trusted provider verification.
            </p>
            <p className="mt-2">
              After paying, return to this browser tab; payment status refreshes automatically
              when you return. The UPI app and browser control whether they switch back automatically.
              A compatible app may handle the link on mobile; desktop browsers may not have a UPI
              app available. No QR scan or customer UPI ID is required.
            </p>
          </div>
        )}

        {message && <p role="alert" data-reveal="fade">{message}</p>}
      </section>
    </main>
  );
}

export default BookingConfirmation;
