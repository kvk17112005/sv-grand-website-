import React from 'react';
import { useHotel } from '../../context/HotelContext';
import {
  MapPin,
  Navigation,
  Train,
  Plane,
  ShoppingBag,
  Building2,
  ExternalLink,
  Compass
} from 'lucide-react';

export const LocationSection: React.FC = () => {
  const { hotel, showToast } = useHotel();

  const getIcon = (type: string) => {
    switch (type) {
      case 'metro':
        return <Train className="w-4 h-4 text-emerald-600" />;
      case 'airport':
        return <Plane className="w-4 h-4 text-blue-600" />;
      case 'railway':
        return <Train className="w-4 h-4 text-amber-600" />;
      case 'shopping':
        return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      default:
        return <Building2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      hotel.name + ' ' + hotel.address + ' ' + hotel.city
    )}`;
    window.open(url, '_blank');
  };

  return (
    <section className="my-10 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs" id="location">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-[#a67c32] uppercase tracking-wider">
            Prime Central Location
          </span>
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mt-0.5">
            Neighborhood & Proximity
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Centrally located on Main Road, Tadipatri with quick access to railway and bus transit.
          </p>
        </div>

        <button
          onClick={handleOpenMaps}
          className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-[#a67c32]" />
          <span>Get Directions</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Distance Matrix */}
        <div className="lg:col-span-6 space-y-2.5">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#a67c32]" />
            <span>Key Transit & City Landmarks</span>
          </h4>

          {hotel.surroundingPlaces.map((place, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 border border-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white shadow-xs shrink-0">
                  {getIcon(place.type)}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">{place.name}</div>
                  <div className="text-[10px] text-gray-400 capitalize">{place.type} point</div>
                </div>
              </div>

              <span className="text-xs font-extrabold text-gray-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                {place.distance}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Interactive styled map representation */}
        <div className="lg:col-span-6 h-80 lg:h-auto rounded-2xl overflow-hidden relative border border-gray-200 shadow-inner bg-slate-100 flex flex-col justify-between p-6">
          {/* Stylized map backdrop visual */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#a67c32_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Central Pin Card */}
          <div className="relative z-10 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200 max-w-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#a67c32] mb-1">
              <MapPin className="w-4 h-4 fill-[#a67c32] text-white" />
              <span>{hotel.name}</span>
            </div>
            <p className="text-xs text-gray-600 leading-snug">
              {hotel.address}, {hotel.city}, {hotel.pincode}
            </p>
            <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit">
              3 mins to Tadipatri Railway Station & Bus Stand
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between bg-white/90 backdrop-blur-md p-3 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="font-bold text-gray-800">Airport Chauffeur Available</span>
              <p className="text-[11px] text-gray-500">Pick-up service bookable during room checkout</p>
            </div>
            <button
              onClick={handleOpenMaps}
              className="px-3 py-1.5 bg-[#a67c32] hover:bg-[#8e6826] text-white font-bold rounded-lg text-xs"
            >
              Open Maps
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
