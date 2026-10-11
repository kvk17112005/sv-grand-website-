import React, { useState } from 'react';
import { useHotel, ActivePortal, Currency } from '../../context/HotelContext';
import {
  Building,
  Phone,
  Bell,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Luggage,
  LogIn,
  LogOut,
  MapPin,
  Settings,
  Hotel
} from 'lucide-react';

interface HeaderProps {
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const {
    hotel,
    currentUser,
    activePortal,
    setActivePortal,
    currency,
    setCurrency,
    setIsAuthModalOpen,
    setIsMyBookingsOpen,
    setIsNotificationDrawerOpen,
    notifications,
    logout
  } = useHotel();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      {/* Top micro announcement bar */}
      <div className="bg-[#1c1c1c] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#a67c32] text-white font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase">
              Single-Hotel Portal
            </span>
            <span className="hidden sm:inline text-gray-300">
              Official Direct Booking Platform | Best Rate Guarantee + Free Breakfast for Members
            </span>
          </div>

          <div className="flex items-center gap-4 text-gray-300">
            <a
              href={`tel:${hotel.phone}`}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#a67c32]" />
              <span className="font-semibold text-white">{hotel.phone}</span>
              <span className="text-[11px] text-gray-400 hidden md:inline">(24x7 Front Desk)</span>
            </a>
            <div className="h-3 w-px bg-gray-700 hidden sm:block" />
            <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Sanitized Stay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: OYO Signature Brand Logo + Hotel Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePortal('guest')}
            className="flex items-center gap-2 group cursor-pointer text-left"
            id="header-logo-btn"
          >
            {/* SV Brand Logo + Hotel Identity */}
            <div className="flex items-center justify-center bg-[#a67c32] text-white font-black text-xl tracking-tight px-2.5 py-1 rounded-xl shadow-md group-hover:scale-105 transition-transform">
              SV
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
                  SV Grand Luxury Rooms
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {hotel.oyoCode || 'TPT001'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#a67c32]" />
                <span className="truncate max-w-[180px] sm:max-w-[240px]">
                  Tadipatri, Andhra Pradesh
                </span>
              </p>
            </div>
          </button>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Portal Direct Access Button (Replaced confusing Active Portal switcher) */}
          <button
            onClick={() => setActivePortal(activePortal === 'hotel_admin' ? 'guest' : 'hotel_admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              activePortal === 'hotel_admin'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
            }`}
            title="Switch between User Portal and Admin Portal"
            id="admin-portal-access-btn"
          >
            <Hotel className="w-3.5 h-3.5" />
            <span>{activePortal === 'hotel_admin' ? '← Guest Portal' : 'Admin Portal'}</span>
          </button>

          {/* Currency Selector */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setIsCurrencyMenuOpen(!isCurrencyMenuOpen);
                setIsUserMenuOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              id="currency-selector-btn"
            >
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isCurrencyMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-28 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                {(['INR', 'USD', 'EUR'] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrency(c);
                      setIsCurrencyMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left font-medium hover:bg-gray-50 ${
                      currency === c ? 'text-[#a67c32] font-bold bg-amber-50' : 'text-gray-700'
                    }`}
                  >
                    {c === 'INR' ? '₹ INR' : c === 'USD' ? '$ USD' : '€ EUR'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => {
              if (onOpenNotifications) {
                onOpenNotifications();
              } else {
                setIsNotificationDrawerOpen(true);
              }
            }}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            title="Notifications"
            id="notifications-btn"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#a67c32] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* My Bookings Button */}
          <button
            onClick={() => setIsMyBookingsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            id="header-my-bookings-btn"
          >
            <Luggage className="w-3.5 h-3.5 text-[#a67c32]" />
            <span>My Bookings</span>
          </button>

          {/* User Account / Login */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsCurrencyMenuOpen(false);
                }}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors"
                id="user-profile-menu-btn"
              >
                <div className="w-7 h-7 rounded-full bg-[#a67c32] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-gray-800 hidden md:inline max-w-[100px] truncate">
                  {currentUser.name}
                </span>
                {currentUser.isWizardMember && (
                  <span className="bg-amber-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider hidden lg:inline">
                    Wizard
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#a67c32] hover:bg-[#8e6826] text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow"
                id="header-login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login / Signup</span>
              </button>
            )}

            {/* User Dropdown Menu */}
            {isUserMenuOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-bold text-sm text-gray-900">{currentUser.name}</div>
                  <div className="text-xs text-gray-500 truncate">{currentUser.email}</div>
                  <div className="text-xs text-gray-500">{currentUser.phone}</div>
                  {currentUser.isWizardMember && (
                    <div className="mt-2 flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Wizard Gold Member (5% Extra Off)</span>
                    </div>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsMyBookingsOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Luggage className="w-4 h-4 text-gray-400" />
                    <span>My Bookings & Invoices</span>
                  </button>

                  <button
                    onClick={() => {
                      setActivePortal('hotel_admin');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Hotel className="w-4 h-4 text-emerald-600" />
                    <span>Hotel Admin Panel</span>
                  </button>

                  <button
                    onClick={() => {
                      setActivePortal('super_admin');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-purple-600" />
                    <span>Super Admin Panel</span>
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-left font-semibold text-red-600 hover:bg-amber-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
