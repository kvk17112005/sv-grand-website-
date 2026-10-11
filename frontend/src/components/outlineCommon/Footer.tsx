import React from 'react';
import { useHotel } from '../../context/HotelContext';
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Sparkles,
  Clock,
  CreditCard,
  HeartHandshake
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { hotel, setActivePortal } = useHotel();

  return (
    <footer className="bg-[#1c1c1c] text-white pt-14 pb-8 mt-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Feature Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-gray-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gray-800 text-[#a67c32]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Sanitized Stays</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Hospital-grade thermal disinfection after every guest checkout.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gray-800 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Best Direct Price</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Guaranteed lowest room rates when booking directly on this official site.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gray-800 text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Flexible Cancellation</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                100% full refund on cancellations up to 24 hours before check-in time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gray-800 text-blue-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Couple Friendly & Safe</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Local IDs welcome. Unmarried couples above 18+ accommodated seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Hotel Contact */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-12 border-b border-gray-800">
          {/* Col 1: Hotel Identity */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#a67c32] text-white font-black text-xl px-2.5 py-0.5 rounded-xl shadow-xs">
                SV
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                SV Grand Luxury Rooms
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md">
              The premier hospitality destination in Tadipatri, Andhra Pradesh. Offering AC single and family rooms and Non-AC single and double rooms right by Railway Station Road.
            </p>

            <div className="space-y-2 pt-2 text-xs text-gray-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#a67c32] shrink-0 mt-0.5" />
                <span>{hotel.address}, {hotel.city}, {hotel.state} - {hotel.pincode}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#a67c32] shrink-0" />
                <span>Front Desk: {hotel.phone} (Direct Line)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#a67c32] shrink-0" />
                <span>Reservations: {hotel.email}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Timings & Rules */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider text-gray-300">
              Stay Policies & Timings
            </h4>
            <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">Standard Check-in:</span>
                <span className="font-bold text-white">{hotel.checkInTime}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">Standard Check-out:</span>
                <span className="font-bold text-white">{hotel.checkOutTime}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">Early Check-in:</span>
                <span className="text-emerald-400 font-semibold">From 09:00 AM (Subject to availability)</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span className="text-gray-400">Valid ID:</span>
                <span className="text-gray-300">Aadhaar, Passport, DL, Voter ID</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              {hotel.cancellationPolicy}
            </p>
          </div>

          {/* Col 3: Management Panels & Quick Access */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider text-gray-300">
              Management Portals
            </h4>
            <p className="text-xs text-gray-400">
              Direct access for property staff, managers, and ownership:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActivePortal('hotel_admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left px-3 py-2 bg-gray-800/80 hover:bg-gray-800 text-xs text-white rounded-lg border border-gray-700 flex items-center justify-between transition-colors"
              >
                <span>Hotel Operations & Front Desk</span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </button>

              <button
                onClick={() => {
                  setActivePortal('super_admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left px-3 py-2 bg-gray-800/80 hover:bg-gray-800 text-xs text-white rounded-lg border border-gray-700 flex items-center justify-between transition-colors"
              >
                <span>Executive & Revenue Analytics</span>
                <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">
                  Super Admin
                </span>
              </button>

              <button
                onClick={() => {
                  setActivePortal('guest');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left px-3 py-2 bg-gray-800/80 hover:bg-gray-800 text-xs text-white rounded-lg border border-gray-700 flex items-center justify-between transition-colors"
              >
                <span>Guest Booking Portal</span>
                <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded">
                  Public
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            &copy; 2026 OYO Townhouse 045 Grand Regal. All rights reserved. Dedicated Single-Hotel Booking Engine.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-gray-400">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span>UPI, Cards, NetBanking, OYO Wallet Accepted</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
