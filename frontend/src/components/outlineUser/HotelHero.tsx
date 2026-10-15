import React from 'react';
import { useHotel } from '../../context/HotelContext';
import {
  Star,
  MapPin,
  ShieldCheck,
  Heart,
  Share2,
  Images,
  CheckCircle,
  Clock,
  Sparkles,
  Wifi,
  BedDouble
} from 'lucide-react';

export const HotelHero: React.FC = () => {
  const { hotel, roomTypes, setIsGalleryOpen, showToast } = useHotel();

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Hotel link copied to clipboard!');
  };

  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-6">
        {/* Top Info Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5">
          <div className="space-y-1.5">
            {/* Badges strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#a67c32] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                SV Grand Luxury
              </span>
              <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Premier Luxury Stay</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Sanitized Stay Certified</span>
              </span>
              <span className="bg-blue-50 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                Couple Friendly &bull; Local IDs Welcome
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight up-title-accent">
              {hotel.name}
            </h1>

            {/* Address & Tadipatri Proximity */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#a67c32] shrink-0" />
                <span className="font-medium text-gray-800">{hotel.address}, {hotel.city}, {hotel.state}</span>
              </div>
              <span className="text-gray-300 hidden sm:inline">&bull;</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                Near Tadipatri Railway Station & APSRTC Bus Stand
              </span>
            </div>
          </div>

          {/* Right Action Icons & Rating Block */}
          <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0">
            {/* Rating badge */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-2xl up-glow">
              <div className="flex items-center gap-1 bg-emerald-600 text-white font-black text-base px-2.5 py-1 rounded-xl shadow-xs">
                <span>{hotel.rating}</span>
                <Star className="w-4 h-4 fill-white" />
              </div>
              <div>
                <div className="font-bold text-xs text-gray-900">Very Good</div>
                <div className="text-[11px] text-gray-500 font-medium">
                  {hotel.totalReviewsCount.toLocaleString()} Verified Ratings
                </div>
              </div>
            </div>

            {/* Share & Save */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors up-btn"
                title="Share Hotel"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Photo Mosaic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl overflow-hidden shadow-sm relative">
          {/* Main big hero photo */}
          <div
            className="md:col-span-2 h-72 md:h-96 relative group cursor-pointer overflow-hidden up-media"
            onClick={() => setIsGalleryOpen(true)}
          >
            <img
              src={hotel.images.exterior[0]}
              alt="SV Grand Luxury Rooms exterior"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <span className="bg-black/60 backdrop-blur-xs text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Exterior Architecture
              </span>
              <h3 className="font-bold text-lg text-white mt-1 drop-shadow-sm">
                SV Grand Luxury Rooms
              </h3>
            </div>
          </div>

          {/* 2nd column: 2 stacked photos */}
          <div className="hidden md:flex flex-col gap-3 h-96">
            <div
              className="h-1/2 relative group cursor-pointer overflow-hidden rounded-lg up-media"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={hotel.images.lobby[0]}
                alt="Reception & Lounge"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/70 text-white px-2 py-0.5 rounded">
                Lobby & Reception
              </span>
            </div>

            <div
              className="h-1/2 relative group cursor-pointer overflow-hidden rounded-lg up-media"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={roomTypes[0]?.images[0] || hotel.images.exterior[0]}
                alt="SV Grand AC single room"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/70 text-white px-2 py-0.5 rounded">
                AC Single Room
              </span>
            </div>
          </div>

          {/* 3rd column: 2 stacked photos with View All overlay */}
          <div className="hidden md:flex flex-col gap-3 h-96">
            <div
              className="h-1/2 relative group cursor-pointer overflow-hidden rounded-lg up-media"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={roomTypes[1]?.images[0] || hotel.images.lobby[0]}
                alt="SV Grand non-AC single room"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/70 text-white px-2 py-0.5 rounded">
                Non-AC Single Room
              </span>
            </div>

            <div
              className="h-1/2 relative group cursor-pointer overflow-hidden rounded-lg up-media"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={roomTypes[2]?.images[0] || hotel.images.exterior[0]}
                alt="SV Grand AC double room"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white group-hover:bg-black/70 transition-colors">
                <Images className="w-6 h-6 mb-1 text-[#a67c32]" />
                <span className="font-bold text-sm">View All Hotel Photos</span>
              </div>
            </div>
          </div>

          {/* Mobile View All button badge */}
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="md:hidden absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg"
          >
            <Images className="w-4 h-4 text-[#a67c32]" />
            <span>View All Hotel Photos</span>
          </button>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs up-card up-icon-parent">
            <Clock className="w-4 h-4 text-[#a67c32] shrink-0 up-icon-badge rounded-md" />
            <div>
              <div className="font-bold text-gray-900">Check-in: {hotel.checkInTime}</div>
              <div className="text-[11px] text-gray-500">Check-out: {hotel.checkOutTime}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs up-card up-icon-parent">
            <Wifi className="w-4 h-4 text-emerald-600 shrink-0 up-icon-badge rounded-md" />
            <div>
              <div className="font-bold text-gray-900">Free 5G Wi-Fi</div>
              <div className="text-[11px] text-gray-500">High speed across all floors</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs up-card up-icon-parent">
            <BedDouble className="w-4 h-4 text-amber-600 shrink-0 up-icon-badge rounded-md" />
            <div>
              <div className="font-bold text-gray-900">Room Options</div>
              <div className="text-[11px] text-gray-500">Single and double rooms</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs up-card up-icon-parent">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 up-icon-badge rounded-md" />
            <div>
              <div className="font-bold text-gray-900">Pay At Hotel Available</div>
              <div className="text-[11px] text-gray-500">Or pay online with extra perks</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
