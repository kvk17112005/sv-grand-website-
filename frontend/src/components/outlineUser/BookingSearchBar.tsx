import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import {
  Calendar,
  Users,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  Minus,
  MapPin,
  Check,
} from 'lucide-react';

export const BookingSearchBar: React.FC = () => {
  const {
    searchState,
    setSearchState,
    nightsCount,
    roomTypes,
    formatCurrency,
    hotel
  } = useHotel();
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [isGuestPopoverOpen, setIsGuestPopoverOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [locationSearchInput, setLocationSearchInput] = useState('');

  const categories = [
    { id: 'all', label: 'All Rooms (4)' },
    { id: 'single', label: 'Single Bedroom' },
    { id: 'double', label: 'Double Bedroom' },
    { id: 'ac', label: 'AC Rooms' },
    { id: 'non_ac', label: 'Non-AC Rooms' }
  ];

  const availableAmenities = [
    'Split Air Conditioning',
    'High-Speed Wi-Fi',
    '24/7 Power Backup',
    'Geyser Hot Water',
    '40" Smart LED TV',
    'Daily Housekeeping',
    'Sanitized Toiletries'
  ];

  const handleDateChange = (type: 'checkIn' | 'checkOut', value: string) => {
    if (type === 'checkIn') {
      const nextDay = new Date(value);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      setSearchState((prev) => ({
        ...prev,
        checkInDate: value,
        checkOutDate: prev.checkOutDate <= value ? nextDayStr : prev.checkOutDate
      }));
    } else {
      setSearchState((prev) => ({
        ...prev,
        checkOutDate: value
      }));
    }
  };

  const updateGuests = (field: 'adults' | 'children' | 'roomsCount', delta: number) => {
    setSearchState((prev) => {
      const current = prev[field];
      const nextVal = Math.max(field === 'children' ? 0 : 1, current + delta);
      return { ...prev, [field]: nextVal };
    });
  };

  const toggleAmenity = (amenity: string) => {
    setSearchState((prev) => {
      const exists = prev.amenitiesFilter.includes(amenity);
      return {
        ...prev,
        amenitiesFilter: exists
          ? prev.amenitiesFilter.filter((a) => a !== amenity)
          : [...prev.amenitiesFilter, amenity]
      };
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-5">
      {/* Main Search Controls Container */}
        <div className="bg-gray-50 p-2 sm:p-2.5 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Location Selector (Strictly Tadipatri Exclusive) */}
          <div className="relative lg:w-72 shrink-0">
            <button
              onClick={() => {
                setIsLocationPopoverOpen(!isLocationPopoverOpen);
                setIsGuestPopoverOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors text-left cursor-pointer up-btn"
              id="search-location-select-btn"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#a67c32] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <span>Location</span>
                    <span className="bg-amber-100 text-[#a67c32] text-[9px] font-bold px-1 rounded">Exclusive</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    Tadipatri, Andhra Pradesh
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {/* Location Dropdown Modal */}
            {isLocationPopoverOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 z-50 animate-in fade-in duration-150 up-banner">
                <div className="text-xs font-bold text-gray-900 mb-2 flex items-center justify-between">
                  <span>Select Hotel Location</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                    1 City Only
                  </span>
                </div>

                {/* Search input inside location dropdown */}
                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Tadipatri..."
                    value={locationSearchInput}
                    onChange={(e) => setLocationSearchInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#a67c32]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div
                    onClick={() => setIsLocationPopoverOpen(false)}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer flex items-start gap-2.5"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#a67c32] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>Tadipatri (Anantapur Dist, AP)</span>
                        <span className="text-[9px] bg-[#a67c32] text-white px-1 py-0.2 rounded font-semibold">Active</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Railway Station Road, Near APSRTC Bus Stand (PIN: 515411)
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5 text-[10px] text-gray-500">
                        <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">Near Railway Station</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">Bugga Ramalingeswara</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-gray-50 rounded-lg text-[11px] text-gray-500 flex items-center gap-2">
                  <span className="text-[#a67c32] font-bold">Note:</span>
                  <span>SV Grand Luxury Rooms operates exclusively in Tadipatri.</span>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Picker with Nights Badge */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 flex-1 relative">
            {/* Check-in */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200">
              <Calendar className="w-4 h-4 text-[#a67c32] shrink-0" />
              <div className="min-w-0 flex-1">
                <label className="block text-[10px] uppercase font-bold text-gray-400">
                  Check-in
                </label>
                <input
                  type="date"
                  value={searchState.checkInDate}
                  onChange={(e) => handleDateChange('checkIn', e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-gray-900 bg-transparent focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>

            {/* Check-out */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200">
              <Calendar className="w-4 h-4 text-[#a67c32] shrink-0" />
              <div className="min-w-0 flex-1">
                <label className="block text-[10px] uppercase font-bold text-gray-400">
                  Check-out
                </label>
                <input
                  type="date"
                  min={searchState.checkInDate}
                  value={searchState.checkOutDate}
                  onChange={(e) => handleDateChange('checkOut', e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-gray-900 bg-transparent focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>

            {/* Nights floating pill badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10">
              {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}
            </div>
          </div>

          {/* Guests & Rooms Popover */}
          <div className="relative lg:w-64 shrink-0">
            <button
              onClick={() => setIsGuestPopoverOpen(!isGuestPopoverOpen)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors text-left cursor-pointer up-btn"
              id="search-guests-rooms-btn"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#a67c32] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-[10px] uppercase font-bold text-gray-400">
                    Guests & Rooms
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {searchState.adults} Adults
                    {searchState.children > 0 && `, ${searchState.children} Child`}
                    {` • ${searchState.roomsCount} Room`}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {/* Dropdown Popover */}
            {isGuestPopoverOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 space-y-4 animate-in fade-in duration-150 up-banner">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-gray-900">Adults</div>
                    <div className="text-[11px] text-gray-500">Ages 12 years and above</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => updateGuests('adults', -1)}
                      disabled={searchState.adults <= 1}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{searchState.adults}</span>
                    <button
                      onClick={() => updateGuests('adults', 1)}
                      disabled={searchState.adults >= 8}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:bg-gray-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div>
                    <div className="font-bold text-xs text-gray-900">Children</div>
                    <div className="text-[11px] text-gray-500">Ages 0 to 11 years</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => updateGuests('children', -1)}
                      disabled={searchState.children <= 0}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{searchState.children}</span>
                    <button
                      onClick={() => updateGuests('children', 1)}
                      disabled={searchState.children >= 4}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:bg-gray-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div>
                    <div className="font-bold text-xs text-gray-900">Rooms Required</div>
                    <div className="text-[11px] text-gray-500">Up to 4 rooms per booking</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => updateGuests('roomsCount', -1)}
                      disabled={searchState.roomsCount <= 1}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{searchState.roomsCount}</span>
                    <button
                      onClick={() => updateGuests('roomsCount', 1)}
                      disabled={searchState.roomsCount >= 4}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:bg-gray-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsGuestPopoverOpen(false)}
                  className="w-full py-2 bg-[#a67c32] hover:bg-[#8e6826] text-white text-xs font-bold rounded-xl mt-2 cursor-pointer transition-colors up-btn"
                >
                  Apply Guests
                </button>
              </div>
            )}
          </div>

          {/* Quick Filter button toggle */}
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer up-tab ${
              searchState.amenitiesFilter.length > 0 || isFilterDrawerOpen
                ? 'bg-amber-50 text-[#a67c32] border-[#a67c32]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {searchState.amenitiesFilter.length > 0 && (
              <span className="bg-[#a67c32] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {searchState.amenitiesFilter.length}
              </span>
            )}
          </button>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="flex items-center justify-between gap-4 pt-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Category:
            </span>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  setSearchState((prev) => ({ ...prev, selectedCategory: c.id }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer up-tab ${
                  searchState.selectedCategory === c.id
                    ? 'bg-[#1c1c1c] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

        </div>

        {/* Expanded Amenities Filter Drawer */}
        {isFilterDrawerOpen && (
          <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in duration-150 up-banner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Filter by Preferred Room Amenities:
              </span>
              {searchState.amenitiesFilter.length > 0 && (
                <button
                  onClick={() => setSearchState((prev) => ({ ...prev, amenitiesFilter: [] }))}
                  className="text-xs text-[#a67c32] font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {availableAmenities.map((amenity) => {
                const isSelected = searchState.amenitiesFilter.includes(amenity);
                return (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer up-tab ${
                      isSelected
                        ? 'bg-[#a67c32] text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
