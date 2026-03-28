import { useState } from "react";
import { UserX, Plus } from "lucide-react";
import { useAttendance } from "../context/AttendanceContext";

export function Absences() {
  const { absences, addAbsence } = useAttendance();

  const [formData, setFormData] = useState({
    name: "",
    reason: "",
    date: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.reason || !formData.date) {
      return;
    }

    addAbsence({
      name: formData.name,
      reason: formData.reason,
      date: formData.date,
    });

    setFormData({
      name: "",
      reason: "",
      date: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Absences</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track and manage employee absences and leaves
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <UserX className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Log Absence</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Santos, Maria"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Reason for absence..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Save Record
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {absences.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 h-full flex flex-col justify-center items-center">
              <UserX className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-lg font-medium text-slate-900">No absences recorded</p>
              <p className="text-sm text-slate-400 mt-1">
                Use the form to add a new absence record.
              </p>
            </div>
          ) : (
            absences.map((record) => (
              <div
                key={record.id}
                className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex flex-col items-center justify-center flex-shrink-0 border border-red-100">
                  <span className="text-xs font-bold uppercase">
                    {new Date(record.date).toLocaleString("default", {
                      month: "short",
                    })}
                  </span>
                  <span className="text-lg font-black leading-none">
                    {new Date(record.date).getDate()}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900">{record.name}</h3>
                  <div className="mt-2 text-sm text-slate-600">{record.reason}</div>
                </div>

                <div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium border border-slate-200">
                    Absence
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}