import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { Tag, Copy, Check, Clock, Sparkles } from 'lucide-react';

export const OffersSection: React.FC = () => {
  const { offers, showToast, formatCurrency } = useHotel();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const activeOffers = offers.filter(
    (offer) =>
      offer.active &&
      offer.id !== 'c-wizardplus' &&
      offer.code !== 'WIZARDPLUS'
  );

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code ${code} copied! Apply at checkout for instant savings.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-4 up-card-parent">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#a67c32] uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5" />
            <span>Exclusive Savings & Offers</span>
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight up-title-accent">
            Special Hotel Discounts & Promo Deals
          </h3>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline">
          Applicable on direct bookings
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeOffers.map((offer) => (
          <div
            key={offer.id}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group up-card up-icon-parent"
          >
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#a67c32] to-amber-500" />

            <div>
              {/* Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="bg-amber-50 text-[#a67c32] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {offer.badge || 'Limited Time'}
                </span>
                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 up-icon-badge rounded-md" />
                  <span>Till {offer.validUntil}</span>
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{offer.title}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                {offer.description}
              </p>
            </div>

            {/* Coupon Code Strip */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="bg-gray-100 border border-dashed border-gray-300 px-2.5 py-1 rounded-lg text-xs font-black text-gray-800 tracking-wider">
                {offer.code}
              </div>

              <button
                onClick={() => handleCopy(offer.code)}
                className="flex items-center gap-1 text-xs font-bold text-[#a67c32] hover:text-[#8e6826] transition-colors p-1.5 rounded-md hover:bg-amber-50 cursor-pointer up-btn"
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
