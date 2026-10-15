import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useScrollReveal } from "../hooks/useScrollReveal";

import acRoom1 from "../assets/hotel/ac-room-1.jpg";
import premiumAcRoom from "../assets/hotel/premium-ac-room.jpg";
import nonAcRoom1 from "../assets/hotel/non-ac-room-1.jpg";
import nonAcRoom2 from "../assets/hotel/non-ac-room-2.jpg";

function RoomDetails() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useScrollReveal();

  const rooms = {
    "ac-single": {
      type: "AC ROOM",
      name: "AC Single Room",
      price: 1500,
      image: acRoom1,
      description:
        "A comfortable air-conditioned room designed for guests looking for a relaxing and convenient stay at SV Grand Luxury Rooms.",
      facilities: [
        "Air Conditioning",
        "TV",
        "Attached Bathroom",
        "Comfortable Bed",
        "Room Service",
        "Daily Housekeeping",
      ],
    },

    "ac-family": {
      type: "AC ROOM",
      name: "AC Family Room",
      price: 1500,
      image: premiumAcRoom,
      description:
        "A spacious air-conditioned room with essential facilities for a comfortable and convenient stay.",
      facilities: [
        "Air Conditioning",
        "TV",
        "Attached Bathroom",
        "Comfortable Bed",
        "Room Service",
        "Daily Housekeeping",
      ],
    },

    "non-ac-single": {
      type: "NON-AC ROOM",
      name: "Non-AC Single Room",
      price: 1000,
      image: nonAcRoom1,
      description:
        "A clean and comfortable room offering an affordable accommodation option for guests visiting Tadipatri.",
      facilities: [
        "Comfortable Bed",
        "TV",
        "Attached Bathroom",
        "Housekeeping",
      ],
    },

    "non-ac-double": {
      type: "NON-AC ROOM",
      name: "Non-AC Double Room",
      price: 1500,
      image: nonAcRoom2,
      description:
        "A comfortable room suitable for families and guests looking for an affordable and convenient stay.",
      facilities: [
        "Comfortable Beds",
        "TV",
        "Attached Bathroom",
        "Housekeeping",
      ],
    },
  };

  const legacyRoomTypes = {
    "ac-deluxe": "ac-single",
    "ac-premium": "ac-family",
    "non-ac-standard": "non-ac-single",
    "non-ac-family": "non-ac-double",
  };
  const room = rooms[type] || rooms[legacyRoomTypes[type]];

  if (!room) {
    return (
      <main className="not-found-page">

        <h1>
          Room Not Found
        </h1>

        <p>
          The selected room could not be found.
        </p>

        <Link
          to="/rooms"
          className="gold-button"
        >
          BACK TO ROOMS
        </Link>

      </main>
    );
  }

  return (
    <main className="room-details-page">

      <section className="room-details">

        <div className="room-details-image" data-reveal="left">

          <img
            src={room.image}
            alt={room.name}
          />

        </div>


        <div className="room-details-content">

          <p className="room-type" data-reveal="fade">
            {room.type}
          </p>

          <h1 data-reveal>
            {room.name}
          </h1>

          {user && (
            <div className="detail-price" data-reveal="fade">
              ₹{room.price.toLocaleString("en-IN")}
              <span> / night</span>
            </div>
          )}

          <p className="detail-description" data-reveal>
            {room.description}
          </p>


          <h3 data-reveal>
            Room Facilities
          </h3>

          <ul className="facilities-list" data-reveal>

            {room.facilities.map((facility) => (

              <li key={facility}>
                ✓ {facility}
              </li>

            ))}

          </ul>


          <div className="details-actions" data-reveal="fade">

            <Link
              to="/rooms"
              className="back-btn"
            >
              ← Back to Rooms
            </Link>

            <button
              type="button"
              className="reserve-btn"
              onClick={() => {
              if (user) {
               navigate(`/terms/${type}`);
              } else {
                navigate("/login", {
              state: {
          redirectTo: `/terms/${type}`,
        },
      });
    }
  }}
>
  Book This Room
</button>

          </div>

        </div>

      </section>

    </main>
  );
}

export default RoomDetails;