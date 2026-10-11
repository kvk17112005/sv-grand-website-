import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { GuestRequest } from '../../types/hotel';
import { Coffee, CheckCircle2, Clock, Check, User, Sparkles } from 'lucide-react';

export const GuestRequestsManager: React.FC = () => {
  const { guestRequests, updateGuestRequestStatus, staff } = useHotel();

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-gray-900">In-House Guest Service Requests</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time requests received from staying guests via their portal.
          </p>
        </div>
        <span className="text-xs font-bold text-[#a67c32] bg-red-50 px-3 py-1 rounded-xl">
          {guestRequests.filter((r) => r.status !== 'completed').length} Active Requests
        </span>
      </div>

      <div className="space-y-3">
        {guestRequests.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-400">
            <Coffee className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-bold text-gray-700">No Service Requests</p>
            <p className="text-xs text-gray-400">All guest inquiries are fulfilled.</p>
          </div>
        ) : (
          guestRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-[#a67c32] bg-red-50 px-2 py-0.5 rounded-lg">
                    Room {req.roomNumber}
                  </span>
                  <span className="font-bold text-sm text-gray-900">{req.title}</span>
                  <span className="text-[11px] text-gray-500">&bull; {req.guestName}</span>
                </div>
                {req.notes && (
                  <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                    &ldquo;{req.notes}&rdquo;
                  </p>
                )}
                <div className="text-[11px] text-gray-400">
                  Received {req.createdAt} &bull; Booking Ref: {req.bookingId}
                </div>
              </div>

              {/* Status and Action */}
              <div className="flex items-center gap-2 shrink-0">
                {req.status === 'pending' && (
                  <button
                    onClick={() => updateGuestRequestStatus(req.id, 'in_progress', 'Front Desk Staff')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Take Request</span>
                  </button>
                )}

                {req.status === 'in_progress' && (
                  <button
                    onClick={() => updateGuestRequestStatus(req.id, 'completed', req.assignedTo || 'Duty Manager')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                )}

                {req.status === 'completed' && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed by {req.assignedTo}</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
