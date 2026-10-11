import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { StaffMember } from '../../types/hotel';
import { Users, UserPlus, Phone, Mail, Clock, ShieldCheck, Trash2, X } from 'lucide-react';

export const StaffManager: React.FC = () => {
  const { staff, addStaffMember, updateStaffStatus, deleteStaffMember } = useHotel();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Front Desk Associate');
  const [shift, setShift] = useState<'Morning' | 'Evening' | 'Night' | 'General'>('Morning');
  const [phone, setPhone] = useState('+91 98110 ');
  const [email, setEmail] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addStaffMember({
      name,
      role,
      shift,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@grandregalhotel.com`,
      status: 'active'
    });

    setIsAddModalOpen(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-gray-900">
            Hotel Staff & Role-Based Access (RBAC)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage front desk executives, housekeeping staff, duty managers, and concierge.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#a67c32]" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">{member.name}</h4>
                  <div className="text-xs font-bold text-[#a67c32] mt-0.5">{member.role}</div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    member.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {member.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Shift: </span>
                  <span className="font-semibold text-gray-900">{member.shift}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <select
                value={member.status}
                onChange={(e) => updateStaffStatus(member.id, e.target.value as any)}
                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
              >
                <option value="active">Active Duty</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={() => {
                  if (confirm(`Remove ${member.name} from staff directory?`)) {
                    deleteStaffMember(member.id);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                title="Remove staff"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 sm:px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-base text-gray-900">Add Staff Member</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 sm:p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikas Sharma"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#a67c32]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Designation / Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium"
                  >
                    <option value="Front Desk Associate">Front Desk Associate</option>
                    <option value="Front Desk Supervisor">Front Desk Supervisor</option>
                    <option value="Housekeeping Attendant">Housekeeping Attendant</option>
                    <option value="Executive Housekeeper">Executive Housekeeper</option>
                    <option value="F&B Service Executive">F&B Service Executive</option>
                    <option value="Duty Manager">Duty Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Duty Shift
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium"
                  >
                    <option value="Morning">Morning (07:00 - 15:30)</option>
                    <option value="Evening">Evening (15:00 - 23:30)</option>
                    <option value="Night">Night (23:00 - 07:30)</option>
                    <option value="General">General (09:00 - 18:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Staff Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@grandregalhotel.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#a67c32] hover:bg-[#8e6826] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
