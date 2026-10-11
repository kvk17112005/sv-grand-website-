import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { X, UserPlus, Calendar, CreditCard, Building, Check } from 'lucide-react';

interface WalkInBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferredRoomNumber?: string;
}

export const WalkInBookingModal: React.FC<WalkInBookingModalProps> = ({
  isOpen,
  onClose,
  preferredRoomNumber
}) => {
  const {
    roomTypes,
    physicalRooms,
    createBooking,
    checkInGuest,
    formatCurrency,
    showToast
  } = useHotel();

  const today = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(roomTypes[0]?.id || '');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(preferredRoomNumber || '');
  const [checkOutDate, setCheckOutDate] = useState(tomorrow);
  const [paymentCollected, setPaymentCollected] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'upi' | 'pay_at_hotel'>('upi');

  if (!isOpen) return null;

  // Filter available physical rooms matching selected room type
  const availableRoomsForType = physicalRooms.filter(
    (r) => r.roomTypeId === selectedRoomTypeId && r.status === 'available'
  );

  const selectedRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId) || roomTypes[0];
  const discountedRate = Math.round(
    selectedRoomType.basePrice * (1 - selectedRoomType.discountPercentage / 100)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      showToast('Please provide guest name and phone number');
      return;
    }

    const assigned = selectedRoomNumber || (availableRoomsForType[0]?.roomNumber ?? '101');

    const newBooking = createBooking({
      guestId: `g-walkin-${Date.now()}`,
      guestName,
      guestEmail: guestEmail || `${guestPhone.replace(/\D/g, '')}@guest.grandregalhotel.com`,
      guestPhone,
      roomTypeId: selectedRoomType.id,
      roomTypeName: selectedRoomType.name,
      assignedRoomNumber: assigned,
      checkInDate: today,
      checkOutDate: checkOutDate,
      nights: 1,
      roomsCount: 1,
      guestsCount: { adults: 2, children: 0 },
      baseAmount: discountedRate,
      discountAmount: 0,
      addOns: [],
      taxAmount: Math.round(discountedRate * 0.12),
      totalAmount: Math.round(discountedRate * 1.12),
      paymentMethod,
      paymentStatus: paymentCollected ? 'paid' : 'pending',
      bookingStatus: 'checked_in',
      specialRequests: 'Front desk direct walk-in'
    });

    checkInGuest(newBooking.id, assigned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200">
        <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-gray-900">Front Desk Walk-in Check-in</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Guest Full Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Alok Verma"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+91 98110 99887"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="guest@gmail.com"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Room Category
              </label>
              <select
                value={selectedRoomTypeId}
                onChange={(e) => {
                  setSelectedRoomTypeId(e.target.value);
                  setSelectedRoomNumber('');
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Assign Room Number
              </label>
              <select
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
              >
                <option value="">Auto Assign ({availableRoomsForType.length} Available)</option>
                {availableRoomsForType.map((r) => (
                  <option key={r.roomNumber} value={r.roomNumber}>
                    Room {r.roomNumber} (Floor {r.floor})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Check-in Date
              </label>
              <input
                type="text"
                value={today}
                readOnly
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Check-out Date
              </label>
              <input
                type="date"
                min={today}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">Room Rate (incl. 12% GST):</span>
              <span className="font-bold text-gray-900 text-sm">
                {formatCurrency(Math.round(discountedRate * 1.12))}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentCollected}
                  onChange={(e) => setPaymentCollected(e.target.checked)}
                  className="rounded text-[#a67c32] focus:ring-[#a67c32]"
                />
                <span>Payment Collected at Counter</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Assign Key & Check In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
