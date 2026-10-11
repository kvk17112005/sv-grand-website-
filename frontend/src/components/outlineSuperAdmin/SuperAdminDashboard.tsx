import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHotel } from '../../context/HotelContext';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { PricingManager } from './PricingManager';
import { OffersCouponsManager } from './OffersCouponsManager';
import { StaffManager } from './StaffManager';
import { ReviewsModeration } from './ReviewsModeration';
import { HotelSettings } from './HotelSettings';
import {
  BarChart3,
  Tag,
  Gift,
  Users,
  MessageSquare,
  Settings,
  ShieldCheck,
  Building,
  ArrowLeft
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { hotel, offers, reviews, staff, setActivePortal, refreshBookingsFromBackend } = useHotel();
  const [activeTab, setActiveTab] = useState<'analytics' | 'pricing' | 'offers' | 'staff' | 'reviews' | 'settings'>('analytics');

  useEffect(() => {
    refreshBookingsFromBackend();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-150">
      {/* Return to Guest Portal Top Navigation Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            SUP
          </div>
          <div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Super Admin Executive Console
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
            to="/hotel-admin"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Building className="w-4 h-4" />
            <span>Hotel Admin</span>
          </Link>
        </div>
      </div>
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Administrator & Executive Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Hotel Governance & Financial Control
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Comprehensive oversight across pricing strategies, marketing promotions, team roles, and revenue intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
            <Building className="w-4 h-4 text-[#a67c32]" />
            <span className="text-xs font-bold text-gray-800">{hotel.name}</span>
          </div>
          <button
            onClick={() => setActivePortal('guest')}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Exit to Guest View</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl px-4 pt-2 shadow-xs overflow-x-auto no-scrollbar">
        {[
          { id: 'analytics', label: 'Financial Analytics & Reports', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'pricing', label: 'Room Tariffs & Surge', icon: <Tag className="w-4 h-4" /> },
          { id: 'offers', label: `Coupons & Offers (${offers.length})`, icon: <Gift className="w-4 h-4" /> },
          { id: 'staff', label: `Staff & RBAC (${staff.length})`, icon: <Users className="w-4 h-4" /> },
          { id: 'reviews', label: `Reviews Moderation (${reviews.length})`, icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'settings', label: 'Hotel & Database Settings', icon: <Settings className="w-4 h-4" /> }
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

      {/* Tab Panels */}
      <div>
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'pricing' && <PricingManager />}
        {activeTab === 'offers' && <OffersCouponsManager />}
        {activeTab === 'staff' && <StaffManager />}
        {activeTab === 'reviews' && <ReviewsModeration />}
        {activeTab === 'settings' && <HotelSettings />}
      </div>
    </div>
  );
};
