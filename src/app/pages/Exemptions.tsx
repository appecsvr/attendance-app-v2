import { useMemo, useState } from "react";
import {
  ShieldCheck,
  Plus,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Trash2,
} from "lucide-react";
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

export function Exemptions() {
  const { exemptions, addExemption, deleteExemptionsByMonth } = useAttendance();

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
    const uniqueMonths = Array.from(new Set(exemptions.map((record) => getMonthKey(record.date))));
    return uniqueMonths.sort((a, b) => b.localeCompare(a));
  }, [exemptions]);

  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const filteredExemptions = useMemo(() => {
    const filtered =
      selectedMonth === "all"
        ? exemptions
        : exemptions.filter((record) => getMonthKey(record.date) === selectedMonth);

    return [...filtered].sort(
      (a, b) => getSafeDate(b.date).getTime() - getSafeDate(a.date).getTime()
    );
  }, [exemptions, selectedMonth]);

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

    const result = addExemption({
      name: formData.name,
      reason: formData.reason,
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
        <h1 className="text-3xl font-bold text-slate-900">Late Exemptions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage excused late arrivals by month
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Month Filter</p>
                  <p className="text-xs text-slate-500">
                    View and manage exemptions by month
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
                          `Delete all exemption records for ${formatMonthLabel(selectedMonth)}?`
                        )
                      ) {
                        deleteExemptionsByMonth(selectedMonth);
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

          {filteredExemptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 h-full flex flex-col justify-center items-center">
              <ShieldCheck className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-lg font-medium text-slate-900">No exemptions recorded</p>
              <p className="text-sm text-slate-400 mt-1">
                {selectedMonth === "all"
                  ? "Use the form to add an approved exemption."
                  : `No exemption records found for ${formatMonthLabel(selectedMonth)}.`}
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-slate-500 px-1">
                Showing <span className="font-semibold text-slate-900">{filteredExemptions.length}</span>{" "}
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

              {filteredExemptions.map((record) => {
                const recordDate = getSafeDate(record.date);

                return (
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
                          <p className="text-sm text-slate-500">
                            {recordDate.toLocaleDateString("en-US")}
                          </p>
                        </div>

                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                          Exempted
                        </span>
                      </div>

                      <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100">
                        <span className="font-semibold text-slate-900">Reason:</span>{" "}
                        {record.reason}
                      </div>
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