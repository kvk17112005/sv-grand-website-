import React, { useState, useEffect } from 'react';
import { useHotel } from '../../context/HotelContext';
import { useAuth } from '../../context/useAuth';
import { Booking } from '../../types/hotel';
import {
  X,
  Luggage,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Printer,
  Coffee,
  RotateCcw,
  Sparkles,
  BedDouble,
  Clock,
  Send,
  Zap
} from 'lucide-react';

export const MyBookingsModal: React.FC = () => {
  const {
    isMyBookingsOpen,
    setIsMyBookingsOpen,
    bookings,
    cancelBooking,
    createGuestRequest,
    formatCurrency,
    hotel,
    setLatestConfirmedBooking,
    refreshBookingsFromBackend,
    isAutoUpdateEnabled,
    setIsAutoUpdateEnabled
  } = useHotel();

  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [requestBooking, setRequestBooking] = useState<Booking | null>(null);
  const [requestType, setRequestType] = useState<'room_cleaning' | 'extra_towels' | 'food_order' | 'late_checkout'>('room_cleaning');
  const [requestNotes, setRequestNotes] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh when modal is open
  useEffect(() => {
    if (isMyBookingsOpen) {
      refreshBookingsFromBackend();
    }
  }, [isMyBookingsOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshBookingsFromBackend();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!isMyBookingsOpen) return null;

  // Filter bookings to those matching the current logged-in user
  const userBookings = bookings.filter((b) => {
    if (!user) return true;
    const userEmail = (user.email || '').toLowerCase();
    const bEmail = (b.guestEmail || '').toLowerCase();
    const userPhone = (user.phone || '').replace(/[^0-9]/g, '');
    const bPhone = (b.guestPhone || '').replace(/[^0-9]/g, '');
    return (
      (userEmail && bEmail === userEmail) ||
      (userPhone && bPhone && bPhone === userPhone) ||
      b.guestId === user.id ||
      (user.name && b.guestName?.toLowerCase() === user.name?.toLowerCase())
    );
  });

  const displayBookings = userBookings.length > 0 ? userBookings : bookings;

  const filteredBookings = displayBookings.filter((b) => {
    if (activeTab === 'upcoming') {
      return (
        b.bookingStatus === 'confirmed' ||
        b.bookingStatus === 'checked_in' ||
        b.approvalStatus === 'pending' ||
        b.approvalStatus === 'approved'
      );
    }
    if (activeTab === 'completed') {
      return b.bookingStatus === 'checked_out';
    }
    return b.bookingStatus === 'cancelled';
  });

  const handleCancelClick = (b: Booking) => {
    if (window.confirm(`Are you sure you want to cancel booking ${b.id}? Full refund will be processed to original payment method.`)) {
      cancelBooking(b.id);
    }
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestBooking) return;

    const titles: Record<string, string> = {
      room_cleaning: 'Express Room Cleaning & Sanitization',
      extra_towels: 'Fresh Towels & Toiletries Kit',
      food_order: 'Food service request',
      late_checkout: 'Late Check-out Request'
    };

    createGuestRequest({
      bookingId: requestBooking.id,
      roomNumber: requestBooking.assignedRoomNumber || 'Front Desk',
      guestName: requestBooking.guestName,
      type: requestType,
      title: titles[requestType],
      notes: requestNotes
    });

    setRequestBooking(null);
    setRequestNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header with Live Auto-Update Badge */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 sticky top-0 z-10 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Luggage className="w-5 h-5 text-[#a67c32]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                My Hotel Bookings & Stays
              </h2>
              <p className="text-[11px] text-gray-500">
                {displayBookings.length} total reservations found
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-Time Auto-Update Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isAutoUpdateEnabled;
                setIsAutoUpdateEnabled(next);
                if (next) refreshBookingsFromBackend();
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isAutoUpdateEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
              title="Toggle automatic background updates every 4s without refreshing page"
            >
              <span className={`w-2 h-2 rounded-full ${isAutoUpdateEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>{isAutoUpdateEnabled ? 'Auto-Update: ON' : 'Auto-Update: OFF'}</span>
            </button>

            {/* Quick Refresh Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-200 text-gray-600 transition-colors"
              title="Refresh reservations now"
            >
              <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#a67c32]' : ''}`} />
            </button>

            <button
              onClick={() => setIsMyBookingsOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/40 px-4 sm:px-6">
          {[
            { id: 'upcoming', label: `Upcoming & In-House (${displayBookings.filter((b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in' || b.approvalStatus === 'pending' || b.approvalStatus === 'approved').length})` },
            { id: 'completed', label: `Completed (${displayBookings.filter((b) => b.bookingStatus === 'checked_out').length})` },
            { id: 'cancelled', label: `Cancelled (${displayBookings.filter((b) => b.bookingStatus === 'cancelled').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#a67c32] text-[#a67c32]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Luggage className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">No {activeTab} bookings found</p>
              <p className="text-xs text-gray-400 mt-1">
                Book a room at SV Grand Luxury Rooms to experience boutique comfort.
              </p>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                {/* Top Row: Ref ID + Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-[#a67c32] bg-amber-50 px-2 py-1 rounded-lg tracking-wider font-mono">
                      {b.bookingCode || b.id}
                    </span>
                    <span className="font-bold text-sm text-gray-900">{b.roomTypeName}</span>
                  </div>

                  <div>
                    {b.approvalStatus === 'approved' && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>✅ Approved & Confirmed</span>
                      </span>
                    )}
                    {b.approvalStatus === 'pending' && b.bookingStatus !== 'cancelled' && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        <span>⏳ Pending Front Desk Approval</span>
                      </span>
                    )}
                    {b.bookingStatus === 'checked_in' && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>🔑 Currently Checked-in</span>
                      </span>
                    )}
                    {b.bookingStatus === 'checked_out' && (
                      <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        Stay Completed
                      </span>
                    )}
                    {b.bookingStatus === 'cancelled' && (
                      <span className="text-[11px] font-bold text-red-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        Cancelled (Refund: {formatCurrency(b.refundAmount || 0)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Stay Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Dates</span>
                    <div className="font-semibold text-gray-800">
                      {b.checkInDate} &rarr; {b.checkOutDate}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Assigned Room</span>
                    <div className="font-semibold text-emerald-700">
                      {b.assignedRoomNumber ? `Room ${b.assignedRoomNumber}` : 'Front Desk Assignment'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Guest</span>
                    <div className="font-semibold text-gray-800">{b.guestName}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Total Fare</span>
                    <div className="font-extrabold text-gray-900">{formatCurrency(b.totalAmount)}</div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-gray-500">
                    Payment: <span className="font-semibold capitalize text-gray-800">{b.paymentStatus} ({b.paymentMethod.replace('_', ' ')})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Voucher */}
                    <button
                      onClick={() => setLatestConfirmedBooking(b)}
                      className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-gray-500" />
                      <span>Voucher</span>
                    </button>

                    {/* In-Room Service Request if checked-in or confirmed */}
                    {(b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in') && (
                      <button
                        onClick={() => setRequestBooking(b)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        <span>Room Service</span>
                      </button>
                    )}

                    {/* Cancel button if active */}
                    {(b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in') && (
                      <button
                        onClick={() => handleCancelClick(b)}
                        className="px-3 py-1.5 border border-amber-200 hover:bg-amber-50 text-red-600 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Stay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick In-Room Service Drawer/Modal */}
        {requestBooking && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#a67c32]" />
                <h4 className="font-bold text-xs sm:text-sm text-gray-900">
                  Request Service for {requestBooking.assignedRoomNumber ? `Room ${requestBooking.assignedRoomNumber}` : requestBooking.id}
                </h4>
              </div>
              <button
                onClick={() => setRequestBooking(null)}
                className="text-gray-400 hover:text-gray-700 text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleServiceSubmit} className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'room_cleaning', label: 'Room Cleaning' },
                  { id: 'extra_towels', label: 'Extra Towels' },
                  { id: 'food_order', label: 'Bistro Food' },
                  { id: 'late_checkout', label: 'Late Checkout' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setRequestType(st.id as any)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      requestType === st.id
                        ? 'bg-[#a67c32] text-white border-[#a67c32]'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Add special instructions for front desk / housekeeping..."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestBooking(null)}
                  className="px-3 py-1.5 border border-gray-300 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#a67c32] hover:bg-[#8e6826] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request to Front Desk</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
