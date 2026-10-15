import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { PhysicalRoom, RoomType, calculateStayPricing } from '../../types/hotel';
import {
  Check,
  Lock,
  Clock,
  Sparkles,
  Wind,
  Fan,
  BedDouble,
  ShieldCheck,
  ArrowRight,
  Info,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface RedBusRoomGridProps {
  onSelectRoom?: (roomNumber: string, roomTypeId: string) => void;
  selectedRoomNumber?: string | null;
  compact?: boolean;
}

export const RedBusRoomGrid: React.FC<RedBusRoomGridProps> = ({
  onSelectRoom,
  selectedRoomNumber,
  compact = false
}) => {
  const {
    physicalRooms,
    roomTypes,
    selectedRoomNumberForBooking,
    setSelectedRoomNumberForBooking,
    setSelectedRoomForBooking,
    formatCurrency,
    expireBookingNow,
    showToast
  } = useHotel();

  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'single' | 'double' | 'ac' | 'non_ac'>('all');

  const currentSelectedNumber = selectedRoomNumber ?? selectedRoomNumberForBooking;

  // Filter rooms
  const filteredRooms = physicalRooms.filter((r) => {
    if (selectedFloor !== 'all' && r.floor !== selectedFloor) return false;
    const rt = roomTypes.find((t) => t.id === r.roomTypeId);
    if (!rt) return true;

    if (roomTypeFilter === 'single' && rt.bedroomType !== 'single') return false;
    if (roomTypeFilter === 'double' && rt.bedroomType !== 'double') return false;
    if (roomTypeFilter === 'ac' && !rt.isAC) return false;
    if (roomTypeFilter === 'non_ac' && rt.isAC) return false;
    return true;
  });

  // Calculate live counts
  const availableRoomsCount = physicalRooms.filter((r) => r.status === 'available' || r.status === 'cleaning').length;
  const bookedRoomsCount = physicalRooms.filter((r) => r.status === 'occupied').length;
  const pendingRoomsCount = physicalRooms.filter((r) => r.approvalStatus === 'pending').length;

  const handleRoomClick = (room: PhysicalRoom) => {
    if (room.status === 'occupied') {
      showToast(`Room #${room.roomNumber} is currently occupied. Please pick any available green room to book immediately!`);
      return;
    }

    const targetRoomType = roomTypes.find((rt) => rt.id === room.roomTypeId);
    if (onSelectRoom && targetRoomType) {
      onSelectRoom(room.roomNumber, room.roomTypeId);
    } else {
      setSelectedRoomNumberForBooking(room.roomNumber);
      if (targetRoomType) {
        setSelectedRoomForBooking(targetRoomType);
      }
    }
  };

  const getRoomPricingInfo = (roomTypeId: string) => {
    const rt = roomTypes.find((t) => t.id === roomTypeId);
    if (!rt) return { rate: 1500, discount: 0, isAC: true, name: 'Room' };
    const pricing = calculateStayPricing(rt, '24h', 1, 1);
    return {
      rate: pricing.effectiveStayRate,
      twentyFourHourBase: pricing.twentyFourHourBase,
      discount: pricing.durationDiscountAmount,
      isAC: pricing.isAC,
      bedroomType: pricing.bedroomType,
      name: rt.name
    };
  };

  // Remaining time formatter for booked rooms
  const formatRemainingTime = (bookedUntil?: string) => {
    if (!bookedUntil) return null;
    const diffMs = new Date(bookedUntil).getTime() - Date.now();
    if (diffMs <= 0) return 'Expiring now';
    const hours = Math.floor(diffMs / (3600 * 1000));
    const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden up-section ${compact ? 'p-3' : 'p-5 sm:p-6 space-y-6'}`}>
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#a67c32] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              Live Room Availability
            </span>
            <span className="text-xs font-bold text-gray-500">
              RedBus-Style Floor & Seat Map
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mt-1 up-title-accent">
            Pick Your Specific Room Number
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time visual map: Click an available room to reserve. Double-booking is automatically prevented.
          </p>
        </div>

      </div>

      {/* RedBus-Style Status Color Legend Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border-2 border-emerald-500 bg-white shadow-xs" />
            <span className="font-semibold text-gray-700">Available ({availableRoomsCount})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-600 border border-blue-700 text-white flex items-center justify-center text-[9px] font-bold">
              ✓
            </span>
            <span className="font-semibold text-gray-700">Your Selection</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-600 shadow-xs" />
            <span className="font-semibold text-gray-700">Pending Approval</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-gray-800 border border-gray-900 shadow-xs" />
            <span className="font-semibold text-gray-700">Booked / Occupied ({bookedRoomsCount})</span>
          </div>
        </div>

        {/* Floor Filter Tabs */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            Floor:
          </span>
          {[
            { id: 'all', label: 'All Floors' },
            { id: 1, label: 'Floor 1 (5 Rooms)' },
            { id: 2, label: 'Floor 2 (6 Rooms)' },
            { id: 3, label: 'Floor 3 (1 Room)' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFloor(f.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer up-tab ${
                selectedFloor === f.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* RedBus Floor Deck Grid Layout */}
      <div className="space-y-6">
        {/* Floor 1 Section */}
        {(selectedFloor === 'all' || selectedFloor === 1) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Floor 1 &bull; Single Rooms (101 - 105)
                </h4>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">
                AC Single: ₹1,500 (24h) &bull; Non-AC: ₹1,000 (24h)
              </span>
            </div>

            {/* Room cards arranged like bus berths with central walkway */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {filteredRooms
                .filter((r) => r.floor === 1)
                .map((room) => {
                  const pricing = getRoomPricingInfo(room.roomTypeId);
                  const isSelected = currentSelectedNumber === room.roomNumber;
                  const isBooked = room.status === 'occupied';
                  const isPending = room.approvalStatus === 'pending' || room.status === 'pending_approval';
                  const isBookable = !isBooked && !isPending;
                  const remainingText = formatRemainingTime(room.bookedUntil);

                  return (
                    <div
                      key={room.roomNumber}
                      onClick={() => handleRoomClick(room)}
                      className={`relative p-3 rounded-xl border-2 transition-all flex flex-col justify-between text-left select-none up-berth ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-500 scale-[1.02]'
                          : isBooked
                          ? 'border-gray-800 bg-gray-900 text-white cursor-pointer opacity-90'
                          : isPending
                          ? 'border-amber-400 bg-amber-50 cursor-pointer'
                          : 'border-emerald-500 bg-white hover:bg-emerald-50/50 hover:shadow-md cursor-pointer hover:border-emerald-600'
                      }`}
                    >
                      {/* Top Row: Room Number & Type Icon */}
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-black text-sm tracking-tight ${isBooked ? 'text-white' : 'text-gray-900'}`}>
                          #{room.roomNumber}
                        </span>

                        {pricing.isAC ? (
                          <span
                            title="Split AC Room"
                            className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                              isBooked ? 'bg-cyan-900 text-cyan-200' : 'bg-cyan-50 text-cyan-800'
                            }`}
                          >
                            <Wind className="w-3 h-3" />
                            <span className="text-[9px]">AC</span>
                          </span>
                        ) : (
                          <span
                            title="Non-AC Ceiling Fan Room"
                            className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                              isBooked ? 'bg-amber-950 text-amber-200' : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            <Fan className="w-3 h-3" />
                            <span className="text-[9px]">Non-AC</span>
                          </span>
                        )}
                      </div>

                      {/* Middle: Status or Price */}
                      <div className="my-2 text-xs">
                        {isSelected ? (
                          <div className="text-blue-700 font-extrabold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" />
                            <span>Selected</span>
                          </div>
                        ) : isBooked ? (
                          <div className="space-y-0.5">
                            <div className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                              <Lock className="w-3 h-3" />
                              <span>Booked</span>
                            </div>
                            {remainingText && (
                              <div className="text-[9px] text-gray-300 font-mono">
                                {remainingText}
                              </div>
                            )}
                          </div>
                        ) : isPending ? (
                          <div className="space-y-0.5">
                            <div className="text-amber-700 font-bold flex items-center gap-1 text-[10px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Code</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-emerald-700 text-xs">
                              {formatCurrency(pricing.rate)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer */}
                      <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-[10px]">
                        <span className={`truncate text-[9px] ${isBooked ? 'text-gray-400' : 'text-gray-500'}`}>
                          {pricing.name.replace(' Room', '')}
                        </span>
                        {isBookable ? (
                          <span className="text-emerald-700 font-extrabold text-[9px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                            Click to Book
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold text-[9px]">
                            Occupied
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Floor 2 Section */}
        {(selectedFloor === 'all' || selectedFloor === 2) && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Floor 2 &bull; Double Rooms (201 - 206)
                </h4>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">
                AC Double: ₹1,500 (24h) &bull; Non-AC Double: ₹1,500 (24h)
              </span>
            </div>

            {/* Room cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {filteredRooms
                .filter((r) => r.floor === 2)
                .map((room) => {
                  const pricing = getRoomPricingInfo(room.roomTypeId);
                  const isSelected = currentSelectedNumber === room.roomNumber;
                  const isBooked = room.status === 'occupied';
                  const isPending = room.approvalStatus === 'pending' || room.status === 'pending_approval';
                  const isBookable = !isBooked && !isPending;
                  const remainingText = formatRemainingTime(room.bookedUntil);

                  return (
                    <div
                      key={room.roomNumber}
                      onClick={() => handleRoomClick(room)}
                      className={`relative p-3 rounded-xl border-2 transition-all flex flex-col justify-between text-left select-none up-berth ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-500 scale-[1.02]'
                          : isBooked
                          ? 'border-gray-800 bg-gray-900 text-white cursor-pointer opacity-90'
                          : isPending
                          ? 'border-amber-400 bg-amber-50 cursor-pointer'
                          : 'border-emerald-500 bg-white hover:bg-emerald-50/50 hover:shadow-md cursor-pointer hover:border-emerald-600'
                      }`}
                    >
                      {/* Top Row: Room Number & Type Icon */}
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-black text-sm tracking-tight ${isBooked ? 'text-white' : 'text-gray-900'}`}>
                          #{room.roomNumber}
                        </span>

                        {pricing.isAC ? (
                          <span
                            title="Split AC Room"
                            className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                              isBooked ? 'bg-cyan-900 text-cyan-200' : 'bg-cyan-50 text-cyan-800'
                            }`}
                          >
                            <Wind className="w-3 h-3" />
                            <span className="text-[9px]">AC</span>
                          </span>
                        ) : (
                          <span
                            title="Non-AC Room"
                            className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                              isBooked ? 'bg-amber-950 text-amber-200' : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            <Fan className="w-3 h-3" />
                            <span className="text-[9px]">Non-AC</span>
                          </span>
                        )}
                      </div>

                      {/* Middle: Status or Price */}
                      <div className="my-2 text-xs">
                        {isSelected ? (
                          <div className="text-blue-700 font-extrabold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" />
                            <span>Selected</span>
                          </div>
                        ) : isBooked ? (
                          <div className="space-y-0.5">
                            <div className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                              <Lock className="w-3 h-3" />
                              <span>Booked</span>
                            </div>
                            {remainingText && (
                              <div className="text-[9px] text-gray-300 font-mono">
                                {remainingText}
                              </div>
                            )}
                          </div>
                        ) : isPending ? (
                          <div className="space-y-0.5">
                            <div className="text-amber-700 font-bold flex items-center gap-1 text-[10px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Approval</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-emerald-700 text-xs">
                              {formatCurrency(pricing.rate)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer */}
                      <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-[10px]">
                        <span className={`truncate text-[9px] ${isBooked ? 'text-gray-400' : 'text-gray-500'}`}>
                          {pricing.name.replace(' Room', '')}
                        </span>
                        {isBookable ? (
                          <span className="text-emerald-700 font-extrabold text-[9px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                            Click to Book
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold text-[9px]">
                            Occupied
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Floor 3 Section */}
        {(selectedFloor === 'all' || selectedFloor === 3) && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Floor 3 &bull; Room 301
                </h4>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">
                AC Room: ₹1,500 (24h)
              </span>
            </div>

            {/* Room cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {filteredRooms
                .filter((r) => r.floor === 3)
                .map((room) => {
                  const pricing = getRoomPricingInfo(room.roomTypeId);
                  const isSelected = currentSelectedNumber === room.roomNumber;
                  const isBooked = room.status === 'occupied';
                  const isPending = room.approvalStatus === 'pending' || room.status === 'pending_approval';
                  const isBookable = !isBooked && !isPending;
                  const remainingText = formatRemainingTime(room.bookedUntil);

                  return (
                    <div
                      key={room.roomNumber}
                      onClick={() => handleRoomClick(room)}
                      className={`relative p-3 rounded-xl border-2 transition-all flex flex-col justify-between text-left select-none up-berth ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-500 scale-[1.02]'
                          : isBooked
                          ? 'border-gray-800 bg-gray-900 text-white cursor-pointer opacity-90'
                          : isPending
                          ? 'border-amber-400 bg-amber-50 cursor-pointer'
                          : 'border-emerald-500 bg-white hover:bg-emerald-50/50 hover:shadow-md cursor-pointer hover:border-emerald-600'
                      }`}
                    >
                      {/* Top Row: Room Number & Type Icon */}
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-black text-sm tracking-tight ${isBooked ? 'text-white' : 'text-gray-900'}`}>
                          #{room.roomNumber}
                        </span>

                        {pricing.isAC ? (
                          <span
                            title="Split AC Room"
                            className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                              isBooked ? 'bg-cyan-900 text-cyan-200' : 'bg-cyan-50 text-cyan-800'
                            }`}
                          >
                            <Wind className="w-3 h-3" />
                            <span className="text-[9px]">AC</span>
                          </span>
                        ) : (
                          <span
                            title="Non-AC Room"
                            className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                              isBooked ? 'bg-amber-950 text-amber-200' : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            <Fan className="w-3 h-3" />
                            <span className="text-[9px]">Non-AC</span>
                          </span>
                        )}
                      </div>

                      {/* Middle: Status or Price */}
                      <div className="my-2 text-xs">
                        {isSelected ? (
                          <div className="text-blue-700 font-extrabold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" />
                            <span>Selected</span>
                          </div>
                        ) : isBooked ? (
                          <div className="space-y-0.5">
                            <div className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                              <Lock className="w-3 h-3" />
                              <span>Booked</span>
                            </div>
                            {remainingText && (
                              <div className="text-[9px] text-gray-300 font-mono">
                                {remainingText}
                              </div>
                            )}
                          </div>
                        ) : isPending ? (
                          <div className="space-y-0.5">
                            <div className="text-amber-700 font-bold flex items-center gap-1 text-[10px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Approval</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-emerald-700 text-xs">
                              {formatCurrency(pricing.rate)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer */}
                      <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-[10px]">
                        <span className={`truncate text-[9px] ${isBooked ? 'text-gray-400' : 'text-gray-500'}`}>
                          {pricing.name.replace(' Room', '')}
                        </span>
                        {isBookable ? (
                          <span className="text-emerald-700 font-extrabold text-[9px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                            Click to Book
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold text-[9px]">
                            Occupied
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Room Floating Action Banner */}
      {currentSelectedNumber && (
        <div className="p-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-150 up-banner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-sm">
              #{currentSelectedNumber}
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2">
                <span>Selected Room #{currentSelectedNumber}</span>
                <span className="bg-[#a67c32] text-white text-[10px] px-2 py-0.2 rounded font-bold uppercase">
                  24-Hour Stay
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                Rate locked. Proceed to enter guest details and complete secure payment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRoomNumberForBooking(null)}
              className="px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors"
            >
              Clear Choice
            </button>
            <button
              onClick={() => {
                const room = physicalRooms.find((r) => r.roomNumber === currentSelectedNumber);
                if (room) {
                  const rt = roomTypes.find((t) => t.id === room.roomTypeId);
                  if (rt) setSelectedRoomForBooking(rt);
                }
              }}
              className="px-4 py-2 bg-[#a67c32] hover:bg-[#8e6826] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer up-btn"
            >
              <span>Book Room #{currentSelectedNumber}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
