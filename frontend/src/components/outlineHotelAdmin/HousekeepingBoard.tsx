import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Sparkles, CheckCircle2, Clock, User, Wrench } from 'lucide-react';

export const HousekeepingBoard: React.FC = () => {
  const { physicalRooms, staff, updatePhysicalRoomStatus } = useHotel();
  const [selectedStaff, setSelectedStaff] = useState<Record<string, string>>({});

  const cleaningRooms = physicalRooms.filter(
    (r) => r.status === 'cleaning' || r.status === 'maintenance'
  );
  const housekeepers = staff.filter((s) => s.role.includes('Housekeeping'));

  const handleMarkCleaned = (roomNumber: string) => {
    updatePhysicalRoomStatus(roomNumber, 'available', 'Sanitized & inspected by housekeeping', '');
  };

  const handleAssign = (roomNumber: string, staffName: string) => {
    setSelectedStaff((prev) => ({ ...prev, [roomNumber]: staffName }));
    updatePhysicalRoomStatus(roomNumber, 'cleaning', 'Cleaning in progress', staffName);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-gray-900">Housekeeping & Sanitization Queue</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {cleaningRooms.length} rooms require turnaround or maintenance service.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>OYO CleanStay Certified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cleaningRooms.length === 0 ? (
          <div className="col-span-3 bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-bold text-gray-800">All Rooms are Clean & Ready!</p>
            <p className="text-xs text-gray-500 mt-0.5">No pending housekeeping turnarounds.</p>
          </div>
        ) : (
          cleaningRooms.map((room) => (
            <div
              key={room.roomNumber}
              className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xl font-black text-gray-900">Room {room.roomNumber}</div>
                  <div className="text-xs text-gray-500">Floor {room.floor}</div>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>{room.status === 'cleaning' ? 'Turnaround Needed' : 'Maintenance'}</span>
                </span>
              </div>

              {room.notes && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="font-semibold text-gray-800">Notes:</span> {room.notes}
                </div>
              )}

              {/* Staff Assignment */}
              <div className="pt-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Assign Attendant
                </label>
                <select
                  value={selectedStaff[room.roomNumber] || room.assignedHousekeeper || ''}
                  onChange={(e) => handleAssign(room.roomNumber, e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#a67c32]"
                >
                  <option value="">Select Housekeeping Staff</option>
                  {housekeepers.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name} ({h.shift})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action */}
              <button
                onClick={() => handleMarkCleaned(room.roomNumber)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Cleaned & Available</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
