import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { PhysicalRoom, RoomStatus } from '../../types/hotel';
import {
  CheckCircle2,
  Users,
  Sparkles,
  Wrench,
  AlertTriangle,
  X,
  UserCheck,
  Plus,
  Clock,
  BedDouble,
  FileText
} from 'lucide-react';

interface LiveRoomGridProps {
  onOpenWalkInModal: (preferredRoomNumber?: string) => void;
}

export const LiveRoomGrid: React.FC<LiveRoomGridProps> = ({ onOpenWalkInModal }) => {
  const { physicalRooms, roomTypes, updatePhysicalRoomStatus, staff } = useHotel();
  const [selectedRoom, setSelectedRoom] = useState<PhysicalRoom | null>(null);
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all');

  // Modal edit state
  const [newStatus, setNewStatus] = useState<RoomStatus>('available');
  const [newHousekeeper, setNewHousekeeper] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const housekeepers = staff.filter((s) => s.role.includes('Housekeeping'));

  const handleRoomClick = (room: PhysicalRoom) => {
    setSelectedRoom(room);
    setNewStatus(room.status);
    setNewHousekeeper(room.assignedHousekeeper || '');
    setNewNotes(room.notes || '');
  };

  const handleSaveRoomChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    updatePhysicalRoomStatus(selectedRoom.roomNumber, newStatus, newNotes, newHousekeeper);
    setSelectedRoom(null);
  };

  const filteredRooms = physicalRooms.filter((r) => {
    if (floorFilter !== 'all' && r.floor !== floorFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Available</span>
          </span>
        );
      case 'occupied':
        return (
          <span className="text-[10px] font-bold text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a67c32] animate-pulse" />
            <span>Occupied</span>
          </span>
        );
      case 'cleaning':
        return (
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Housekeeping</span>
          </span>
        );
      case 'maintenance':
        return (
          <span className="text-[10px] font-bold text-gray-700 bg-gray-200 border border-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Wrench className="w-3 h-3 text-gray-600" />
            <span>Maintenance</span>
          </span>
        );
      case 'pending_approval':
        return (
          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Pending Approval</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Legend Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Floor selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
            Floor:
          </span>
          {[
            { id: 'all', label: 'All Floors (26)' },
            { id: 1, label: 'Floor 1 (8)' },
            { id: 2, label: 'Floor 2 (10)' },
            { id: 3, label: 'Floor 3 (8)' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFloorFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                floorFilter === f.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
            Status:
          </span>
          {(['all', 'available', 'occupied', 'cleaning', 'maintenance'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#a67c32] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Room Map Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {filteredRooms.map((room) => {
          const roomType = roomTypes.find((rt) => rt.id === room.roomTypeId);

          const borderColors: Record<RoomStatus, string> = {
            available: 'hover:border-emerald-500 border-gray-200 bg-white',
            occupied: 'hover:border-red-500 border-red-200 bg-red-50/20',
            cleaning: 'hover:border-amber-500 border-amber-200 bg-amber-50/30',
            maintenance: 'hover:border-gray-500 border-gray-300 bg-gray-100/50',
            pending_approval: 'hover:border-amber-500 border-amber-300 bg-amber-50/40'
          };

          return (
            <div
              key={room.roomNumber}
              onClick={() => handleRoomClick(room)}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between h-36 ${borderColors[room.status]}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-lg font-black text-gray-900 tracking-tight">
                    {room.roomNumber}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    Floor {room.floor}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-gray-600 truncate">
                  {roomType?.name.replace('Townhouse ', '')}
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-1">
                {room.status === 'occupied' && room.currentGuestName && (
                  <div className="text-[11px] font-bold text-gray-900 truncate">
                    {room.currentGuestName}
                  </div>
                )}
                {room.status === 'cleaning' && (
                  <div className="text-[10px] text-amber-700 font-medium truncate">
                    {room.assignedHousekeeper || 'Staff pending'}
                  </div>
                )}
                {room.status === 'maintenance' && (
                  <div className="text-[10px] text-gray-500 truncate">
                    {room.notes || 'Service block'}
                  </div>
                )}

                <div>{getStatusBadge(room.status)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Details & Status Management Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#a67c32]">
                  Room Inspector
                </span>
                <h3 className="font-bold text-base text-gray-900">
                  Room {selectedRoom.roomNumber} (Floor {selectedRoom.floor})
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoomChanges} className="p-4 sm:p-6 space-y-4">
              {/* If occupied, show active guest */}
              {selectedRoom.status === 'occupied' && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs space-y-1">
                  <div className="font-bold text-red-900">Occupied by Guest:</div>
                  <div className="font-extrabold text-sm text-gray-900">
                    {selectedRoom.currentGuestName}
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Booking ID: {selectedRoom.currentBookingId}
                  </div>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Change Operational Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['available', 'occupied', 'cleaning', 'maintenance'] as RoomStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        newStatus === st
                          ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign Housekeeping */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Assigned Housekeeper
                </label>
                <select
                  value={newHousekeeper}
                  onChange={(e) => setNewHousekeeper(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
                >
                  <option value="">Unassigned</option>
                  {housekeepers.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name} ({h.shift} shift)
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Room Inspection & Maintenance Notes
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Fresh towels stocked, mini-fridge chilled"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
                />
              </div>

              {/* Quick Walk-in button if available */}
              {selectedRoom.status === 'available' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoom(null);
                    onOpenWalkInModal(selectedRoom.roomNumber);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Check-in Walk-in Guest to Room {selectedRoom.roomNumber}</span>
                </button>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoom(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#a67c32] hover:bg-[#8e6826] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
