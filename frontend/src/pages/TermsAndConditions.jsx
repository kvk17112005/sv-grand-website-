import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function TermsAndConditions() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (!agreed) {
      alert("Please agree to the Terms & Conditions to continue.");
      return;
    }

    navigate(`/booking/${type}`);
  };

  return (
    <main className="terms-page">
      <section className="terms-header">
        <p className="section-label">SV GRAND LUXURY ROOMS</p>
        <h1>Terms & Conditions</h1>
        <p>
          Please read the following terms and conditions
          carefully before proceeding with your booking.
        </p>
      </section>

      <section className="terms-container">
        <div className="terms-card">
          <div className="terms-intro">
            <span className="terms-icon">✓</span>
            <div>
              <h2>Before You Continue</h2>
              <p>
                Please review the hotel policies below.
                By continuing with your booking, you confirm
                that you have read and agreed to these terms.
              </p>
            </div>
          </div>

          <div className="terms-list">
            <div className="term-item">
              <span>01</span>
              <div>
                <h3>Booking Information</h3>
                <p>
                  Guests are required to provide accurate and
                  complete information while making a booking.
                </p>
              </div>
            </div>

            <div className="term-item">
              <span>02</span>
              <div>
                <h3>Guest Identification</h3>
                <p>
                  Guests are required to carry a valid
                  government-issued identification document,
                  such as an <strong>Aadhaar Card</strong>,
                  and present it at the time of check-in
                  for verification.
                </p>
              </div>
            </div>

            <div className="term-item">
              <span>03</span>
              <div>
                <h3>Extra Guest Charges</h3>
                <p>
                  Guests aged <strong>13 years and above</strong>{" "}
                  will be charged{" "}
                  <strong>₹500 per person per night</strong>.
                  Guests below 13 years can stay without any
                  additional guest charge.
                </p>
              </div>
            </div>

            <div className="term-item">
              <span>04</span>
              <div>
                <h3>Room Occupancy</h3>
                <p>
                  Room occupancy is subject to the capacity
                  of the selected room. Additional guests may
                  be accommodated subject to hotel policy.
                </p>
              </div>
            </div>

            <div className="term-item">
              <span>05</span>
              <div>
                <h3>Hotel Property</h3>
                <p>
                  Guests are responsible for any damage caused
                  to hotel property during their stay.
                </p>
              </div>
            </div>

            <div className="term-item">
              <span>06</span>
              <div>
                <h3>Hotel Policies</h3>
                <p>
                  Guests are requested to follow the hotel's
                  safety, cleanliness and general property rules
                  during their stay.
                </p>
              </div>
            </div>

            <div className="term-item">
              <span>07</span>
              <div>
                <h3>Booking Confirmation</h3>
                <p>
                  Submitting the booking form represents a
                  reservation request. Final confirmation is
                  subject to availability and hotel confirmation.
                </p>
              </div>
            </div>
          </div>

          <div className="terms-agreement">
            <label className="agreement-checkbox">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I have read and agree to the
                <strong> Terms & Conditions</strong> of
                SV Grand Luxury Rooms.
              </span>
            </label>
          </div>

          <div className="terms-actions">
            <Link
              to={`/room/${type}`}
              className="terms-back-btn"
            >
              ← Back to Room
            </Link>

            <button
              type="button"
              className="terms-continue-btn"
              onClick={handleContinue}
            >
              CONTINUE TO BOOKING →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default TermsAndConditions;