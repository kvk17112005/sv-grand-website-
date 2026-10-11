import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useHotel } from "../context/HotelContext";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../services/api";
import {
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  RotateCcw,
  Sparkles,
  BedDouble,
  MapPin,
  Luggage,
  ShieldCheck,
  CreditCard,
  User,
  Zap,
  Printer,
  ChevronRight,
  ArrowRight
} from "lucide-react";

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MyBookings() {
  const { user } = useAuth();
  const {
    bookings: hotelBookings,
    refreshBookingsFromBackend,
    isAutoUpdateEnabled,
    setIsAutoUpdateEnabled,
    hotel,
    formatCurrency
  } = useHotel();

  const [backendBookings, setBackendBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState("all");

  // Fetch bookings from backend
  const fetchBackendBookings = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const response = await apiRequest("/api/bookings");
      if (response && Array.isArray(response.bookings)) {
        setBackendBookings(response.bookings);
        setError("");
      }
    } catch (err) {
      if (!isSilent) {
        console.warn("Could not reach backend bookings directly:", err);
      }
    } finally {
      if (!isSilent) {
        setIsRefreshing(false);
        setLoading(false);
      }
      setLastUpdated(new Date());
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchBackendBookings(false);
    if (typeof refreshBookingsFromBackend === "function") {
      refreshBookingsFromBackend();
    }
  }, [fetchBackendBookings, refreshBookingsFromBackend]);

  // Live Auto-Update Polling every 4 seconds
  useEffect(() => {
    if (!isAutoUpdateEnabled) return;

    const interval = setInterval(() => {
      fetchBackendBookings(true);
      if (typeof refreshBookingsFromBackend === "function") {
        refreshBookingsFromBackend();
      }
    }, 4000);

    const onFocus = () => {
      fetchBackendBookings(true);
      if (typeof refreshBookingsFromBackend === "function") {
        refreshBookingsFromBackend();
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onFocus);
    };
  }, [isAutoUpdateEnabled, fetchBackendBookings, refreshBookingsFromBackend]);

  // Unify bookings from Backend and HotelContext
  const unifiedBookings = useMemo(() => {
    const map = new Map();

    const normalize = (item) => {
      const id = item.bookingCode || item.bookingId || item.id || `BK-${item.room_number || "GUEST"}`;
      const guestEmail = (item.guestEmail || item.guest_email || "").toLowerCase();
      const guestPhone = item.guestPhone || item.guest_phone || "";
      const guestName = item.guestName || item.guest_name || "Guest";
      const roomName = item.roomName || item.room_name || item.roomTypeName || "Deluxe Room";
      const roomNumber = item.roomNumber || item.room_number || "";
      const checkIn = item.checkIn || item.check_in || "";
      const checkOut = item.checkOut || item.check_out || "";
      const nights = Number(item.nights || item.stay_nights || 1);
      const grandTotal = Number(item.grandTotal || item.grand_total || item.total_amount || 0);
      const totalGuests = Number(item.totalGuests || item.guests || 1);
      const status = (item.status || "confirmed").toLowerCase();
      const paymentStatus = (item.paymentStatus || item.payment_status || "pending").toLowerCase();
      const createdAt = item.createdAt || item.created_at || new Date().toISOString();

      return {
        id,
        bookingCode: id,
        bookingId: id,
        guestEmail,
        guestPhone,
        guestName,
        roomName,
        roomNumber,
        checkIn,
        checkOut,
        nights,
        grandTotal,
        totalGuests,
        status,
        paymentStatus,
        createdAt,
        raw: item
      };
    };

    // 1. Hotel context bookings
    if (Array.isArray(hotelBookings)) {
      hotelBookings.forEach((b) => {
        const norm = normalize(b);
        map.set(norm.id, norm);
      });
    }

    // 2. Backend bookings (merging with priority on live backend data)
    if (Array.isArray(backendBookings)) {
      backendBookings.forEach((b) => {
        const norm = normalize(b);
        map.set(norm.id, norm);
      });
    }

    const all = Array.from(map.values());

    // Filter for current user if logged in
    const userEmail = (user?.email || "").toLowerCase().trim();
    const userPhone = (user?.phone || "").trim();
    const userName = (user?.name || "").toLowerCase().trim();

    if (userEmail || userPhone) {
      const filtered = all.filter((b) => {
        const matchesEmail = userEmail && b.guestEmail === userEmail;
        const matchesPhone = userPhone && b.guestPhone.includes(userPhone.replace(/\D/g, ""));
        const matchesName = userName && b.guestName.toLowerCase().includes(userName);
        return matchesEmail || matchesPhone || matchesName;
      });
      // If user has specific bookings, return those; otherwise return recent session bookings
      if (filtered.length > 0) return filtered;
    }

    // Fallback: return all bookings sorted by createdAt
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [hotelBookings, backendBookings, user]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") {
      return {
        label: "⏳ Pending Front Desk Approval",
        bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        dot: "bg-amber-400"
      };
    }
    if (s === "approved" || s === "confirmed") {
      return {
        label: "✅ Approved & Confirmed",
        bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        dot: "bg-emerald-400"
      };
    }
    if (s === "checked_in" || s === "checked-in") {
      return {
        label: "🔑 Checked-In (Active Stay)",
        bg: "bg-blue-500/10 border-blue-500/30 text-blue-400",
        dot: "bg-blue-400"
      };
    }
    if (s === "checked_out" || s === "checked-out" || s === "expired") {
      return {
        label: "Completed Stay",
        bg: "bg-slate-700/30 border-slate-600/40 text-slate-300",
        dot: "bg-slate-400"
      };
    }
    if (s === "cancelled") {
      return {
        label: "Cancelled",
        bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
        dot: "bg-rose-400"
      };
    }
    return {
      label: status,
      bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
      dot: "bg-amber-400"
    };
  };

  const filteredBookings = useMemo(() => {
    if (activeTab === "all") return unifiedBookings;
    if (activeTab === "pending") {
      return unifiedBookings.filter((b) => b.status === "pending");
    }
    if (activeTab === "confirmed") {
      return unifiedBookings.filter((b) => b.status === "confirmed" || b.status === "approved" || b.status === "checked_in");
    }
    if (activeTab === "completed") {
      return unifiedBookings.filter((b) => b.status === "checked_out" || b.status === "expired" || b.status === "cancelled");
    }
    return unifiedBookings;
  }, [unifiedBookings, activeTab]);

  return (
    <main className="min-h-screen bg-[#0d1117] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-[#161b22] to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {hotel?.name || "SV GRAND LUXURY ROOMS"}
                </span>
                <span className="text-xs text-slate-400">User Panel</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                My Bookings & Reservations
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-1">
                Track live reservation status, Front Desk approvals, and stay invoices.
              </p>
            </div>

            {/* Live Auto-Update Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAutoUpdateEnabled(!isAutoUpdateEnabled)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isAutoUpdateEnabled
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/30"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
                title="Toggles automatic background polling for live approval and room assignment updates"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAutoUpdateEnabled
                      ? "bg-emerald-400 animate-ping"
                      : "bg-slate-500"
                  }`}
                />
                <span className="flex items-center gap-1.5">
                  <Zap className={`w-3.5 h-3.5 ${isAutoUpdateEnabled ? "text-emerald-400" : "text-slate-400"}`} />
                  Auto-Update: {isAutoUpdateEnabled ? "ON" : "OFF"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchBackendBookings(false);
                  if (typeof refreshBookingsFromBackend === "function") {
                    refreshBookingsFromBackend();
                  }
                }}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : "text-slate-400"}`} />
                <span>{isRefreshing ? "Refreshing…" : "Refresh Now"}</span>
              </button>

              <Link
                to="/rooms"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:scale-105"
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Book Another Room</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80 text-sm">
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 text-xs block">Total Bookings</span>
              <strong className="text-xl font-bold text-white">{unifiedBookings.length}</strong>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
              <span className="text-amber-400/80 text-xs block">Pending Approval</span>
              <strong className="text-xl font-bold text-amber-400">
                {unifiedBookings.filter((b) => b.status === "pending").length}
              </strong>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
              <span className="text-emerald-400/80 text-xs block">Confirmed / Active</span>
              <strong className="text-xl font-bold text-emerald-400">
                {unifiedBookings.filter((b) => b.status === "confirmed" || b.status === "approved" || b.status === "checked_in").length}
              </strong>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 text-xs block">Last Synced</span>
              <strong className="text-xs font-mono font-medium text-slate-300 block mt-1 truncate">
                {lastUpdated.toLocaleTimeString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: `All (${unifiedBookings.length})` },
              { id: "pending", label: `Pending Approval (${unifiedBookings.filter((b) => b.status === "pending").length})` },
              { id: "confirmed", label: `Confirmed (${unifiedBookings.filter((b) => b.status === "confirmed" || b.status === "approved" || b.status === "checked_in").length})` },
              { id: "completed", label: `Completed / Other` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Auto-syncs every 4s across all Admin & User tabs
          </span>
        </div>

        {/* Content Section */}
        {loading && unifiedBookings.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">Loading your reservations…</h3>
            <p className="text-xs text-slate-400 mt-1">Connecting to Front Desk database</p>
          </div>
        ) : unifiedBookings.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-4">
            <Luggage className="w-14 h-14 text-slate-600 mx-auto" />
            <h2 className="text-xl font-bold text-white">No Bookings Found Yet</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              You do not have any room reservations on record yet. Explore our luxury rooms and book your stay in seconds!
            </p>
            <div className="pt-2">
              <Link
                to="/rooms"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <span>Browse Available Rooms</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-sm">No reservations match the "{activeTab}" filter.</p>
            <button
              onClick={() => setActiveTab("all")}
              className="mt-3 text-xs text-amber-400 hover:underline"
            >
              View all bookings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredBookings.map((booking) => {
              const statusInfo = getStatusBadge(booking.status);
              const isPending = booking.status === "pending";

              return (
                <div
                  key={booking.id}
                  className="bg-[#161b22] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-xl transition-all relative overflow-hidden"
                >
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] tracking-wider uppercase text-slate-500 font-semibold block">
                          BOOKING REFERENCE CODE
                        </span>
                        <span className="text-lg font-mono font-bold text-amber-400 tracking-wide select-all">
                          {booking.bookingCode}
                        </span>
                      </div>

                      {booking.roomNumber && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                          Room #{booking.roomNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Pending Notice Callout */}
                  {isPending && (
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-300">
                        <strong className="font-semibold block text-amber-200">
                          Reservation Received & Pending Hotel Admin Approval
                        </strong>
                        Your booking code <code className="bg-amber-950/60 px-1 py-0.5 rounded font-mono font-bold text-white">{booking.bookingCode}</code> is currently being confirmed by the SV Grand Front Desk. This page will update automatically once verified.
                      </div>
                    </div>
                  )}

                  {/* Main Grid Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {/* Room & Stay info */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-slate-400 block">Room Category</span>
                        <strong className="text-base text-white font-semibold flex items-center gap-2 mt-0.5">
                          <BedDouble className="w-4 h-4 text-amber-400" />
                          {booking.roomName}
                        </strong>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{hotel?.city || "Tirupati, Andhra Pradesh"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>Reserved for: <strong className="text-slate-300">{booking.guestName}</strong> ({booking.totalGuests} guest{booking.totalGuests > 1 ? "s" : ""})</span>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Check-in</span>
                        <strong className="text-white font-medium">{formatDate(booking.checkIn)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Check-out</span>
                        <strong className="text-white font-medium">{formatDate(booking.checkOut)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                        <span className="text-slate-400">Duration</span>
                        <span className="text-amber-400 font-semibold">{booking.nights} Night{booking.nights > 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Financials & Actions */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Total Price</span>
                          <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                            booking.paymentStatus === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {booking.paymentStatus === "paid" ? "Paid Online" : "Pay at Front Desk"}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {formatCurrency ? formatCurrency(booking.grandTotal) : `₹${booking.grandTotal.toLocaleString("en-IN")}`}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Booking total</p>
                      </div>

                      <div className="pt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Voucher</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
