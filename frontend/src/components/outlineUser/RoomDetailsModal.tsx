import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { calculateStayPricing } from '../../types/hotel';
import {
  X,
  Maximize2,
  BedDouble,
  Users,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
  Wind,
  Fan
} from 'lucide-react';

export const RoomDetailsModal: React.FC = () => {
  const {
    selectedRoomForDetails,
    setSelectedRoomForDetails,
    setSelectedRoomForBooking,
    formatCurrency,
    nightsCount,
    searchState
  } = useHotel();

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!selectedRoomForDetails) return null;
  const room = selectedRoomForDetails;

  const pricing = calculateStayPricing(
    room,
    '24h',
    nightsCount,
    searchState.roomsCount
  );
  const nightlyRate = pricing.effectiveStayRate;
  const totalCost = pricing.totalBaseRoomCost;

  const handleBookFromDetails = () => {
    setSelectedRoomForDetails(null);
    setSelectedRoomForBooking(room);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] up-banner">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-gray-900 px-2 py-0.5 rounded">
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
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{room.name}</h2>
            <p className="text-xs text-gray-500">SV Grand Luxury Rooms &bull; Tadipatri, AP</p>
          </div>
          <button
            onClick={() => setSelectedRoomForDetails(null)}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Photo Gallery */}
          <div className="space-y-2">
            <div className="h-64 sm:h-80 rounded-xl overflow-hidden bg-gray-900 shadow-xs">
              <img
                src={room.images[activePhotoIdx]}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {room.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    activePhotoIdx === idx
                      ? 'border-[#a67c32] scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-white shadow-xs text-gray-700">
                <Maximize2 className="w-4 h-4 text-[#a67c32]" />
              </div>
              <div>
                <div className="text-gray-400 font-semibold text-[10px]">Room Size</div>
                <div className="font-bold text-gray-900">{room.sizeSqFt} sq ft</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-white shadow-xs text-gray-700">
                <BedDouble className="w-4 h-4 text-[#a67c32]" />
              </div>
              <div>
                <div className="text-gray-400 font-semibold text-[10px]">Bedding</div>
                <div className="font-bold text-gray-900">{room.bedType}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-white shadow-xs text-gray-700">
                <Users className="w-4 h-4 text-[#a67c32]" />
              </div>
              <div>
                <div className="text-gray-400 font-semibold text-[10px]">Max Capacity</div>
                <div className="font-bold text-gray-900">{room.maxGuests} Guests</div>
              </div>
            </div>
          </div>

          {/* Room Description */}
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
              About This Room
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{room.description}</p>
          </div>

          {/* Complete Amenities List */}
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              All Room Features & Inclusions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {room.amenities.map((amenity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-gray-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policies & Perks */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Booking Guarantees</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-emerald-800 text-[11px]">
              <li>100% full refund if cancelled up to 24 hours prior to check-in.</li>
              <li>Free high-speed 5G Wi-Fi with unlimited device connections.</li>
              <li>Sanitized linen and thermal disinfected bathroom seal.</li>
              <li>Local IDs and couple stays are welcome.</li>
            </ul>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 sm:px-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-500">Duration:</span>
              <span className="text-xs font-bold text-gray-700">24-hour stay</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-gray-900">
                {formatCurrency(nightlyRate)}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                / 24-hour stay
              </span>
            </div>
            <div className="text-[11px] text-gray-600">
              24-hour room tariff: ₹{pricing.twentyFourHourBase}
            </div>
            <div className="text-[11px] text-gray-500">
              Total: <span className="font-bold text-gray-900">{formatCurrency(totalCost)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRoomForDetails(null)}
              className="px-4 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleBookFromDetails}
              className="px-5 py-2.5 bg-[#a67c32] hover:bg-[#8e6826] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer up-btn"
            >
              <span>Select & Book Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
