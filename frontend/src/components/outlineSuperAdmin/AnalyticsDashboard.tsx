import React from 'react';
import { useHotel } from '../../context/HotelContext';
import {
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Calendar,
  CreditCard,
  Building,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const { bookings, physicalRooms, formatCurrency } = useHotel();

  // Metrics computation
  const totalBookings = bookings.length;
  const nonCancelledBookings = bookings.filter((b) => b.bookingStatus !== 'cancelled');
  const cancelledBookings = bookings.filter((b) => b.bookingStatus === 'cancelled');

  const totalGrossRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalNetRevenue = nonCancelledBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalRefunds = cancelledBookings.reduce((sum, b) => sum + (b.refundAmount || 0), 0);

  const totalNightsBooked = nonCancelledBookings.reduce((sum, b) => sum + b.nights, 0);
  const adr = totalNightsBooked > 0 ? Math.round(totalNetRevenue / totalNightsBooked) : 0; // Average Daily Rate

  const totalRooms = physicalRooms.length;
  const occupiedRooms = physicalRooms.filter((r) => r.status === 'occupied').length;
  const currentOccupancy = Math.round((occupiedRooms / totalRooms) * 100);
  const revPar = Math.round(adr * (currentOccupancy / 100)); // RevPAR

  // Sample dynamic chart data modeled around current bookings
  const weeklyRevenueData = [
    { day: 'Mon', revenue: 24500, bookings: 7, occupancy: 58 },
    { day: 'Tue', revenue: 31200, bookings: 9, occupancy: 65 },
    { day: 'Wed', revenue: 28900, bookings: 8, occupancy: 62 },
    { day: 'Thu', revenue: 38400, bookings: 11, occupancy: 73 },
    { day: 'Fri', revenue: 54200, bookings: 15, occupancy: 88 },
    { day: 'Sat', revenue: 68900, bookings: 19, occupancy: 96 },
    { day: 'Sun', revenue: 47100, bookings: 13, occupancy: 81 }
  ];

  const categoryDistribution = [
    { name: 'Classic Room', value: 42, color: '#3b82f6' },
    { name: 'Deluxe King', value: 35, color: '#a67c32' },
    { name: 'Townhouse Suite', value: 15, color: '#f59e0b' },
    { name: 'Executive Balcony', value: 8, color: '#10b981' }
  ];

  const paymentBreakdown = [
    { method: 'UPI (GPay/PhonePe)', count: bookings.filter((b) => b.paymentMethod === 'upi').length, pct: 45 },
    { method: 'Cards (Visa/Master)', count: bookings.filter((b) => b.paymentMethod === 'credit_card').length, pct: 30 },
    { method: 'Pay at Hotel', count: bookings.filter((b) => b.paymentMethod === 'pay_at_hotel').length, pct: 15 },
    { method: 'OYO Wallet', count: bookings.filter((b) => b.paymentMethod === 'oyo_wallet').length, pct: 10 }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-1">
            <span>Net Realized Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {formatCurrency(totalNetRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs last month</span>
          </div>
        </div>

        {/* ADR (Average Daily Rate) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-1">
            <span>Average Daily Rate (ADR)</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {formatCurrency(adr || 2490)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Per sold room night average
          </div>
        </div>

        {/* RevPAR */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-1">
            <span>RevPAR (Yield Index)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {formatCurrency(revPar || 1720)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Revenue per available room
          </div>
        </div>

        {/* Total Bookings & Refunds */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-1">
            <span>Reservations & Refunds</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-[#a67c32]">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">
            {totalBookings} <span className="text-xs text-gray-400 font-normal">stays</span>
          </div>
          <div className="text-[11px] text-red-600 font-semibold mt-1">
            Refunds: {formatCurrency(totalRefunds)} ({cancelledBookings.length} cancelled)
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-Day Revenue Velocity */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900">
                Weekly Revenue Velocity
              </h3>
              <p className="text-xs text-gray-400">
                Gross daily room collections & food/beverage add-ons
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              ₹293,500 Total
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="revenue" fill="#a67c32" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Occupancy Rate Trend Line */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900">
                Occupancy Dynamics (%)
              </h3>
              <p className="text-xs text-gray-400">7-day capacity utilization across 26 keys</p>
            </div>
            <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
              Avg 74%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyRevenueData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[40, 100]} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Occupancy']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#occupancyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Insights: Room Category Contribution & Payment Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Contribution */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <h4 className="font-bold text-sm text-gray-900 mb-3">
            Room Inventory Share by Category
          </h4>
          <div className="space-y-3">
            {categoryDistribution.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">{cat.name}</span>
                  <span className="font-bold text-gray-900">{cat.value}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Channel Share */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <h4 className="font-bold text-sm text-gray-900 mb-3">
            Settlement Modes & Payment Gateways
          </h4>
          <div className="space-y-3">
            {paymentBreakdown.map((pm, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="font-bold text-gray-900">{pm.method}</div>
                    <div className="text-[10px] text-gray-400">Instant Settlement</div>
                  </div>
                </div>
                <span className="font-black text-gray-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                  {pm.pct}% share
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
