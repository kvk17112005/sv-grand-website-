import React, { useState, useEffect } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Booking, BookingStatus, isPaymentSettled, getPaymentStatusLabel } from '../../types/hotel';
import {
  Search,
  Filter,
  CheckCircle2,
  LogOut,
  LogIn,
  RotateCcw,
  Printer,
  CreditCard,
  User,
  Calendar,
  BedDouble,
  XCircle,
  Phone
} from 'lucide-react';

export const BookingsManager: React.FC = () => {
  const {
    bookings,
    checkInGuest,
    checkOutGuest,
    cancelBooking,
    physicalRooms,
    formatCurrency,
    setLatestConfirmedBooking,
    updateBookingPaymentStatus,
    refreshBookingsFromBackend,
    isAutoUpdateEnabled
  } = useHotel();

  useEffect(() => {
    refreshBookingsFromBackend();
    if (!isAutoUpdateEnabled) return;
    const interval = setInterval(() => {
      refreshBookingsFromBackend();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoUpdateEnabled, refreshBookingsFromBackend]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.bookingStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        b.id.toLowerCase().includes(q) ||
        (b.bookingCode && b.bookingCode.toLowerCase().includes(q)) ||
        b.guestName.toLowerCase().includes(q) ||
        (b.guestPhone && b.guestPhone.includes(q)) ||
        (b.guestEmail && b.guestEmail.toLowerCase().includes(q)) ||
        (b.assignedRoomNumber && b.assignedRoomNumber.includes(q))
      );
    }
    return true;
  });

  const handleOpenCheckInModal = (b: Booking) => {
    setAssigningBooking(b);
    // Find first available matching room
    const avail = physicalRooms.find(
      (r) => r.roomTypeId === b.roomTypeId && r.status === 'available'
    );
    setSelectedRoomNumber(b.assignedRoomNumber || avail?.roomNumber || '101');
  };

  const handleConfirmCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningBooking || !selectedRoomNumber) return;
    checkInGuest(assigningBooking.id, selectedRoomNumber);
    setAssigningBooking(null);
  };

  const availableRoomsForModal = physicalRooms.filter(
    (r) =>
      r.status === 'available' ||
      (assigningBooking && r.roomNumber === assigningBooking.assignedRoomNumber)
  );

  return (
    <div className="space-y-4">
      {/* Search and Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Guest, Booking ID, Phone..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
          {(['all', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st === 'checked_in' ? 'In-House' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Booking / Guest</th>
                <th className="p-3.5">Dates & Stay</th>
                <th className="p-3.5">Room & Type</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No reservations matching current filter.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Booking / Guest */}
                    <td className="p-3.5">
                      <div className="font-extrabold text-gray-900">{b.guestName}</div>
                      <div className="text-[11px] text-gray-500">{b.guestPhone}</div>
                      <div className="font-mono text-[10px] text-[#a67c32] font-bold mt-0.5">
                        {b.id}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="p-3.5">
                      <div className="font-bold text-gray-800">
                        {b.checkInDate} &rarr; {b.checkOutDate}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {b.nights} {b.nights === 1 ? 'Night' : 'Nights'} &bull; {b.roomsCount} Room
                      </div>
                    </td>

                    {/* Room */}
                    <td className="p-3.5">
                      <div className="font-bold text-gray-900 truncate max-w-[150px]">
                        {b.roomTypeName.replace('Townhouse ', '')}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700">
                        {b.assignedRoomNumber ? `Room ${b.assignedRoomNumber}` : 'Unassigned'}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="p-3.5">
                      <div className="font-black text-gray-900">{formatCurrency(b.totalAmount)}</div>
                      <div className="flex items-center gap-1 text-[10px] mt-0.5">
                        {isPaymentSettled(b.paymentStatus) ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            {getPaymentStatusLabel(b.paymentStatus)}
                          </span>
                        ) : (
                          <button
                            onClick={() => updateBookingPaymentStatus(b.id, 'paid')}
                            className="text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            {getPaymentStatusLabel(b.paymentStatus)} &middot; Collect Cash/Card
                          </button>
                        )}
                        <span className="text-gray-400 capitalize">({b.paymentMethod.replace('_', ' ')})</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      {b.bookingStatus === 'confirmed' && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          Confirmed
                        </span>
                      )}
                      {b.bookingStatus === 'checked_in' && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>In-House</span>
                        </span>
                      )}
                      {b.bookingStatus === 'checked_out' && (
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                          Checked-out
                        </span>
                      )}
                      {b.bookingStatus === 'cancelled' && (
                        <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          Cancelled
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Check-In Action */}
                        {b.bookingStatus === 'confirmed' && (
                          <button
                            onClick={() => handleOpenCheckInModal(b)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 text-[11px] shadow-xs cursor-pointer"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Check-in</span>
                          </button>
                        )}

                        {/* Check-Out Action */}
                        {b.bookingStatus === 'checked_in' && (
                          <button
                            onClick={() => checkOutGuest(b.id)}
                            className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white font-bold rounded-lg flex items-center gap-1 text-[11px] shadow-xs cursor-pointer"
                          >
                            <LogOut className="w-3 h-3 text-red-400" />
                            <span>Check-out</span>
                          </button>
                        )}

                        {/* Voucher Button */}
                        <button
                          onClick={() => setLatestConfirmedBooking(b)}
                          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer"
                          title="Print Voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel Button */}
                        {(b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked_in') && (
                          <button
                            onClick={() => {
                              if (confirm(`Cancel booking ${b.id}?`)) {
                                cancelBooking(b.id);
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-In Modal with Room Allocation */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#a67c32]">
                  Key Issuance
                </span>
                <h3 className="font-bold text-base text-gray-900">
                  Check-in Guest: {assigningBooking.guestName}
                </h3>
              </div>
              <button
                onClick={() => setAssigningBooking(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmCheckIn} className="p-4 sm:p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                <div>
                  <span className="font-semibold text-gray-600">Room Category:</span>{' '}
                  <span className="font-bold text-gray-900">{assigningBooking.roomTypeName}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Booking Ref:</span>{' '}
                  <span className="font-mono font-bold text-[#a67c32]">{assigningBooking.id}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Payment:</span>{' '}
                  <span className="font-bold text-gray-900">
                    {formatCurrency(assigningBooking.totalAmount)} ({assigningBooking.paymentStatus})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Assign Room Key Card
                </label>
                <select
                  value={selectedRoomNumber}
                  onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#a67c32]"
                  required
                >
                  {availableRoomsForModal.map((r) => (
                    <option key={r.roomNumber} value={r.roomNumber}>
                      Room {r.roomNumber} &bull; Floor {r.floor} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningBooking(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Confirm & Hand Over Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
