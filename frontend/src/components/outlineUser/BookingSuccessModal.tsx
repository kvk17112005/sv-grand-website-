import React, { useCallback, useEffect, useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { isPaymentSettled, getPaymentStatusLabel } from '../../types/hotel';
import { apiRequest } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock3,
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
    formatCurrency,
  } = useHotel();
  const [paymentMessage, setPaymentMessage] = useState('');
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  const booking = latestConfirmedBooking;
  const paymentIntent = booking?.paymentIntent;
  const isConfirmed = booking?.bookingStatus === 'confirmed';
  const paymentStatus = paymentIntent?.status || booking?.paymentStatus;

  useEffect(() => {
    if (latestConfirmedBooking?.bookingStatus === 'confirmed') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [latestConfirmedBooking?.id, latestConfirmedBooking?.bookingStatus]);

  const refreshPayment = useCallback(async () => {
    if (!paymentIntent?.paymentId) return;
    setIsCheckingPayment(true);
    try {
      const result = await apiRequest(`/api/payments/${encodeURIComponent(paymentIntent.paymentId)}`);
      setLatestConfirmedBooking((current: any) =>
        current
          ? {
              ...current,
              bookingStatus: result.booking.bookingStatus,
              status: result.booking.status,
              paymentStatus: result.booking.paymentStatus,
              paymentIntent: {
                ...paymentIntent,
                status: result.payment.status,
                transactionReference: result.payment.transactionReference
              }
            }
          : current
      );
      setPaymentMessage('');
    } catch (error: any) {
      setPaymentMessage(error?.message || 'Payment status could not be refreshed; it remains unverified.');
    } finally {
      setIsCheckingPayment(false);
    }
  }, [paymentIntent, setLatestConfirmedBooking]);

  const retryPayment = async () => {
    if (!booking?.id) return;
    setIsStartingPayment(true);
    setPaymentMessage('');
    try {
      const result = await apiRequest(
        `/api/bookings/${encodeURIComponent(booking.id)}/payment-intent`,
        { method: 'POST', body: JSON.stringify({}) }
      );
      setLatestConfirmedBooking((current: any) =>
        current
          ? {
              ...current,
              bookingStatus: result.booking.bookingStatus,
              status: result.booking.status,
              paymentStatus: result.booking.paymentStatus,
              paymentIntent: result.intent
            }
          : current
      );
    } catch (error: any) {
      setPaymentMessage(error?.message || 'Could not prepare a payment request. Please retry.');
    } finally {
      setIsStartingPayment(false);
    }
  };

  useEffect(() => {
    if (!paymentIntent?.paymentId || paymentIntent.status !== 'pending') return undefined;
    const interval = window.setInterval(refreshPayment, 5000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshPayment();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', refreshPayment);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', refreshPayment);
    };
  }, [paymentIntent?.paymentId, paymentIntent?.status, refreshPayment]);

  if (!booking) return null;
  const b = booking;
  const canRetry = ['failed', 'cancelled'].includes(String(paymentStatus).toLowerCase());

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
            {isConfirmed ? <CheckCircle2 className="w-7 h-7" /> : <Clock3 className="w-7 h-7" />}
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            {isConfirmed ? 'Booking Confirmed!' : 'Booking Request Received'}
          </h2>
          <p className="text-xs text-red-100 mt-0.5">
            {isConfirmed
              ? `Your payment is verified and your stay at ${hotel.name} is confirmed.`
              : isPaymentSettled(paymentStatus)
                ? `Payment is verified; your stay at ${hotel.name} is awaiting final room confirmation.`
                : `Your stay at ${hotel.name} is not confirmed until payment is verified.`}
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
                  {isConfirmed ? 'Booking ID' : 'Booking Reference'}
                </div>
                <div className="text-xl font-black text-gray-900 tracking-wider font-mono">
                  {b.bookingCode || b.id}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                  {isConfirmed ? 'Confirmed' : 'Pending payment verification'}
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
                  {isConfirmed ? 'Reservation confirmed' : 'Payment verification pending'}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Room Number</span>
                <div className="font-bold text-emerald-700">
                  {b.assignedRoomNumber ? `Room ${b.assignedRoomNumber}` : 'Assigned at Front Desk'}
                </div>
                <div className="text-[10px] text-gray-400">
                  {isConfirmed ? 'Confirmed booking' : 'Not confirmed yet'}
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
                {paymentIntent?.transactionReference && (
                  <div className="text-[10px] text-gray-500 break-all">
                    Transaction reference: {paymentIntent.transactionReference}
                  </div>
                )}
              </div>
            </div>

            {b.paymentMethod === 'upi' && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3 no-print">
                <div>
                  <div className="font-bold text-gray-900">UPI payment</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {paymentStatus
                      ? getPaymentStatusLabel(paymentStatus)
                      : 'Preparing secure payment request…'}
                    {' · '}
                    {isConfirmed
                      ? 'Booking confirmation is complete.'
                      : isPaymentSettled(paymentStatus)
                        ? 'Payment is verified; booking confirmation is still pending.'
                        : 'Booking remains unconfirmed until trusted verification reaches our server.'}
                  </p>
                </div>
                {paymentIntent?.upiUri && !isPaymentSettled(paymentStatus) && !canRetry && (
                  <a
                    href={paymentIntent.upiUri}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#a67c32] hover:bg-[#8e6826] px-5 py-3 text-white font-bold text-sm shadow-md transition-colors"
                  >
                    Pay {formatCurrency(paymentIntent.amount)} Now
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
                {(!paymentIntent || canRetry) && !isPaymentSettled(paymentStatus) && (
                  <button
                    type="button"
                    onClick={retryPayment}
                    disabled={isStartingPayment}
                    className="w-full sm:w-auto rounded-xl bg-[#a67c32] hover:bg-[#8e6826] disabled:bg-gray-400 px-5 py-3 text-white font-bold text-sm shadow-md transition-colors"
                  >
                    {isStartingPayment ? 'Preparing…' : 'Retry Payment'}
                  </button>
                )}
                {paymentIntent?.paymentId && (
                  <button
                    type="button"
                    onClick={refreshPayment}
                    disabled={isCheckingPayment}
                    className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 font-semibold text-sm"
                  >
                    {isCheckingPayment ? 'Checking…' : 'Check payment status'}
                  </button>
                )}
                <p className="text-[11px] text-gray-600">
                  A compatible mobile browser may open an installed UPI app. After paying, return
                  to this browser tab; payment status refreshes automatically when you return.
                  App launching and return behavior vary by device. On desktop, use a phone with
                  a UPI app or choose Pay at Hotel during checkout. Payment remains pending until
                  verified by the server.
                </p>
                {paymentMessage && <p role="alert" className="text-xs text-red-700">{paymentMessage}</p>}
              </div>
            )}

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
