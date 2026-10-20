import React, { useState, useEffect, useRef } from 'react';
import { useHotel } from '../../context/HotelContext';
import { useAuth } from '../../context/useAuth';
import { apiRequest } from '../../services/api';
import { PaymentMethod, calculateStayPricing } from '../../types/hotel';
import { createIdempotencyKey } from '../../services/idempotency';
import {
  X,
  BedDouble,
  ShieldCheck,
  Tag,
  Check,
  QrCode,
  Building,
  ArrowRight,
  Wind,
  Fan
} from 'lucide-react';

function getBackendRoomName(name: string, isAC: boolean) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('single')) return isAC ? 'AC Single Room' : 'Non-AC Single Room';
  if (lowerName.includes('double')) return isAC ? 'AC Double Room' : 'Non-AC Double Room';
  return isAC ? 'Deluxe AC Room' : 'Standard Non-AC Room';
}

export const BookingCheckoutModal: React.FC = () => {
  const {
    selectedRoomForBooking,
    setSelectedRoomForBooking,
    searchState,
    nightsCount,
    offers,
    addOns,
    formatCurrency,
    registerExternalBooking,
    setLatestConfirmedBooking,
    currentUser,
    showToast,
    selectedRoomNumberForBooking,
    setSelectedRoomNumberForBooking,
    physicalRooms
  } = useHotel();

  const { user } = useAuth();

  // Form State
  const [guestName, setGuestName] = useState(user?.name || user?.fullName || currentUser?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || currentUser?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || currentUser?.phone || '');

  useEffect(() => {
    if (user) {
      if (user.name || user.fullName) setGuestName(user.name || user.fullName);
      if (user.email) setGuestEmail(user.email);
      if (user.phone) setGuestPhone(user.phone);
    }
  }, [user]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverQuote, setServerQuote] = useState<any>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const idempotencyKeyRef = useRef(createIdempotencyKey());

  const selectedAddOnCodes = addOns
    .filter((addon) => selectedAddOns.includes(addon.id))
    .map((addon) => addon.code)
    .filter((code): code is string => Boolean(code));
  const selectedAddOnKey = selectedAddOnCodes.join(',');
  const selectedCouponCode = appliedCoupon?.code || '';

  useEffect(() => {
    if (!selectedRoomForBooking) {
      setServerQuote(null);
      return;
    }
    let cancelled = false;
    const roomName = getBackendRoomName(
      selectedRoomForBooking.name,
      Boolean(selectedRoomForBooking.isAC)
    );
    const requestBody = {
      roomName,
      checkIn: searchState.checkInDate,
      checkOut: searchState.checkOutDate,
      adults: Math.max(1, searchState.adults),
      roomsCount: Math.max(1, searchState.roomsCount),
      children13Plus: 0,
      childrenBelow13: searchState.children,
      addOnCodes: selectedAddOnKey ? selectedAddOnKey.split(',') : [],
      couponCode: selectedCouponCode || undefined
    };

    setServerQuote(null);
    setQuoteError('');
    setIsQuoting(true);
    const timer = window.setTimeout(() => {
      apiRequest('/api/bookings/quote', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
        .then((result) => {
          if (!cancelled) setServerQuote(result?.quote || null);
        })
        .catch((error: any) => {
          if (!cancelled) setQuoteError(error?.message || 'Could not verify the booking total.');
        })
        .finally(() => {
          if (!cancelled) setIsQuoting(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    selectedRoomForBooking?.id,
    selectedRoomForBooking?.name,
    selectedRoomForBooking?.isAC,
    searchState.checkInDate,
    searchState.checkOutDate,
    searchState.adults,
    searchState.children,
    searchState.roomsCount,
    selectedAddOnKey,
    selectedCouponCode
  ]);

  // Available rooms for this category
  const availableRoomsForType = selectedRoomForBooking
    ? physicalRooms.filter((r) => r.roomTypeId === selectedRoomForBooking.id && r.status === 'available')
    : [];

  const [pickedRoomNumber, setPickedRoomNumber] = useState<string>(
    selectedRoomNumberForBooking || availableRoomsForType[0]?.roomNumber || ''
  );

  if (!selectedRoomForBooking) return null;
  const room = selectedRoomForBooking;

  // User bookings use the standard 24-hour room tariff.
  const pricing = calculateStayPricing(
    room,
    '24h',
    nightsCount,
    searchState.roomsCount
  );

  const chosenAddOnsList = addOns.filter((a) => selectedAddOns.includes(a.id));
  const handleToggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCodeInput.trim().toUpperCase();
    const found = offers.find((o) => o.code.toUpperCase() === clean && o.active);
    if (found) {
      setAppliedCoupon(found);
      showToast(`Coupon ${found.code} applied! Saved extra.`);
    } else {
      showToast('Invalid or expired coupon code');
    }
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      showToast('Please fill in all guest details');
      return;
    }

    if (!serverQuote) {
      showToast(quoteError || 'Please wait for the backend to verify the total.');
      return;
    }

    const backendRoomName = getBackendRoomName(room.name, pricing.isAC);
    setIsProcessing(true);
    try {
      // The backend is the source of truth: it validates availability, prices
      // the stay, holds inventory, and returns the canonical booking + reference.
      const result = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          roomName: backendRoomName,
          idempotencyKey: idempotencyKeyRef.current,
          name: guestName.trim(),
          phone: guestPhone.replace(/[^0-9+]/g, ''),
          email: guestEmail.trim().toLowerCase(),
          checkIn: searchState.checkInDate,
          checkOut: searchState.checkOutDate,
          adults: Math.max(1, searchState.adults),
          roomsCount: Math.max(1, searchState.roomsCount),
          children13Plus: 0,
          childrenBelow13: searchState.children,
          totalGuests: Math.max(1, searchState.adults + searchState.children),
          paymentMethod,
          addOnCodes: selectedAddOnCodes,
          couponCode: appliedCoupon?.code,
          specialRequests: specialRequests.trim() || undefined
        })
      });

      if (!result?.booking) {
        throw new Error('The booking service returned an invalid response.');
      }

      const registered = registerExternalBooking(result.booking);
      setLatestConfirmedBooking(registered);
      setSelectedRoomForBooking(null);
      idempotencyKeyRef.current = createIdempotencyKey();
      if (paymentMethod === 'upi') {
        try {
          const payment = await apiRequest(
            `/api/bookings/${encodeURIComponent(result.booking.id)}/payment-intent`,
            { method: 'POST', body: JSON.stringify({}) }
          );
          if (!payment?.intent || !payment?.booking) {
            throw new Error('The payment service returned an invalid response.');
          }
          const updated = registerExternalBooking(payment.booking);
          setLatestConfirmedBooking({ ...updated, paymentIntent: payment.intent });
        } catch (paymentError: any) {
          setLatestConfirmedBooking({
            ...registered,
            paymentIntent: null,
            paymentError: paymentError?.message || 'Payment setup is temporarily unavailable.'
          });
          showToast('Booking request saved. Payment setup failed; retry from the booking status window.');
        }
      }
      showToast(`🎉 Booking ${registered.bookingCode} received!`);
    } catch (error: any) {
      showToast(`❌ ${error?.message || 'Could not create the booking. Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[92vh] up-banner">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-[#a67c32] text-white font-black text-sm px-2 py-0.5 rounded-lg shadow-xs">
              SV
            </span>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Confirm Stay Reservation
            </h2>
          </div>
          <button
            onClick={() => setSelectedRoomForBooking(null)}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (2 Columns on Desktop) */}
        <div className="overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & Options */}
          <div className="lg:col-span-7 space-y-6">
            {/* Stay & Room Summary Box */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-white bg-gray-900 px-2 py-0.5 rounded uppercase tracking-wider">
                      {room.bedroomType === 'double' ? 'Double Bedroom' : 'Single Bedroom'}
                    </span>
                    {pricing.isAC ? (
                      <span className="text-[10px] font-bold text-white bg-cyan-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <Wind className="w-3 h-3" />
                        <span>AC Room</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-white bg-amber-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <Fan className="w-3 h-3" />
                        <span>Non-AC</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">{room.name}</h3>
                  <p className="text-xs text-gray-500">SV Grand Luxury Rooms &bull; Tadipatri, AP</p>
                </div>
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                  <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Room Number Picker */}
              <div className="p-3 rounded-xl bg-white border border-gray-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-gray-500" />
                    <span>Select Specific Room Number (RedBus-Style):</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {availableRoomsForType.length} available
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {availableRoomsForType.map((r) => (
                    <button
                      key={r.roomNumber}
                      type="button"
                      onClick={() => {
                        setPickedRoomNumber(r.roomNumber);
                        setSelectedRoomNumberForBooking(r.roomNumber);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        pickedRoomNumber === r.roomNumber
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <span>Room #{r.roomNumber}</span>
                      {pickedRoomNumber === r.roomNumber && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Check-in</span>
                  <div className="font-bold text-gray-900">{searchState.checkInDate}</div>
                  <div className="text-[10px] text-gray-500">From 12:00 PM</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Check-out</span>
                  <div className="font-bold text-gray-900">{searchState.checkOutDate}</div>
                  <div className="text-[10px] text-gray-500">Till 11:00 AM</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Duration</span>
                  <div className="font-bold text-gray-900">
                    {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {searchState.adults} Adults, {searchState.roomsCount} Room
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Personal Details Form */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Guest Information (Primary Occupant)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Legal Name (as per Govt Photo ID)
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email for Booking Voucher
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Phone (For Check-in SMS)
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Special Stay Requests (Optional)
                  </label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Quiet room, extra pillows, late check-in at 8 PM..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
                  />
                </div>
              </div>
            </div>

            {/* Popular Add-On Services */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Enhance Your Stay (Recommended Add-ons)
              </h4>
              <div className="space-y-2">
                {addOns.map((addon) => {
                  const isChecked = selectedAddOns.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => handleToggleAddOn(addon.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-50/50 border-[#a67c32]'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 ${
                            isChecked
                              ? 'bg-[#a67c32] border-[#a67c32] text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-gray-900">{addon.name}</div>
                          <div className="text-[11px] text-gray-500">{addon.description}</div>
                        </div>
                      </div>
                      <div className="text-xs font-extrabold text-gray-900 shrink-0 ml-2">
                        +{formatCurrency(addon.price)}
                        {addon.perNight && <span className="text-[10px] text-gray-500 font-normal"> /night</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Choose Payment Option
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'upi',
                    label: 'UPI (GPay / PhonePe / Paytm)',
                    desc: 'Pay directly in a compatible UPI app. Confirmation waits for verified payment.',
                    icon: <QrCode className="w-4 h-4 text-[#a67c32]" />
                  },
                  {
                    id: 'pay_at_hotel',
                    label: 'Pay at Hotel',
                    desc: 'Pay cash or card upon check-in',
                    icon: <Building className="w-4 h-4 text-emerald-600" />
                  }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === pm.id
                        ? 'bg-amber-50/60 border-[#a67c32] ring-1 ring-[#a67c32]'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-gray-100 shrink-0 mt-0.5">{pm.icon}</div>
                    <div>
                      <div className="font-bold text-xs text-gray-900">{pm.label}</div>
                      <div className="text-[11px] text-gray-500">{pm.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Price Summary & Coupon Box */}
          <div className="lg:col-span-5 space-y-4">
            {/* Coupon Application Box */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-2">
                <Tag className="w-4 h-4 text-[#a67c32]" />
                <span>Apply Coupon or Voucher Code</span>
              </div>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  placeholder="e.g. WELCOME50"
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-[#a67c32]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold">{appliedCoupon.code} Applied</span>
                  </div>
                  <span className="font-extrabold">
                    {serverQuote ? `- ${formatCurrency(serverQuote.discountAmount)}` : 'Verifying…'}
                  </span>
                </div>
              )}
              {appliedCoupon && serverQuote && !serverQuote.couponEligible && (
                <div className="mt-2 text-[11px] text-red-700" role="alert">
                  This coupon does not apply to the server-verified booking total.
                </div>
              )}
            </div>

            {/* Itemized Price Summary */}
            <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                Fare Breakdown
              </h4>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-gray-700">
                    <span>24-Hour Base Tariff:</span>
                    <span className="font-semibold text-gray-900">
                      {serverQuote ? formatCurrency(serverQuote.twentyFourHourRate) : 'Verifying…'}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Stay Duration:</span>
                    <span className="font-semibold text-gray-900">24 Hours Stay</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Effective Rate per Room:</span>
                    <span>
                      {serverQuote ? formatCurrency(serverQuote.effectiveRate) : 'Verifying…'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span>
                    Room Base Total ({nightsCount} nights &bull; {searchState.roomsCount} room)
                  </span>
                  <span className="font-semibold text-gray-900">
                    {serverQuote ? formatCurrency(serverQuote.roomTotal) : 'Verifying…'}
                  </span>
                </div>

                {(serverQuote?.addOnsTotal || 0) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Selected Add-ons ({chosenAddOnsList.length})</span>
                  <span className="font-semibold text-gray-900">
                    +{formatCurrency(serverQuote.addOnsTotal)}
                  </span>
                </div>
                )}

                {(serverQuote?.extraGuestTotal || 0) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Additional guest charge</span>
                  <span className="font-semibold text-gray-900">
                    +{formatCurrency(serverQuote.extraGuestTotal)}
                  </span>
                </div>
                )}

                {(serverQuote?.taxAmount || 0) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Taxes</span>
                    <span className="font-semibold text-gray-900">
                      +{formatCurrency(serverQuote.taxAmount)}
                    </span>
                  </div>
                )}

                {(serverQuote?.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-{formatCurrency(serverQuote.discountAmount)}</span>
                </div>
                )}

              </div>

              {/* Total Row */}
              <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Total Payable</div>
                  <div className="text-2xl font-black text-gray-900">
                    {serverQuote ? formatCurrency(serverQuote.grandTotal) : 'Verifying…'}
                  </div>
                </div>

                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-bold">
                  {isQuoting ? 'Verifying price…' : quoteError ? 'Price unavailable' : 'Backend verified'}
                </span>
              </div>
              {quoteError && (
                <p className="text-xs text-red-700" role="alert">{quoteError}</p>
              )}

              {/* Free Cancellation Note */}
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Free cancellation up to 24 hours prior to check-in.</span>
              </div>

              {/* Submit CTA */}
              <button
                onClick={handleConfirmReservation}
                disabled={isProcessing || isQuoting || !serverQuote || Boolean(quoteError)}
                className="w-full py-3.5 bg-[#a67c32] hover:bg-[#8e6826] disabled:bg-gray-400 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2 up-btn"
              >
                {isProcessing ? (
                  <span>Securing your room...</span>
                ) : (
                  <>
                    <span>
                      {paymentMethod === 'upi' && serverQuote
                        ? `Continue · ${formatCurrency(serverQuote.grandTotal)}`
                        : 'Confirm & Book Stay'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
