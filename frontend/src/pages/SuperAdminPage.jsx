import { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import { SuperAdminDashboard } from "../components/outlineSuperAdmin/SuperAdminDashboard";
import { Database } from "lucide-react";

function formatAmount(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function SuperAdminPage() {
  const [showDbSection, setShowDbSection] = useState(false);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/api/admin/overview")
      .then((payload) => {
        if (active) setOverview(payload);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <SuperAdminDashboard />

      {/* QUICK AUDIT TOGGLE STRIP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowDbSection(!showDbSection)}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Database size={14} />
            <span>{showDbSection ? "Hide Database Audit Records" : "View Live Database Audit Records"}</span>
          </button>
        </div>

        {/* OPTIONAL LIVE POSTGRES AUDIT TABLES */}
        {showDbSection && (
          <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#a67c32]" />
              <span>Live PostgreSQL Cloud Database Records</span>
            </h2>

            {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

            {overview && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Bookings</span>
                    <div className="text-xl font-black text-gray-900">{overview.stats?.bookings || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Registered Customers</span>
                    <div className="text-xl font-black text-gray-900">{overview.stats?.customers || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recorded Gross Revenue</span>
                    <div className="text-xl font-black text-emerald-600">{formatAmount(overview.stats?.revenue)}</div>
                  </div>
                </div>

                {overview.staff && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Privileged Staff Accounts ({overview.staff.length})
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                          <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {overview.staff.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="p-3 font-semibold text-gray-900">{s.name}</td>
                              <td className="p-3 text-gray-600">{s.email}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  s.role === "super_admin"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {s.role}
                                </span>
                              </td>
                              <td className="p-3 text-gray-500">{s.createdAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
