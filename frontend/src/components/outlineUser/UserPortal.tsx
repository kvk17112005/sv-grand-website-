import React from 'react';
import { HotelHero } from './HotelHero';
import { BookingSearchBar } from './BookingSearchBar';
import { RedBusRoomGrid } from './RedBusRoomGrid';
import { OffersSection } from './OffersSection';
import { RoomListSection } from './RoomListSection';
import { AmenitiesSection } from './AmenitiesSection';
import { ReviewsSection } from './ReviewsSection';
import { LocationSection } from './LocationSection';
import './userPortal.css';

export const UserPortal: React.FC = () => {
  return (
    <div className="up-portal space-y-6">
      {/* Hotel Hero: Photos, Title, Ratings & Key Badges */}
      <HotelHero />

      {/* Sticky / Primary Dates & Guests Search Filter */}
      <BookingSearchBar />

      {/* Live RedBus-Style Room Availability Grid */}
      <RedBusRoomGrid />

      {/* Promo Coupons Carousel / Grid */}
      <OffersSection />

      {/* Main Room Listings & Book Flow */}
      <RoomListSection />

      {/* Hotel Amenities & Facilities */}
      <AmenitiesSection />

      {/* Verified Guest Reviews & Rating Metrics */}
      <ReviewsSection />

      {/* Location, Transit Distances & Map */}
      <LocationSection />
    </div>
  );
};
