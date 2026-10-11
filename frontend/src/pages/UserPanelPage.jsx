import { useMemo } from "react";
import { useAuth } from "../context/useAuth";
import { useHotel } from "../context/HotelContext";
import { UserPortal } from "../components/outlineUser/UserPortal";
import { Link } from "react-router-dom";
import {
  Ticket,
  ShieldCheck,
  Wallet,
  Building,
  User,
} from "lucide-react";
import { getFirstName } from "../context/authRoles";

export default function UserPanelPage() {
  const { user } = useAuth();
  const { setIsMyBookingsOpen, bookings } = useHotel();
  const firstName = getFirstName(user);
  const isStaff = user?.role === "admin" || user?.role === "super_admin";

  const userBookings = useMemo(() => {
    if (!user) return bookings;
    const userEmail = (user.email || "").toLowerCase().trim();
    const userPhone = (user.phone || "").replace(/[^0-9]/g, "");
    const userName = (user.name || "").toLowerCase().trim();
    const matched = bookings.filter((b) => {
      const bEmail = (b.guestEmail || "").toLowerCase().trim();
      const bPhone = (b.guestPhone || "").replace(/[^0-9]/g, "");
      const bName = (b.guestName || "").toLowerCase().trim();
      return (
        (userEmail && bEmail === userEmail) ||
        (userPhone && bPhone && bPhone.includes(userPhone)) ||
        b.guestId === user.id ||
        (userName && bName.includes(userName))
      );
    });
    return matched.length > 0 ? matched : bookings;
  }, [bookings, user]);

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-150">
        {/* 1. TOP PORTAL SWITCHER BANNER (Matches Hotel Admin & Super Admin) */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#a67c32] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              USR
            </div>
            <div>
              <div className="text-sm font-black">
                SV Grand Luxury Rooms &bull; Tadipatri, AP
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isStaff && (
              <Link
                to="/hotel-admin"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Hotel Admin Console</span>
              </Link>
            )}
            {user?.role === "super_admin" && (
              <Link
                to="/super-admin"
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin Console</span>
              </Link>
            )}
          </div>
        </div>

        {/* 2. USER PROFILE & CONSOLE HERO CARD (Matches Hotel Admin & Super Admin Top Card) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#a67c32] uppercase tracking-wider mb-1">
              <User className="w-4 h-4" />
              <span>User Profile & Reservation Center &bull; SV Grand</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Welcome, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {user?.email || "User"} &bull; 24/7 Front Desk Concierge
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Wallet Balance Pill */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900">
              <Wallet className="w-4 h-4 text-[#a67c32]" />
              <span>Wallet: ₹750</span>
            </div>

            {/* My Bookings Action Button */}
            <button
              type="button"
              onClick={() => setIsMyBookingsOpen(true)}
              className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-[#a67c32]" />
              <span>My Bookings ({userBookings.length})</span>
            </button>
          </div>
        </div>

        {/* 3. USER PORTAL SECTIONS (Floor Map, Offers, Rooms Catalog, Amenities, Reviews, Transit) */}
        <UserPortal />
      </div>
    </main>
  );
}
