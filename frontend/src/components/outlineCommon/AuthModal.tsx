import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { X, Smartphone, Mail, ArrowRight, Sparkles, CheckCircle2, Shield } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, showToast } = useHotel();

  const [inputVal, setInputVal] = useState('+91 98765 01234');
  const [userName, setUserName] = useState('Krishna Varun');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpVal, setOtpVal] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setStep('otp');
    setOtpVal('4291'); // Auto-fill demo OTP for ultra convenience
    showToast('Demo OTP sent: 4291 (Auto-filled)');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    login(inputVal, userName);
    setStep('input');
  };

  const handleFastDemoLogin = (role: 'guest' | 'hotel_admin' | 'super_admin') => {
    if (role === 'guest') {
      login('+91 98765 01234', 'Krishna Varun');
    } else if (role === 'hotel_admin') {
      login('meenakshi.s@grandregalhotel.com', 'Meenakshi Sundaram (Front Desk)');
    } else {
      login('abhishek.roy@grandregalhotel.com', 'Abhishek Roy (General Manager)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 relative">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="bg-gradient-to-r from-[#a67c32] to-[#7c5a1e] text-white p-6 pb-7">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white text-[#a67c32] font-black text-xl px-2 py-0.5 rounded-lg shadow-xs">
              SV
            </span>
            <span className="text-sm font-semibold tracking-wide text-red-100">
              SV Grand Luxury Rooms &bull; Tadipatri
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight">Login or Sign Up</h3>
          <p className="text-xs text-red-100 mt-1">
            Browse available rooms and make a direct reservation at SV Grand.
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'input' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Krishna Varun"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#a67c32] focus:border-transparent font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number or Email
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="+91 Mobile number or Email address"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#a67c32] focus:border-transparent font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#a67c32] hover:bg-[#8e6826] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-semibold">Or 1-Click Fast Login</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleFastDemoLogin('guest')}
                  className="px-3 py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Demo Guest</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFastDemoLogin('hotel_admin')}
                  className="px-3 py-2 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Front Desk Staff</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center py-2">
                <div className="inline-flex p-3 rounded-full bg-amber-50 text-[#a67c32] mb-2">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-gray-900">Enter Verification Code</h4>
                <p className="text-xs text-gray-500 mt-1">
                  We have sent a 4-digit code to <span className="font-semibold text-gray-800">{inputVal}</span>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={4}
                  value={otpVal}
                  onChange={(e) => setOtpVal(e.target.value)}
                  placeholder="4291"
                  className="w-full text-center tracking-[1em] text-2xl font-black py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#a67c32]"
                  required
                />
                <p className="text-[11px] text-center text-emerald-600 font-medium mt-1.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Demo OTP auto-filled (4291)</span>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#a67c32] hover:bg-[#8e6826] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Verify & Login</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-800 font-medium py-1"
              >
                &larr; Change mobile number / email
              </button>
            </form>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed">
            By logging in, you agree to OYO SV Grand Luxury Rooms&apos;s Guest Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
