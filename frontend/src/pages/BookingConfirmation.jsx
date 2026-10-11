import { Link, useLocation } from "react-router-dom";

function BookingConfirmation() {
  const location = useLocation();

  const booking = location.state;

  if (!booking) {
    return (
      <main className="confirmation-page">
        <section className="confirmation-empty">
          <div className="confirmation-empty-icon">!</div>

          <p className="section-label">
            SV GRAND LUXURY ROOMS
          </p>

          <h1>Booking Details Not Found</h1>

          <p>
            This booking confirmation is no longer available
            on this page. Please make a new booking.
          </p>

          <Link
            to="/rooms"
            className="gold-button"
          >
            VIEW ROOMS
          </Link>
        </section>
      </main>
    );
  }

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <main className="confirmation-page">

      <section className="confirmation-header">

        <div className="confirmation-success-icon">
          ✓
        </div>

        <p className="section-label">
          SV GRAND LUXURY ROOMS
        </p>

        <h1>Booking Request Received</h1>

        <p>
          Your booking request has been successfully
          submitted. Please keep your Booking ID safe.
        </p>

      </section>

      <section className="confirmation-container">

        {/* BOOKING ID */}

        <div className="booking-id-card">

          <div>
            <p className="booking-id-label">
              YOUR BOOKING ID
            </p>

            <h2>{booking.bookingId}</h2>

            <p>
              Please show this Booking ID at the
              hotel reception during check-in.
            </p>
          </div>

          <div className="booking-id-check">
            ✓
          </div>

        </div>

        {/* BOOKING DETAILS */}

        <div className="confirmation-grid">

          <div className="confirmation-main">

            <div className="confirmation-card">

              <div className="confirmation-card-heading">
                <span>01</span>

                <div>
                  <h2>Guest Details</h2>
                  <p>
                    Primary guest information
                  </p>
                </div>
              </div>

              <div className="confirmation-details">

                <div className="confirmation-detail">
                  <span>Guest Name</span>
                  <strong>{booking.name}</strong>
                </div>

                <div className="confirmation-detail">
                  <span>Phone Number</span>
                  <strong>{booking.phone}</strong>
                </div>

                {booking.email && (
                  <div className="confirmation-detail">
                    <span>Email Address</span>
                    <strong>{booking.email}</strong>
                  </div>
                )}

              </div>

            </div>


            <div className="confirmation-card">

              <div className="confirmation-card-heading">
                <span>02</span>

                <div>
                  <h2>Stay Details</h2>
                  <p>
                    Your selected room and stay
                  </p>
                </div>
              </div>

              <div className="confirmation-details">

                <div className="confirmation-detail">
                  <span>Room Type</span>
                  <strong>{booking.roomType}</strong>
                </div>

                <div className="confirmation-detail">
                  <span>Room</span>
                  <strong>{booking.roomName}</strong>
                </div>

                <div className="confirmation-detail">
                  <span>Check-in</span>
                  <strong>
                    {formatDate(booking.checkIn)}
                  </strong>
                </div>

                <div className="confirmation-detail">
                  <span>Check-out</span>
                  <strong>
                    {formatDate(booking.checkOut)}
                  </strong>
                </div>

                <div className="confirmation-detail">
                  <span>Number of Nights</span>
                  <strong>
                    {booking.nights}
                  </strong>
                </div>

                <div className="confirmation-detail">
                  <span>Total Guests</span>
                  <strong>
                    {booking.totalGuests}
                  </strong>
                </div>

                <div className="confirmation-detail">
                  <span>Adults</span>
                  <strong>
                    {booking.adults}
                  </strong>
                </div>

                <div className="confirmation-detail">
                  <span>Children</span>
                  <strong>
                    {booking.children}
                  </strong>
                </div>

              </div>

            </div>


            {booking.children > 0 && (
              <div className="confirmation-card">

                <div className="confirmation-card-heading">
                  <span>03</span>

                  <div>
                    <h2>Children Age Details</h2>
                    <p>
                      Extra guest charge information
                    </p>
                  </div>
                </div>

                <div className="confirmation-details">

                  <div className="confirmation-detail">
                    <span>13 Years & Above</span>
                    <strong>
                      {booking.children13Plus}
                    </strong>
                  </div>

                  <div className="confirmation-detail">
                    <span>Below 13 Years</span>
                    <strong>
                      {booking.childrenBelow13}
                    </strong>
                  </div>

                  <div className="confirmation-detail">
                    <span>Charge</span>
                    <strong>
                      ₹500 / person / night for 13+
                    </strong>
                  </div>

                </div>

              </div>
            )}

          </div>


          {/* PAYMENT / PRICE SUMMARY */}

          <aside className="confirmation-summary">

            <p className="section-label">
              BOOKING SUMMARY
            </p>

            <h2>{booking.roomName}</h2>

            <div className="confirmation-price">
              ₹{booking.price.toLocaleString("en-IN")}
              <span>/ night</span>
            </div>

            <div className="confirmation-summary-lines">

              <div>
                <span>
                  Room Charges
                </span>

                <strong>
                  ₹{booking.roomTotal.toLocaleString("en-IN")}
                </strong>
              </div>

              <div>
                <span>
                  Extra Guest Charges
                </span>

                <strong>
                  ₹{booking.extraGuestTotal.toLocaleString("en-IN")}
                </strong>
              </div>

            </div>

            <div className="confirmation-total">

              <span>Total Amount</span>

              <strong>
                ₹{booking.grandTotal.toLocaleString("en-IN")}
              </strong>

            </div>

            <div className="confirmation-policy">

              <h3>
                Hotel Guest Policy
              </h3>

              <p>
                <strong>13+ years:</strong>{" "}
                ₹500 per person per night
              </p>

              <p>
                <strong>Below 13 years:</strong>{" "}
                No additional charge
              </p>

            </div>

          </aside>

        </div>


        {/* RECEPTION MESSAGE */}

        <div className="reception-message">

          <div className="reception-icon">
            ✓
          </div>

          <div>

            <h3>
              Keep Your Booking ID Safe
            </h3>

            <p>
              Please show your Booking ID
              <strong> {booking.bookingId}</strong>
              {" "}at the hotel reception during
              check-in. The hotel staff can use this
              ID to identify your reservation.
            </p>

          </div>

        </div>


        {/* ACTION BUTTONS */}

        <div className="confirmation-actions">

          <Link
            to="/"
            className="confirmation-home-btn"
          >
            ← BACK TO HOME
          </Link>

          <Link
            to="/rooms"
            className="confirmation-rooms-btn"
          >
            VIEW ROOMS →
          </Link>

        </div>

      </section>

    </main>
  );
}

export default BookingConfirmation;