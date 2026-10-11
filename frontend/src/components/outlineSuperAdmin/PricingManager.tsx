import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { RoomType } from '../../types/hotel';
import {
  Tag,
  Percent,
  CheckCircle2,
  TrendingUp,
  Save,
  Zap,
  BedDouble,
  DollarSign,
  Maximize2,
  Sparkles
} from 'lucide-react';

export const PricingManager: React.FC = () => {
  const { roomTypes, updateRoomTypePricing, formatCurrency, showToast } = useHotel();
  const [editingPrices, setEditingPrices] = useState<Record<string, { basePrice: number; discountPercentage: number }>>(
    roomTypes.reduce((acc, rt) => {
      acc[rt.id] = { basePrice: rt.basePrice, discountPercentage: rt.discountPercentage };
      return acc;
    }, {} as any)
  );

  const handlePriceChange = (id: string, field: 'basePrice' | 'discountPercentage', val: number) => {
    setEditingPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val
      }
    }));
  };

  const handleSaveRoom = (rt: RoomType) => {
    const updated = editingPrices[rt.id];
    if (updated) {
      updateRoomTypePricing(rt.id, updated.basePrice, updated.discountPercentage);
    }
  };

  const handleApplySurge = (factorPct: number, label: string) => {
    roomTypes.forEach((rt) => {
      const newBase = Math.round(rt.basePrice * (1 + factorPct / 100));
      updateRoomTypePricing(rt.id, newBase, rt.discountPercentage);
    });
    showToast(`Applied ${label} surge (${factorPct > 0 ? '+' : ''}${factorPct}%) across all rooms!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Surge Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#a67c32] uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Dynamic Yield & Surge Engine</span>
          </div>
          <h3 className="text-lg font-black text-gray-900">
            Rate Card & Seasonal Pricing Management
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure base tariffs, direct promo discounts, and instant seasonal surges.
          </p>
        </div>

        {/* Quick Surge presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleApplySurge(0, 'Standard Tariff')}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Normal Rates
          </button>
          <button
            onClick={() => handleApplySurge(15, 'Weekend Premium')}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            +15% Weekend
          </button>
          <button
            onClick={() => handleApplySurge(25, 'Peak Festival Surge')}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#a67c32] border border-red-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            +25% Peak Season
          </button>
        </div>
      </div>

      {/* Room Category Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roomTypes.map((rt) => {
          const currentEdit = editingPrices[rt.id] || {
            basePrice: rt.basePrice,
            discountPercentage: rt.discountPercentage
          };
          const effectiveRate = Math.round(
            currentEdit.basePrice * (1 - currentEdit.discountPercentage / 100)
          );

          return (
            <div
              key={rt.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#a67c32]">
                    {rt.category}
                  </span>
                  <h4 className="font-extrabold text-base text-gray-900">{rt.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{rt.tagline}</p>
                </div>

                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                  <img src={rt.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Rack / Base Rate (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step={50}
                      value={currentEdit.basePrice}
                      onChange={(e) =>
                        handlePriceChange(rt.id, 'basePrice', Number(e.target.value))
                      }
                      className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-extrabold text-gray-900 focus:ring-2 focus:ring-[#a67c32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Direct Discount (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={currentEdit.discountPercentage}
                      onChange={(e) =>
                        handlePriceChange(rt.id, 'discountPercentage', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-extrabold text-gray-900 focus:ring-2 focus:ring-[#a67c32]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Effective Price Preview */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Live Guest Nightly Price:</span>
                  <div className="text-lg font-black text-emerald-800">
                    {formatCurrency(effectiveRate)}{' '}
                    <span className="text-xs font-normal text-gray-400 line-through">
                      {formatCurrency(currentEdit.basePrice)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSaveRoom(rt)}
                  className="px-4 py-2 bg-[#a67c32] hover:bg-[#8e6826] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Tariff</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
