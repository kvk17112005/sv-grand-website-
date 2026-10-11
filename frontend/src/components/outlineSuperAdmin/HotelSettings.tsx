import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import {
  Building,
  Save,
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  Percent,
  Clock,
  Mail,
  Phone,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const HotelSettings: React.FC = () => {
  const { hotel, updateHotelSettings, resetToFactoryDefaults, showToast } = useHotel();

  // Form State
  const [name, setName] = useState(hotel.name);
  const [tagline, setTagline] = useState(hotel.tagline);
  const [address, setAddress] = useState(hotel.address);
  const [city, setCity] = useState(hotel.city);
  const [phone, setPhone] = useState(hotel.phone);
  const [email, setEmail] = useState(hotel.email);
  const [gstNumber, setGstNumber] = useState(hotel.gstNumber);
  const [taxPercentage, setTaxPercentage] = useState(hotel.taxPercentage);
  const [wizardDiscountPercentage, setWizardDiscountPercentage] = useState(
    hotel.wizardDiscountPercentage
  );
  const [checkInTime, setCheckInTime] = useState(hotel.checkInTime);
  const [checkOutTime, setCheckOutTime] = useState(hotel.checkOutTime);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateHotelSettings({
      name,
      tagline,
      address,
      city,
      phone,
      email,
      gstNumber,
      taxPercentage,
      wizardDiscountPercentage,
      checkInTime,
      checkOutTime
    });
  };

  const handleExportData = () => {
    const fullBackup = {
      hotel,
      exportTimestamp: new Date().toISOString(),
      localStorageSnapshot: { ...localStorage }
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `grand_regal_hotel_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Database backup JSON exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Hotel Core Profile Settings */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#a67c32] uppercase tracking-wider mb-0.5">
              <Building className="w-4 h-4" />
              <span>Single Hotel Property Configuration</span>
            </div>
            <h3 className="text-lg font-black text-gray-900">Hotel Profile & Brand Information</h3>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Hotel Official Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#a67c32]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Property Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Front Desk Direct Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Reservations Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#a67c32]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                GSTIN / Tax Identification
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#a67c32]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Standard Room GST (%)
              </label>
              <input
                type="number"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#a67c32]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Check-in Starting Time
              </label>
              <input
                type="text"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Check-out Deadline Time
              </label>
              <input
                type="text"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#a67c32] hover:bg-[#8e6826] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database Integration & Persistence Architecture */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
          <Database className="w-4 h-4" />
          <span>Database Engine & State Management</span>
        </div>
        <h3 className="text-lg font-black text-gray-900">Database & System Storage</h3>
        <p className="text-xs text-gray-500">
          The application uses browser durable key-value persistence with structured schemas for rooms, bookings, staff, reviews, and hotel master records. Ready for seamless cloud database binding.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export JSON backup */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <Download className="w-4 h-4 text-blue-600" />
                <span>Export System Data Backup</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Download a complete JSON snapshot containing all 26 room states, active reservations, guest reviews, and staff registers.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="mt-3 px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup JSON</span>
            </button>
          </div>

          {/* Reset Factory Seed */}
          <div className="p-4 bg-red-50/50 rounded-xl border border-red-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                <RotateCcw className="w-4 h-4 text-[#a67c32]" />
                <span>Restore Default Factory Seed</span>
              </div>
              <p className="text-[11px] text-red-700/80 mt-1 leading-relaxed">
                Reset all sample reservations, initial room configurations, and seed test data back to original state.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Reset entire hotel state to default seed data?')) {
                  resetToFactoryDefaults();
                }
              }}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Factory Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
