import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { RoomCard } from './RoomCard';
import { Filter, SlidersHorizontal, Sparkles, BedDouble } from 'lucide-react';

export const RoomListSection: React.FC = () => {
  const { roomTypes, searchState, setSearchState, physicalRooms } = useHotel();
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high'>('recommended');

  const selectedCategory = searchState.selectedCategory || 'all';
  const setSelectedCategory = (catId: string) => {
    setSearchState((prev) => ({ ...prev, selectedCategory: catId }));
  };

  const totalAvailableKeys = physicalRooms.filter((r) => r.status === 'available').length;

  // Filter room types
  let filtered = roomTypes.filter((room) => {
    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'single' && room.bedroomType !== 'single') return false;
      if (selectedCategory === 'double' && room.bedroomType !== 'double') return false;
      if (selectedCategory === 'ac' && !room.isAC) return false;
      if (selectedCategory === 'non_ac' && room.isAC) return false;
      if (
        !['single', 'double', 'ac', 'non_ac'].includes(selectedCategory) &&
        room.category.toLowerCase() !== selectedCategory.toLowerCase() &&
        room.id !== selectedCategory
      ) {
        return false;
      }
    }
    return true;
  });

  // Sort
  if (sortBy === 'price_low') {
    filtered = [...filtered].sort((a, b) => a.basePrice - b.basePrice);
  } else if (sortBy === 'price_high') {
    filtered = [...filtered].sort((a, b) => b.basePrice - a.basePrice);
  }

  return (
    <section className="my-8 scroll-mt-24" id="rooms">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#a67c32] uppercase tracking-wider">
              Available Accommodations
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {totalAvailableKeys} Keys Ready
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
            Select Your Room & Plan
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            All rooms feature 100% power backup, sanitization guarantee, 5G Wi-Fi, and 24/7 room service.
          </p>
        </div>

        {/* Category Filter & Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All Rooms (4)' },
              { id: 'single', label: 'Single Bedroom' },
              { id: 'double', label: 'Double Bedroom' },
              { id: 'ac', label: 'AC Rooms' },
              { id: 'non_ac', label: 'Non-AC Rooms' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 shadow-xs focus:ring-2 focus:ring-[#a67c32] cursor-pointer"
          >
            <option value="recommended">Recommended &bull; Best Stays</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Rooms List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-400">
            <BedDouble className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <h3 className="text-base font-bold text-gray-800">No matching rooms found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting the guest count or selecting &ldquo;All Rooms&rdquo;.
            </p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-3 px-4 py-2 bg-[#a67c32] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Show All Rooms
            </button>
          </div>
        ) : (
          filtered.map((room) => <RoomCard key={room.id} room={room} />)
        )}
      </div>
    </section>
  );
};
