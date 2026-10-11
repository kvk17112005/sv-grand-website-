import React, { useState, useEffect } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Booking, PhysicalRoom } from '../../types/hotel';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  BedDouble,
  ShieldCheck,
  CreditCard,
  Zap,
  Calendar,
  AlertTriangle,
  QrCode,
  ArrowRight,
  Sparkles,
  Lock,
  RotateCcw
} from 'lucide-react';

export const AdminBookingVerification: React.FC = () => {
  const {
    bookings,
    physicalRooms,
    roomTypes,
    formatCurrency,
    approveBooking,
    rejectBooking,
    expireBookingNow,
    searchBookingByCode,
    searchBookingAsync,
    refreshBookingsFromBackend,
    isAutoUpdateEnabled,
    setIsAutoUpdateEnabled
  } = useHotel();

  const [inputCode, setInputCode] = useState('');
  const [matchedBooking, setMatchedBooking] = useState<Booking | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync latest bookings from database on mount and auto-update interval
  useEffect(() => {
    refreshBookingsFromBackend();
    if (!isAutoUpdateEnabled) return;
    const interval = setInterval(() => {
      refreshBookingsFromBackend();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoUpdateEnabled, refreshBookingsFromBackend]);

  // Pending bookings queue
  const pendingBookings = bookings.filter((b) => b.approvalStatus === 'pending');

  // Auto-fetch when typing or changing inputCode
  useEffect(() => {
    let isCancelled = false;
    const query = inputCode.trim();

    if (query.length >= 3) {
      const found = searchBookingByCode(query);
      if (found) {
        setMatchedBooking(found);
        setFeedbackMsg(null);
      } else {
        // Check backend database for this booking
        searchBookingAsync(query).then((backendFound) => {
          if (isCancelled) return;
          if (backendFound) {
            setMatchedBooking(backendFound);
            setFeedbackMsg(null);
          } else if (query.length >= 7) {
            setMatchedBooking(null);
            setFeedbackMsg({ type: 'error', text: `No booking found matching code "${query}"` });
          } else {
            setMatchedBooking(null);
            setFeedbackMsg(null);
          }
        });
      }
    } else {
      setMatchedBooking(null);
      setFeedbackMsg(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [inputCode, bookings]);

  const handleApprove = (code: string) => {
    const res = approveBooking(code);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: `Booking ${code} has been APPROVED and confirmed!` });
      if (res.booking) setMatchedBooking(res.booking);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleReject = (code: string) => {
    const res = rejectBooking(code, 'Cancelled by Front Desk Admin');
    setFeedbackMsg({ type: 'error', text: `Booking ${code} was rejected.` });
    const found = searchBookingByCode(code);
    setMatchedBooking(found || null);
  };

  const handleQuickSelect = (code: string) => {
    setInputCode(code);
  };

  const formatRemainingTime = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Duration expired';
    const hours = Math.floor(diffMs / (3600 * 1000));
    const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#a67c32] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              Admin Verification Console
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live Real-Time Sync Active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1">
            Booking Code Verification & Approval
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Enter the unique customer booking confirmation code (e.g. SVG-84920) to automatically fetch guest and stay details for admin approval.
          </p>
        </div>

        {/* Controls and pending approvals badge */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsAutoUpdateEnabled(!isAutoUpdateEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isAutoUpdateEnabled
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
            }`}
            title="Toggle live 4-second auto updates for newly created bookings"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAutoUpdateEnabled ? "bg-emerald-500 animate-ping" : "bg-gray-400"
              }`}
            />
            <Zap className={`w-3.5 h-3.5 ${isAutoUpdateEnabled ? "text-emerald-600" : "text-gray-400"}`} />
            <span>Auto-Update: {isAutoUpdateEnabled ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true);
              await refreshBookingsFromBackend();
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#a67c32]" : "text-gray-500"}`} />
            <span>{isRefreshing ? "Syncing…" : "Sync"}</span>
          </button>

          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>{pendingBookings.length} Awaiting Approval</span>
          </div>
        </div>
      </div>

      {/* Code Search Input Section */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          Enter Customer Booking Confirmation Code
        </label>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="e.g. SVG-88219 or SVG-91024"
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-base font-mono font-bold tracking-wider text-gray-900 focus:bg-white focus:outline-hidden focus:border-[#a67c32] transition-colors"
          />
          {inputCode && (
            <button
              onClick={() => {
                setInputCode('');
                setMatchedBooking(null);
                setFeedbackMsg(null);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold bg-gray-200 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Pending Chips */}
        {pendingBookings.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase">
              Pending in Queue (Click to test):
            </span>
            {pendingBookings.map((b) => (
              <button
                key={b.id}
                onClick={() => handleQuickSelect(b.bookingCode || b.id)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>{b.bookingCode || b.id}</span>
                <span className="text-[10px] text-amber-700 font-sans">({b.guestName})</span>
              </button>
            ))}
          </div>
        )}

        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* Fetched Booking Details Card */}
      {matchedBooking ? (
        <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden shadow-xs animate-in fade-in duration-200">
          {/* Card Status Header */}
          <div className="p-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#a67c32] text-white flex items-center justify-center font-black text-sm shadow-xs">
                SV
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-gray-900 tracking-wide">
                    {matchedBooking.bookingCode || matchedBooking.id}
                  </span>
                  {matchedBooking.approvalStatus === 'approved' ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>APPROVED & CONFIRMED</span>
                    </span>
                  ) : matchedBooking.approvalStatus === 'rejected' ? (
                    <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-600" />
                      <span>REJECTED</span>
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>PENDING ADMIN APPROVAL</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(matchedBooking.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Room Assignment Badge */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400">Assigned Room</span>
              <div className="font-black text-base text-gray-900">
                {matchedBooking.assignedRoomNumber ? `Room #${matchedBooking.assignedRoomNumber}` : 'Not assigned'}
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Left: User Details */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                <User className="w-4 h-4 text-[#a67c32]" />
                <span>Guest Profile & Contact</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Full Name:</span>
                  <span className="font-bold text-gray-900">{matchedBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Mobile Phone:</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{matchedBooking.guestPhone}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Email Address:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[200px] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span>{matchedBooking.guestEmail}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Guest Count:</span>
                  <span className="font-semibold text-gray-900">
                    {matchedBooking.guestsCount.adults} Adults
                    {matchedBooking.guestsCount.children > 0 && `, ${matchedBooking.guestsCount.children} Children`}
                  </span>
                </div>
                {matchedBooking.specialRequests && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-500 font-medium">Special Request:</span>
                    <p className="font-medium text-gray-800 bg-gray-50 p-2 rounded-lg mt-1">
                      {matchedBooking.specialRequests}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Stay & Payment Information */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                <BedDouble className="w-4 h-4 text-[#a67c32]" />
                <span>Stay & Payment Verification</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Room Type:</span>
                  <span className="font-bold text-gray-900">{matchedBooking.roomTypeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Stay Duration:</span>
                  <span className="font-bold text-gray-900 flex items-center gap-1">
                    {matchedBooking.stayDuration === '12h' ? (
                      <span className="bg-red-50 text-[#a67c32] px-2 py-0.5 rounded font-black text-[11px] flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current" />
                        <span>12 Hours (30% Discount)</span>
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-bold text-[11px]">
                        24 Hours (Full Day)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Duration Expiry:</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {formatRemainingTime(matchedBooking.expiresAt) || 'Expired'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Payment Status:</span>
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="uppercase">PAID VERIFIED</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Total Amount Paid:</span>
                  <span className="font-black text-sm text-gray-900">
                    {formatCurrency(matchedBooking.totalAmount)}
                  </span>
                </div>
                {matchedBooking.transactionId && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="font-mono text-gray-600">{matchedBooking.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Decision Actions */}
          <div className="p-4 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              {matchedBooking.approvalStatus === 'pending' ? (
                <span className="text-amber-800 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Please verify guest identity and click Approve to finalize confirmation and issue key.</span>
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reservation verified and approved. Key card active.</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {matchedBooking.approvalStatus === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(matchedBooking.bookingCode || matchedBooking.id)}
                    className="px-4 py-2 border border-red-300 hover:bg-red-50 text-red-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Reject Booking
                  </button>

                  <button
                    onClick={() => handleApprove(matchedBooking.bookingCode || matchedBooking.id)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Confirm Booking</span>
                  </button>
                </>
              )}

              {matchedBooking.approvalStatus === 'approved' && (
                <button
                  onClick={() => expireBookingNow(matchedBooking.bookingCode || matchedBooking.id)}
                  title="Simulate immediate stay expiration to verify live room availability auto-release"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Simulate Expiry Now (Test Auto-Release)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        inputCode.trim().length === 0 && (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 space-y-2">
            <QrCode className="w-8 h-8 mx-auto text-gray-300" />
            <h4 className="text-xs font-bold text-gray-600">Awaiting Booking Code Input</h4>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Type or paste any customer confirmation code above to automatically display guest details and approval controls.
            </p>
          </div>
        )
      )}
    </div>
  );
};
