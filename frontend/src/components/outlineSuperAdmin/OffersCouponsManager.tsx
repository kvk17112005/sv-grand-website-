import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Offer } from '../../types/hotel';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Percent,
  DollarSign,
  X,
  Sparkles
} from 'lucide-react';

export const OffersCouponsManager: React.FC = () => {
  const { offers, addOffer, toggleOfferStatus, deleteOffer, formatCurrency } = useHotel();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Coupon Form
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState(25);
  const [minBookingAmount, setMinBookingAmount] = useState(1500);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(1000);
  const [validUntil, setValidUntil] = useState('31 Dec 2026');
  const [badge, setBadge] = useState('Festive Deal');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return;

    addOffer({
      code: code.trim().toUpperCase(),
      title,
      description,
      discountType,
      discountValue,
      minBookingAmount,
      maxDiscount: discountType === 'percentage' ? maxDiscount : undefined,
      validUntil,
      badge,
      active: true
    });

    setIsCreateModalOpen(false);
    setCode('');
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-gray-900">Promotions & Discount Coupons</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage checkout vouchers, percentage rebates, and direct guest incentives.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-[#a67c32] hover:bg-[#8e6826] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
              offer.active ? 'border-gray-200' : 'border-gray-200 opacity-60 bg-gray-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-sm font-black text-gray-900 bg-gray-100 border border-gray-300 px-2.5 py-0.5 rounded-lg tracking-wider">
                  {offer.code}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    offer.active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {offer.active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h4 className="font-bold text-sm text-gray-900 mt-1">{offer.title}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                {offer.description}
              </p>

              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                <div>
                  <span className="text-gray-400">Benefit:</span>{' '}
                  <span className="font-bold text-gray-900">
                    {offer.discountType === 'percentage'
                      ? `${offer.discountValue}% OFF`
                      : `₹${offer.discountValue} FLAT`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Min Stay:</span>{' '}
                  <span className="font-bold text-gray-900">₹{offer.minBookingAmount}</span>
                </div>
                <div className="col-span-2 text-gray-400">
                  Valid until: <span className="text-gray-700 font-medium">{offer.validUntil}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => toggleOfferStatus(offer.id)}
                className="text-xs font-bold text-gray-700 hover:text-gray-900 cursor-pointer"
              >
                {offer.active ? 'Disable Coupon' : 'Enable Coupon'}
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete coupon ${offer.code}?`)) {
                    deleteOffer(offer.id);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                title="Delete Offer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-base text-gray-900">Create New Coupon</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-4 sm:p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Coupon Code (e.g. DIWALI30)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="NEWGUEST25"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-extrabold uppercase tracking-wider focus:ring-2 focus:ring-[#a67c32]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Offer Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 25% Off Midweek Business Stay"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#a67c32]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Terms and inclusions..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#a67c32]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Min Booking (₹)
                  </label>
                  <input
                    type="number"
                    value={minBookingAmount}
                    onChange={(e) => setMinBookingAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={maxDiscount || ''}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#a67c32] hover:bg-[#8e6826] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
