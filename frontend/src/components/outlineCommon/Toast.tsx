import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { CheckCircle2, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useHotel();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700 max-w-md">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="text-xs sm:text-sm font-medium pr-2">{toastMessage}</p>
      </div>
    </div>
  );
};
