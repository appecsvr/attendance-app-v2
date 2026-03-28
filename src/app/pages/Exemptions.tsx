import { useState } from "react";
import { ShieldCheck, Plus } from "lucide-react";
import { useAttendance } from "../context/AttendanceContext";

export function Exemptions() {
  const { exemptions, addExemption } = useAttendance();

  const [formData, setFormData] = useState({
    name: "",
    reason: "",
    minutesLate: "",
    date: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.reason || !formData.minutesLate || !formData.date) {
      return;
    }

    addExemption({
      name: formData.name,
      reason: formData.reason,
      minutesLate: parseInt(formData.minutesLate),
      date: formData.date,
    });

    setFormData({
      name: "",
      reason: "",
      minutesLate: "",
      date: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Late Exemptions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage excused late arrivals and formal exemptions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Add Exemption</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dela Cruz, Juan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Minutes Late
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15"
                    value={formData.minutesLate}
                    onChange={(e) =>
                      setFormData({ ...formData, minutesLate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Official reason for exemption..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Save Exemption
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {exemptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 h-full flex flex-col justify-center items-center">
              <ShieldCheck className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-lg font-medium text-slate-900">No exemptions recorded</p>
              <p className="text-sm text-slate-400 mt-1">
                Use the form to add an approved exemption.
              </p>
            </div>
          ) : (
            exemptions.map((record) => (
              <div
                key={record.id}
                className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex gap-4"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>

                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold uppercase">
                  {record.name.substring(0, 2)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{record.name}</h3>
                      <p className="text-sm text-slate-500">{record.date}</p>
                    </div>

                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                      {record.minutesLate} mins excused
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100">
                    <span className="font-semibold text-slate-900">Reason:</span>{" "}
                    {record.reason}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}