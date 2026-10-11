import React from 'react';
import { useHotel } from '../../context/HotelContext';
import {
  Bell,
  X,
  CheckCheck,
  Tag,
  Luggage,
  Sparkles,
  Info
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose
}) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen
  } = useHotel();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isNotificationDrawerOpen;
  const onClose = propOnClose || (() => setIsNotificationDrawerOpen(false));

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Luggage className="w-4 h-4 text-emerald-600" />;
      case 'offer':
        return <Tag className="w-4 h-4 text-[#a67c32]" />;
      case 'checkin':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#a67c32]" />
              <h3 className="font-bold text-gray-900 text-base">Stay Notifications</h3>
              <span className="bg-red-100 text-[#a67c32] text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium p-1 hover:bg-gray-100 rounded"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4 text-gray-400" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`p-3.5 rounded-xl mb-1 cursor-pointer transition-colors ${
                    n.read ? 'bg-white hover:bg-gray-50' : 'bg-amber-50/40 hover:bg-amber-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-gray-900">{n.title}</h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {n.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#a67c32] shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer banner */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
            OYO Townhouse Concierge &bull; Direct updates for SV Grand Luxury Rooms
          </div>
        </div>
      </div>
    </div>
  );
};
