import React from 'react';
import {
  Wifi,
  Zap,
  ShieldCheck,
  CreditCard,
  Tv,
  BedDouble,
  Clock
} from 'lucide-react';

export const AmenitiesSection: React.FC = () => {
  const hotelAmenities = [
    {
      icon: <Wifi className="w-5 h-5 text-[#a67c32]" />,
      title: 'High-Speed 5G Wi-Fi',
      desc: 'Seamless ultra-fast connectivity suitable for remote work and streaming'
    },
    {
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      title: 'Front Desk Assistance',
      desc: 'Our reception team is available to help with your stay'
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: '100% Power Backup',
      desc: 'Power backup for a more comfortable stay'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: 'Clean, Comfortable Rooms',
      desc: 'Choose from single and double room options'
    },
    {
      icon: <CreditCard className="w-5 h-5 text-purple-600" />,
      title: 'All Payment Modes Accepted',
      desc: 'Choose a convenient payment method during booking'
    },
    {
      icon: <BedDouble className="w-5 h-5 text-gray-700" />,
      title: 'AC & Non-AC Choices',
      desc: 'Select the room type that best suits your stay'
    }
  ];

  return (
    <section className="my-10 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
      <div className="mb-6">
        <span className="text-xs font-bold text-[#a67c32] uppercase tracking-wider">
          Hotel Facilities & Comforts
        </span>
        <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mt-0.5">
          Amenities at SV Grand Luxury Rooms
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Helpful essentials for your stay in Tadipatri.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {hotelAmenities.map((amenity, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="p-2.5 rounded-lg bg-white shadow-xs w-fit mb-3">
              {amenity.icon}
            </div>
            <h4 className="text-sm font-bold text-gray-900">{amenity.title}</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{amenity.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
