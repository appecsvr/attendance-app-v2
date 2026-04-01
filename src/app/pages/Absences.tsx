import { useMemo, useState } from "react";
import { UserX, Plus, CalendarDays, Trash2 } from "lucide-react";
import { useAttendance } from "../context/AttendanceContext";

function getSafeDate(dateValue: string) {
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? new Date(`${dateValue}T00:00:00`) : parsed;
}

function getMonthKey(dateValue: string) {
  const date = getSafeDate(dateValue);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function Absences() {
  const { absences, addAbsence, deleteAbsencesByMonth } = useAttendance();

  const [formData, setFormData] = useState({
    name: "",
    reason: "",
    date: "",
  });

  const monthOptions = useMemo(() => {
    const uniqueMonths = Array.from(new Set(absences.map((record) => getMonthKey(record.date))));
    return uniqueMonths.sort((a, b) => b.localeCompare(a));
  }, [absences]);

  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const filteredAbsences = useMemo(() => {
    const filtered =
      selectedMonth === "all"
        ? absences
        : absences.filter((record) => getMonthKey(record.date) === selectedMonth);

    return [...filtered].sort(
      (a, b) => getSafeDate(b.date).getTime() - getSafeDate(a.date).getTime()
    );
  }, [absences, selectedMonth]);

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

    setSelectedMonth(getMonthKey(formData.date));

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
          Track and manage employee absences by month
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
                  placeholder="e.g. Dela Cruz, Juan"
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Month Filter</p>
                  <p className="text-xs text-slate-500">
                    View and manage records by month
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Months</option>
                  {monthOptions.map((month) => (
                    <option key={month} value={month}>
                      {formatMonthLabel(month)}
                    </option>
                  ))}
                </select>

                {selectedMonth !== "all" && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete all absence records for ${formatMonthLabel(selectedMonth)}?`
                        )
                      ) {
                        deleteAbsencesByMonth(selectedMonth);
                        setSelectedMonth("all");
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete This Month
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredAbsences.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 h-full flex flex-col justify-center items-center">
              <UserX className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-lg font-medium text-slate-900">No absences recorded</p>
              <p className="text-sm text-slate-400 mt-1">
                {selectedMonth === "all"
                  ? "Use the form to add a new absence record."
                  : `No absence records found for ${formatMonthLabel(selectedMonth)}.`}
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-slate-500 px-1">
                Showing <span className="font-semibold text-slate-900">{filteredAbsences.length}</span>{" "}
                record(s)
                {selectedMonth !== "all" && (
                  <>
                    {" "}for{" "}
                    <span className="font-semibold text-slate-900">
                      {formatMonthLabel(selectedMonth)}
                    </span>
                  </>
                )}
              </div>

              {filteredAbsences.map((record) => {
                const recordDate = getSafeDate(record.date);

                return (
                  <div
                    key={record.id}
                    className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex flex-col items-center justify-center flex-shrink-0 border border-red-100">
                      <span className="text-xs font-bold uppercase">
                        {recordDate.toLocaleString("default", { month: "short" })}
                      </span>
                      <span className="text-lg font-black leading-none">
                        {recordDate.getDate()}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900">{record.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {recordDate.toLocaleDateString("en-US")}
                      </p>
                      <div className="mt-2 text-sm text-slate-600">{record.reason}</div>
                    </div>

                    <div>
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium border border-slate-200">
                        Absence
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}