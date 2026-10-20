import { useState, useEffect, useRef } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useHotel } from "../context/HotelContext";
import { apiRequest } from "../services/api";
import { createIdempotencyKey } from "../services/idempotency";
import { useScrollReveal } from "../hooks/useScrollReveal";

function Booking() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerExternalBooking } = useHotel();
  const idempotencyKeyRef = useRef(createIdempotencyKey());

  useScrollReveal();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  // =========================
  // ROOM DETAILS
  // =========================

  const rooms = {
    "ac-single": {
      type: "AC ROOM",
      name: "AC Single Room",
      price: 1500,
    },

    "ac-family": {
      type: "AC ROOM",
      name: "AC Family Room",
      price: 1500,
    },

    "non-ac-single": {
      type: "NON-AC ROOM",
      name: "Non-AC Single Room",
      price: 1000,
    },

    "non-ac-double": {
      type: "NON-AC ROOM",
      name: "Non-AC Double Room",
      price: 1500,
    },

    "ac-deluxe": { type: "AC ROOM", name: "AC Single Room", price: 1500 },
    "ac-premium": { type: "AC ROOM", name: "AC Family Room", price: 1500 },
    "non-ac-standard": { type: "NON-AC ROOM", name: "Non-AC Single Room", price: 1000 },
    "non-ac-family": { type: "NON-AC ROOM", name: "Non-AC Double Room", price: 1500 },
  };

  const room =
    rooms[type] || rooms["ac-single"];


  // =========================
  // FORM DATA
  // =========================

  const [name, setName] = useState(user.name || user.fullName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [aadhaar, setAadhaar] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const [children13Plus, setChildren13Plus] =
    useState(0);

  const [childrenBelow13, setChildrenBelow13] =
    useState(0);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);


  // =========================
  // CALCULATE NIGHTS
  // =========================

  const calculateNights = () => {
    if (!checkIn || !checkOut) {
      return 0;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const difference = end - start;

    return Math.max(
      0,
      Math.ceil(
        difference /
          (1000 * 60 * 60 * 24)
      )
    );
  };

  const nights = calculateNights();


  // =========================
  // PRICE CALCULATION
  // =========================

  const extraGuestCount =
    children13Plus;

  const extraGuestChargePerNight =
    extraGuestCount * 500;

  const extraGuestTotal =
    extraGuestChargePerNight * nights;

  const roomTotal =
    room.price * nights;

  const grandTotal =
    roomTotal + extraGuestTotal;


  // =========================
  // TOTAL GUESTS
  // =========================

  const totalGuests =
    Number(adults) + Number(children);


  // =========================
  // CHILDREN COUNT
  // =========================

  const handleChildrenChange = (value) => {
    const count = Number(value);

    setChildren(count);

    if (count === 0) {
      setChildren13Plus(0);
      setChildrenBelow13(0);
    } else {
      setChildren13Plus(0);
      setChildrenBelow13(count);
    }
  };


  // =========================
  // 13+ CHILDREN
  // =========================

  const handle13PlusChange = (value) => {
    const count = Number(value);

    setChildren13Plus(count);

    setChildrenBelow13(
      Math.max(
        0,
        children - count
      )
    );
  };


  // =========================
  // BELOW 13 CHILDREN
  // =========================

  const handleBelow13Change = (value) => {
    const count = Number(value);

    setChildrenBelow13(count);

    setChildren13Plus(
      Math.max(
        0,
        children - count
      )
    );
  };


  // =========================
  // SUBMIT BOOKING
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");


    // =========================
    // CHECK GUEST DETAILS
    // =========================

    if (!name || !phone || !aadhaar) {
      alert(
        "Please enter your name, phone number and Aadhaar number."
      );

      return;
    }


    // =========================
    // CHECK AADHAAR
    // =========================

    if (aadhaar.length !== 12) {
      alert(
        "Please enter a valid 12-digit Aadhaar number."
      );

      return;
    }


    // =========================
    // CHECK DATES
    // =========================

    if (!checkIn || !checkOut) {
      alert(
        "Please select check-in and check-out dates."
      );

      return;
    }


    // =========================
    // CHECK VALID DATES
    // =========================

    if (nights <= 0) {
      alert(
        "Check-out date must be after check-in date."
      );

      return;
    }


    setSubmitting(true);

    try {
      const result = await apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: idempotencyKeyRef.current,
          roomName: room.name,
          name,
          phone,
          email: user.email || email,
          checkIn,
          checkOut,
          adults,
          children,
          children13Plus,
          childrenBelow13,
          totalGuests,
        }),
      });
      if (!result?.booking) {
        throw new Error("The account service returned an invalid booking response.");
      }
      try {
        registerExternalBooking(result.booking);
      } catch (regErr) {
        console.debug("External booking registration notice:", regErr);
      }
      idempotencyKeyRef.current = createIdempotencyKey();
      navigate("/booking-confirmation", { state: result.booking });
    } catch (requestError) {
      setSubmitError(requestError.message);
    } finally {
      setSubmitting(false);
    }

  };

  // =========================
  // PAGE
  // =========================

  return (
    <main className="booking-page">

      {/* =========================
          HEADER
      ========================= */}

      <section className="booking-header">

        <p className="section-label" data-reveal="fade">
          SV GRAND LUXURY ROOMS
        </p>

        <h1 data-reveal>
          Complete Your Booking
        </h1>

        <p data-reveal="fade">
          Enter your details below to request
          your reservation.
        </p>

      </section>


      {/* =========================
          BOOKING CONTAINER
      ========================= */}

      <section className="booking-container">


        {/* =========================
            BOOKING FORM
        ========================= */}

        <form
          className="booking-form"
          onSubmit={handleSubmit}
          data-reveal="up"
        >
          {submitError && (
            <p className="form-error" role="alert">{submitError}</p>
          )}

          {/* =========================
              GUEST DETAILS
          ========================= */}

          <div className="booking-form-heading">

            <span>
              01
            </span>

            <div>

              <h2>
                Guest Details
              </h2>

              <p>
                Please provide the primary
                guest information.
              </p>

            </div>

          </div>


          {/* =========================
              NAME
          ========================= */}

          <div className="form-group">

            <label>
              FULL NAME *
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />

          </div>


          {/* =========================
              PHONE + EMAIL
          ========================= */}

          <div className="form-row">

            <div className="form-group">

              <label>
                PHONE NUMBER *
              </label>

              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                required
              />

            </div>


            <div className="form-group">

              <label>
                EMAIL ADDRESS
              </label>

              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>

          </div>


          {/* =========================
              AADHAAR NUMBER
          ========================= */}

          <div className="form-group">

            <label>
              AADHAAR NUMBER *
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={12}
              placeholder="Enter 12-digit Aadhaar number"
              value={aadhaar}
              onChange={(e) => {
                const value =
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 12);

                setAadhaar(value);
              }}
              required
            />

          </div>


          {/* =========================
              STAY DETAILS
          ========================= */}

          <div className="booking-form-heading booking-heading-space">

            <span>
              02
            </span>

            <div>

              <h2>
                Stay Details
              </h2>

              <p>
                Select your preferred dates
                and number of guests.
              </p>

            </div>

          </div>


          {/* =========================
              CHECK IN + CHECK OUT
          ========================= */}

          <div className="form-row">

            <div className="form-group">

              <label>
                CHECK-IN *
              </label>

              <input
                type="date"
                value={checkIn}
                onChange={(e) =>
                  setCheckIn(e.target.value)
                }
                required
              />

            </div>


            <div className="form-group">

              <label>
                CHECK-OUT *
              </label>

              <input
                type="date"
                value={checkOut}
                onChange={(e) =>
                  setCheckOut(e.target.value)
                }
                required
              />

            </div>

          </div>


          {/* =========================
              ADULTS + CHILDREN
          ========================= */}

          <div className="form-row">

            <div className="form-group">

              <label>
                ADULTS
              </label>

              <select
                value={adults}
                onChange={(e) =>
                  setAdults(
                    Number(e.target.value)
                  )
                }
              >

                <option value="1">
                  1 Adult
                </option>

                <option value="2">
                  2 Adults
                </option>

                <option value="3">
                  3 Adults
                </option>

                <option value="4">
                  4 Adults
                </option>

              </select>

            </div>


            <div className="form-group">

              <label>
                CHILDREN
              </label>

              <select
                value={children}
                onChange={(e) =>
                  handleChildrenChange(
                    e.target.value
                  )
                }
              >

                <option value="0">
                  0 Children
                </option>

                <option value="1">
                  1 Child
                </option>

                <option value="2">
                  2 Children
                </option>

                <option value="3">
                  3 Children
                </option>

                <option value="4">
                  4 Children
                </option>

              </select>

            </div>

          </div>


          {/* =========================
              CHILDREN AGE
          ========================= */}

          {children > 0 && (

            <div className="children-age-box">

              <h3>
                Children Age Details
              </h3>

              <p>
                Guests aged 13 years and above
                are charged ₹500 per person
                per night.
              </p>


              <div className="form-row">

                {/* 13+ */}

                <div className="form-group">

                  <label>
                    13 YEARS & ABOVE
                  </label>

                  <select
                    value={children13Plus}
                    onChange={(e) =>
                      handle13PlusChange(
                        e.target.value
                      )
                    }
                  >

                    {Array.from(
                      {
                        length:
                          children + 1,
                      },
                      (_, index) => (

                        <option
                          key={index}
                          value={index}
                        >
                          {index}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* BELOW 13 */}

                <div className="form-group">

                  <label>
                    BELOW 13 YEARS
                  </label>

                  <select
                    value={childrenBelow13}
                    onChange={(e) =>
                      handleBelow13Change(
                        e.target.value
                      )
                    }
                  >

                    {Array.from(
                      {
                        length:
                          children + 1,
                      },
                      (_, index) => (

                        <option
                          key={index}
                          value={index}
                        >
                          {index}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* =========================
                  CHARGE NOTE
              ========================= */}

              <div className="age-charge-note">

                <span>
                  ✓
                </span>

                <p>

                  Below 13 years:
                  <strong>
                    {" "}FREE
                  </strong>

                  <br />

                  13 years and above:
                  <strong>
                    {" "}₹500/person/night
                  </strong>

                </p>

              </div>

            </div>

          )}


          {/* =========================
              SUBMIT
          ========================= */}

          <button
            type="submit"
            className="confirm-booking-btn"
            disabled={submitting}
          >

            {submitting ? "SENDING REQUEST…" : "REQUEST BOOKING"}

            <span>
              →
            </span>

          </button>


          <p className="booking-note">

            Your booking request will be reviewed
            and confirmed by the hotel.

          </p>

        </form>


        {/* =========================
            BOOKING SUMMARY
        ========================= */}

        <aside className="booking-summary" data-reveal="right">

          <p className="section-label">
            YOUR SELECTION
          </p>


          <div className="summary-room-type">
            {room.type}
          </div>


          <h2>
            {room.name}
          </h2>


          <div className="summary-price">

            ₹{room.price.toLocaleString("en-IN")}

            <span>
              / night
            </span>

          </div>


          {/* =========================
              SUMMARY DETAILS
          ========================= */}

          <div className="summary-details">

            <div className="summary-line">

              <span>
                Guests
              </span>

              <strong>
                {totalGuests}
              </strong>

            </div>


            <div className="summary-line">

              <span>
                Nights
              </span>

              <strong>
                {nights}
              </strong>

            </div>


            <div className="summary-line">

              <span>
                Room
              </span>

              <strong>
                ₹{roomTotal.toLocaleString("en-IN")}
              </strong>

            </div>


            <div className="summary-line">

              <span>
                Extra Guest Charges
              </span>

              <strong>
                ₹{extraGuestTotal.toLocaleString("en-IN")}
              </strong>

            </div>

          </div>


          {/* =========================
              TOTAL
          ========================= */}

          <div className="summary-total">

            <span>
              Total
            </span>

            <strong>
              ₹{grandTotal.toLocaleString("en-IN")}
            </strong>

          </div>


          {/* =========================
              POLICY
          ========================= */}

          <div className="summary-policy">

            <h3>
              Extra Guest Policy
            </h3>

            <p>
              <strong>
                13+ years:
              </strong>{" "}
              ₹500 per person per night
            </p>

            <p>
              <strong>
                Below 13 years:
              </strong>{" "}
              No additional charge
            </p>

          </div>


          {/* =========================
              TERMS
          ========================= */}

          <Link
            to={`/terms/${type}`}
            className="summary-terms-link"
          >
            ← View Terms & Conditions
          </Link>

        </aside>

      </section>

    </main>
  );
}

export default Booking;