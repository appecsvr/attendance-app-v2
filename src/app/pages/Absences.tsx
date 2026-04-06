import { useMemo, useState } from "react";
import { useAttendance } from "../context/AttendanceContext";
import {
  UserX,
  Plus,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Trash2,
} from "lucide-react";

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

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
    setFeedback(null);

    if (!formData.name || !formData.reason || !formData.date) {
      setFeedback({
        type: "error",
        message: "Please complete employee name, date, and reason.",
      });
      return;
    }

    const result = addAbsence({
      name: formData.name.trim(),
      reason: formData.reason.trim(),
      date: formData.date,
    });

    if (!result.success) {
      setFeedback({
        type: "error",
        message: result.message,
      });
      return;
    }

    setFeedback({
      type: "success",
      message: result.message,
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
        <h1 className="text-3xl font-bold text-slate-900">Absence Records</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage manual absence entries by month
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <UserX className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Add Absence</h2>
            </div>

            {feedback && (
              <div
                className={`mb-4 rounded-lg border px-3 py-3 text-sm flex items-start gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

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
                  placeholder="Official reason for absence..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Save Absence
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
                    View and manage absence records by month
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Saved Absence Records</h2>
                <p className="text-sm text-slate-500">
                  {selectedMonth === "all"
                    ? "Showing all saved absences"
                    : `Showing records for ${formatMonthLabel(selectedMonth)}`}
                </p>
              </div>
            </div>

            {filteredAbsences.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">No absence records found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAbsences.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{record.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{record.date}</p>
                        <p className="text-sm text-slate-700 mt-2">{record.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}