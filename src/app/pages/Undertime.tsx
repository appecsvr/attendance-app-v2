import { useMemo, useState } from "react";
import { Timer, Zap, Plus, CalendarDays, Trash2 } from "lucide-react";
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

export function Undertime() {
  const {
    generatedUndertimes,
    manualUndertimes,
    addUndertime,
    deleteManualUndertimesByMonth,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<"generated" | "manual">("generated");

  const [formData, setFormData] = useState({
    name: "",
    reason: "",
    date: "",
    fromTime: "",
    toTime: "",
    period: "AM",
  });

  const generatedMonthOptions = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(generatedUndertimes.map((record) => getMonthKey(record.date)))
    );
    return uniqueMonths.sort((a, b) => b.localeCompare(a));
  }, [generatedUndertimes]);

  const manualMonthOptions = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(manualUndertimes.map((record) => getMonthKey(record.date)))
    );
    return uniqueMonths.sort((a, b) => b.localeCompare(a));
  }, [manualUndertimes]);

  const [generatedMonth, setGeneratedMonth] = useState<string>("all");
  const [manualMonth, setManualMonth] = useState<string>("all");

  const filteredGeneratedUndertimes = useMemo(() => {
    const filtered =
      generatedMonth === "all"
        ? generatedUndertimes
        : generatedUndertimes.filter((record) => getMonthKey(record.date) === generatedMonth);

    return [...filtered].sort(
      (a, b) => getSafeDate(b.date).getTime() - getSafeDate(a.date).getTime()
    );
  }, [generatedUndertimes, generatedMonth]);

  const filteredManualUndertimes = useMemo(() => {
    const filtered =
      manualMonth === "all"
        ? manualUndertimes
        : manualUndertimes.filter((record) => getMonthKey(record.date) === manualMonth);

    return [...filtered].sort(
      (a, b) => getSafeDate(b.date).getTime() - getSafeDate(a.date).getTime()
    );
  }, [manualUndertimes, manualMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.reason ||
      !formData.date ||
      !formData.fromTime ||
      !formData.toTime
    ) {
      return;
    }

    const undertimeHours = `${formData.fromTime} ${formData.period} to ${formData.toTime} ${formData.period}`;

    addUndertime({
      name: formData.name,
      reason: formData.reason,
      date: formData.date,
      undertimeHours,
    });

    setManualMonth(getMonthKey(formData.date));

    setFormData({
      name: "",
      reason: "",
      date: "",
      fromTime: "",
      toTime: "",
      period: "AM",
    });

    setActiveTab("manual");
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Undertime Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            View undertime records by month
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("generated")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === "generated"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Zap className="w-4 h-4" /> System Generated
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === "manual"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Timer className="w-4 h-4" /> Manual Entry
          </button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === "generated" ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-purple-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Detected from Excel</h2>
                  <p className="text-xs text-slate-500">
                    Filter generated undertime by month
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={generatedMonth}
                  onChange={(e) => setGeneratedMonth(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Months</option>
                  {generatedMonthOptions.map((month) => (
                    <option key={month} value={month}>
                      {formatMonthLabel(month)}
                    </option>
                  ))}
                </select>

                <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                  {filteredGeneratedUndertimes.length} Records
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {filteredGeneratedUndertimes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGeneratedUndertimes.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 rounded-xl border border-purple-100 bg-white hover:border-purple-300 transition-colors shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <h3 className="font-bold text-slate-900">{record.name}</h3>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded whitespace-nowrap">
                          Undertime
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mt-3">
                        Date:{" "}
                        <span className="font-medium">
                          {getSafeDate(record.date).toLocaleDateString("en-US")}
                        </span>
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Time Log: <span className="font-medium">{record.timeIn}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
                  <Zap className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-slate-600">No generated undertime</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {generatedMonth === "all"
                      ? "Upload a valid Excel file to detect undertime records."
                      : `No generated undertime found for ${formatMonthLabel(generatedMonth)}.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Timer className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Add Undertime</h2>
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Undertime Hours
                    </label>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          From
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 1:00"
                          value={formData.fromTime}
                          onChange={(e) =>
                            setFormData({ ...formData, fromTime: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          To
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 5:00"
                          value={formData.toTime}
                          onChange={(e) =>
                            setFormData({ ...formData, toTime: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Period
                      </label>
                      <select
                        value={formData.period}
                        onChange={(e) =>
                          setFormData({ ...formData, period: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Reason
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Reason for undertime..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Save Entry
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
                        View and manage manual undertime by month
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={manualMonth}
                      onChange={(e) => setManualMonth(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Months</option>
                      {manualMonthOptions.map((month) => (
                        <option key={month} value={month}>
                          {formatMonthLabel(month)}
                        </option>
                      ))}
                    </select>

                    {manualMonth !== "all" && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete all manual undertime records for ${formatMonthLabel(
                                manualMonth
                              )}?`
                            )
                          ) {
                            deleteManualUndertimesByMonth(manualMonth);
                            setManualMonth("all");
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

              {filteredManualUndertimes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 h-full flex flex-col justify-center items-center">
                  <Timer className="w-16 h-16 text-slate-200 mb-4" />
                  <p className="text-lg font-medium text-slate-900">No manual undertime entries</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {manualMonth === "all"
                      ? "Use the form to add a manual undertime record."
                      : `No manual undertime found for ${formatMonthLabel(manualMonth)}.`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-slate-500 px-1">
                    Showing{" "}
                    <span className="font-semibold text-slate-900">
                      {filteredManualUndertimes.length}
                    </span>{" "}
                    record(s)
                    {manualMonth !== "all" && (
                      <>
                        {" "}for{" "}
                        <span className="font-semibold text-slate-900">
                          {formatMonthLabel(manualMonth)}
                        </span>
                      </>
                    )}
                  </div>

                  {filteredManualUndertimes.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{record.name}</h3>
                          <p className="text-sm text-slate-500">
                            {getSafeDate(record.date).toLocaleDateString("en-US")}
                          </p>
                        </div>

                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 text-right">
                          {record.undertimeHours}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-slate-700 border-t border-slate-100 pt-3">
                        <p>
                          <span className="font-semibold">Undertime Hours:</span>{" "}
                          {record.undertimeHours}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold">Reason:</span> {record.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}