import React, { useEffect } from 'react';
import { useHotel } from '../../context/HotelContext';
import { isPaymentSettled, getPaymentStatusLabel } from '../../types/hotel';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  X,
  Printer,
  Calendar,
  MapPin,
  QrCode,
  ShieldCheck,
  Luggage,
  Sparkles,
  Phone,
  ArrowRight
} from 'lucide-react';

export const BookingSuccessModal: React.FC = () => {
  const {
    latestConfirmedBooking,
    setLatestConfirmedBooking,
    setIsMyBookingsOpen,
    hotel,
    formatCurrency
  } = useHotel();

  useEffect(() => {
    if (latestConfirmedBooking) {
      // Trigger festive celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [latestConfirmedBooking]);

  if (!latestConfirmedBooking) return null;
  const b = latestConfirmedBooking;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[92vh] up-banner">
        {/* Top Celebration Bar */}
        <div className="bg-gradient-to-r from-[#a67c32] to-[#7c5a1e] text-white p-5 text-center relative no-print">
          <button
            onClick={() => setLatestConfirmedBooking(null)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-md up-glow">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Booking Confirmed!</h2>
          <p className="text-xs text-red-100 mt-0.5">
            Your stay at {hotel.name} is guaranteed. Confirmation SMS & Email sent.
          </p>
        </div>

        {/* Printable Booking Voucher Body */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-6 print-container">
          {/* Official Voucher Card with Perforated Look */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-5 sm:p-6 bg-gray-50/50 relative">
            {/* Voucher Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#a67c32] text-white font-black text-sm px-2 py-0.5 rounded-lg shadow-xs">
                    SV
                  </span>
                  <span className="font-bold text-sm text-gray-900">{hotel.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#a67c32]" />
                  <span>{hotel.address}, {hotel.city}</span>
                </p>
              </div>

              {/* Booking Confirmation Code */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border-2 border-[#a67c32] sm:text-right">
                <div className="text-[10px] uppercase font-black text-[#a67c32] tracking-wider">
                  Booking Confirmation Code
                </div>
                <div className="text-xl font-black text-gray-900 tracking-wider font-mono">
                  {b.bookingCode || b.id}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                  {b.approvalStatus === 'approved' ? '✅ Admin Approved' : '⏳ Awaiting Front Desk Verification'}
                </div>
              </div>
            </div>

            {/* Stay Dates & Room Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-gray-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Check-in</span>
                <div className="font-bold text-gray-900">{b.checkInDate}</div>
                <div className="text-[11px] text-gray-500">From 12:00 PM</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Check-out</span>
                <div className="font-bold text-gray-900">{b.checkOutDate}</div>
                <div className="text-[11px] text-gray-500">Till 11:00 AM</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Room & Duration</span>
                <div className="font-bold text-gray-900 truncate">{b.roomTypeName}</div>
                <div className="text-[11px] font-semibold text-[#a67c32]">
                  Reservation confirmed
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Room Number</span>
                <div className="font-bold text-emerald-700">
                  {b.assignedRoomNumber ? `Room ${b.assignedRoomNumber}` : 'Assigned at Front Desk'}
                </div>
                <div className="text-[10px] text-gray-400">
                  {b.approvalStatus === 'approved' ? 'Key card active' : 'Awaiting admin approval'}
                </div>
              </div>
            </div>

            {/* Guest & Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-gray-900">Guest Details:</div>
                <div className="text-gray-700 font-semibold">{b.guestName}</div>
                <div className="text-gray-500">{b.guestEmail} &bull; {b.guestPhone}</div>
                {b.specialRequests && (
                  <div className="text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-200 mt-2">
                    <span className="font-bold">Request:</span> {b.specialRequests}
                  </div>
                )}
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1 sm:text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Total Amount</div>
                <div className="text-xl font-black text-gray-900">{formatCurrency(b.totalAmount)}</div>
                <div className={`text-[11px] font-semibold ${isPaymentSettled(b.paymentStatus) ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Status: {isPaymentSettled(b.paymentStatus) ? 'Paid in Full' : getPaymentStatusLabel(b.paymentStatus)}
                </div>
                <div className="text-[10px] text-gray-400 capitalize">
                  Via {b.paymentMethod.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Front Desk Helpline & QR Code check-in */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-[#a67c32]" />
                <span>Front Desk 24/7 Helpline: </span>
                <span className="font-bold text-gray-900">{hotel.phone}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct Official Booking Voucher</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>Print / Save Voucher</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setLatestConfirmedBooking(null);
                setIsMyBookingsOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer up-btn"
            >
              <Luggage className="w-4 h-4 text-[#a67c32]" />
              <span>Go to My Bookings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
