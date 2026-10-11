import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

export const ImageLightbox: React.FC = () => {
  const { isGalleryOpen, setIsGalleryOpen, hotel, roomTypes } = useHotel();
  const [activeCategory, setActiveCategory] = useState<'all' | 'rooms' | 'exterior' | 'lobby' | 'facilities'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isGalleryOpen) return null;

  // Flatten images with labels
  const allImages: { url: string; title: string; category: string }[] = [];

  hotel.images.exterior.forEach((img, i) =>
    allImages.push({ url: img, title: `Hotel Exterior & Facade ${i + 1}`, category: 'exterior' })
  );
  hotel.images.lobby.forEach((img, i) =>
    allImages.push({ url: img, title: `Lobby & Reception Lounge ${i + 1}`, category: 'lobby' })
  );
  hotel.images.facilities.forEach((img, i) =>
    allImages.push({ url: img, title: `Hotel Interior ${i + 1}`, category: 'facilities' })
  );

  roomTypes.forEach((rt) => {
    rt.images.forEach((img, i) => {
      allImages.push({ url: img, title: `${rt.name} - View ${i + 1}`, category: 'rooms' });
    });
  });

  const filteredImages =
    activeCategory === 'all'
      ? allImages
      : allImages.filter((img) => img.category === activeCategory);

  const safeIndex = Math.min(currentIndex, filteredImages.length - 1);
  const currentImg = filteredImages[safeIndex] || filteredImages[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between text-white pb-4 border-b border-gray-800">
        <div>
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#a67c32]" />
            <span>{hotel.name} - Photo Gallery</span>
          </h3>
          <p className="text-xs text-gray-400">
            {currentImg?.title} &bull; Image {safeIndex + 1} of {filteredImages.length}
          </p>
        </div>

        <button
          onClick={() => setIsGalleryOpen(false)}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
        {[
          { id: 'all', label: `All Photos (${allImages.length})` },
          { id: 'rooms', label: 'Rooms & Suites' },
          { id: 'exterior', label: 'Exterior & Facade' },
          { id: 'lobby', label: 'Lobby & Lounge' },
          { id: 'facilities', label: 'Hotel Interiors' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveCategory(tab.id as any);
              setCurrentIndex(0);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === tab.id
                ? 'bg-[#a67c32] text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Image Stage */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 my-2">
        {currentImg && (
          <img
            src={currentImg.url}
            alt={currentImg.title}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-all duration-200"
          />
        )}

        {/* Prev / Next Controls */}
        <button
          onClick={handlePrev}
          className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all hover:scale-110 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-all hover:scale-110 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnails strip */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 pt-3 border-t border-gray-800/80">
        {filteredImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
              idx === safeIndex
                ? 'border-[#a67c32] scale-105 shadow-md'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};
