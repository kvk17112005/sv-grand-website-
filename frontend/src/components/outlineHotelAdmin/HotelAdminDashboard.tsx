import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHotel } from '../../context/HotelContext';
import { LiveRoomGrid } from './LiveRoomGrid';
import { BookingsManager } from './BookingsManager';
import { HousekeepingBoard } from './HousekeepingBoard';
import { GuestRequestsManager } from './GuestRequestsManager';
import { WalkInBookingModal } from './WalkInBookingModal';
import { AdminBookingVerification } from './AdminBookingVerification';
import {
  LayoutGrid,
  CalendarCheck,
  Sparkles,
  Coffee,
  UserPlus,
  BedDouble,
  Users,
  Clock,
  TrendingUp,
  Building,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

export const HotelAdminDashboard: React.FC = () => {
  const { physicalRooms, bookings, guestRequests, hotel, setActivePortal } = useHotel();
  const [activeTab, setActiveTab] = useState<'verification' | 'rooms' | 'bookings' | 'housekeeping' | 'requests'>('verification');
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [preferredRoom, setPreferredRoom] = useState<string | undefined>(undefined);

  // Key operations statistics
  const totalRooms = physicalRooms.length;
  const occupiedCount = physicalRooms.filter((r) => r.status === 'occupied').length;
  const availableCount = physicalRooms.filter((r) => r.status === 'available').length;
  const cleaningCount = physicalRooms.filter((r) => r.status === 'cleaning').length;
  const maintenanceCount = physicalRooms.filter((r) => r.status === 'maintenance').length;
  const occupancyRate = Math.round((occupiedCount / totalRooms) * 100);

  const pendingRequests = guestRequests.filter((r) => r.status !== 'completed').length;
  const inHouseBookings = bookings.filter((b) => b.bookingStatus === 'checked_in');
  const pendingBookings = bookings.filter((b) => b.approvalStatus === 'pending');

  const handleOpenWalkIn = (roomNum?: string) => {
    setPreferredRoom(roomNum);
    setIsWalkInOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-150">
      {/* Return to Guest Portal Top Navigation Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
            ADM
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Admin & Operations Console
            </div>
            <div className="text-sm font-black">
              SV Grand Luxury Rooms &bull; Tadipatri, AP
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Link
            to="/user-portal"
            onClick={() => setActivePortal('guest')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/20 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>User Portal</span>
          </Link>
          <Link
            to="/super-admin"
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin</span>
          </Link>
        </div>
      </div>

      {/* Top Banner & Fast Action */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#a67c32] uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Front Desk & Operations Console &bull; {hotel.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Hotel Front Desk & Booking Verification
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time booking code verification, admin approvals, RedBus-style room map, and stay duration management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('verification')}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Booking Code</span>
          </button>

          <button
            onClick={() => handleOpenWalkIn()}
            className="px-4 py-3 bg-[#a67c32] hover:bg-[#8e6826] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Walk-in Check-in</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Occupancy Rate */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-1">
            <span>Occupancy</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{occupancyRate}%</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {occupiedCount} of {totalRooms} Rooms Filled
          </div>
        </div>

        {/* Ready Available */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-1">
            <span>Available Ready</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{availableCount}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Clean & Vacant Keys</div>
        </div>

        {/* Housekeeping In Progress */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-1">
            <span>Cleaning Queue</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{cleaningCount}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Under Turnaround</div>
        </div>

        {/* In-House Guests */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-1">
            <span>In-House Guests</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{inHouseBookings.length}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Active Stay Registrations</div>
        </div>

        {/* Guest Requests */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-1">
            <span>Service Requests</span>
            <Coffee className="w-4 h-4 text-[#a67c32]" />
          </div>
          <div className="text-2xl font-black text-[#a67c32]">{pendingRequests}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Pending Guest Tasks</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-4 pt-2 shadow-xs overflow-x-auto no-scrollbar">
        {[
          { id: 'verification', label: `Booking Code Verification (${pendingBookings.length} Pending)`, icon: <ShieldCheck className="w-4 h-4 text-emerald-600" /> },
          { id: 'rooms', label: 'Live Floor Map (26 Rooms)', icon: <LayoutGrid className="w-4 h-4" /> },
          { id: 'bookings', label: `Front Desk Bookings (${bookings.length})`, icon: <CalendarCheck className="w-4 h-4" /> },
          { id: 'housekeeping', label: `Housekeeping (${cleaningCount})`, icon: <Sparkles className="w-4 h-4" /> },
          { id: 'requests', label: `Guest Requests (${pendingRequests})`, icon: <Coffee className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#a67c32] text-[#a67c32]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Panel */}
      <div>
        {activeTab === 'verification' && <AdminBookingVerification />}
        {activeTab === 'rooms' && (
          <LiveRoomGrid onOpenWalkInModal={handleOpenWalkIn} />
        )}
        {activeTab === 'bookings' && <BookingsManager />}
        {activeTab === 'housekeeping' && <HousekeepingBoard />}
        {activeTab === 'requests' && <GuestRequestsManager />}
      </div>

      {/* Walk-in Modal */}
      <WalkInBookingModal
        isOpen={isWalkInOpen}
        onClose={() => {
          setIsWalkInOpen(false);
          setPreferredRoom(undefined);
        }}
        preferredRoomNumber={preferredRoom}
      />
    </div>
  );
};
