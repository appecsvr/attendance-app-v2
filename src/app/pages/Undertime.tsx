import { useMemo, useState } from "react";
import { useAttendance } from "../context/AttendanceContext";
import {
  Clock3,
  Plus,
  CalendarDays,
  Timer,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from "lucide-react";

function getMonthKey(dateValue: string) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
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
    restoreManualUndertime,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<"system" | "manual">("manual");
  const [employeeName, setEmployeeName] = useState("");
  const [date, setDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [period, setPeriod] = useState("AM");
  const [reason, setReason] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();

    manualUndertimes.forEach((record) => {
      months.add(getMonthKey(record.date));
    });

    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [manualUndertimes]);

  const filteredManualUndertimes = useMemo(() => {
    const filtered =
      selectedMonth === "all"
        ? manualUndertimes
        : manualUndertimes.filter((record) => getMonthKey(record.date) === selectedMonth);

    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [manualUndertimes, selectedMonth]);

  const handleSave = () => {
    if (!employeeName.trim() || !date || !fromTime.trim() || !toTime.trim() || !reason.trim()) {
      setFeedback({
        type: "error",
        message: "Please complete all manual undertime fields.",
      });
      return;
    }

    const undertimeHours = `${fromTime} to ${toTime} ${period}`;

    const result = addUndertime({
      name: employeeName.trim(),
      date,
      reason: reason.trim(),
      undertimeHours,
    });

    setFeedback({
      type: result.success ? "success" : "error",
      message: result.message,
    });

    if (result.success) {
      setEmployeeName("");
      setDate("");
      setFromTime("");
      setToTime("");
      setPeriod("AM");
      setReason("");
      setSelectedMonth(getMonthKey(date));
    }
  };

  const handleRestore = (id: string, name: string, dateValue: string) => {
    if (
      window.confirm(
        `Restore ${name} on ${new Date(dateValue).toLocaleDateString("en-US")} back to Late Records?`
      )
    ) {
      restoreManualUndertime(id);
      setFeedback({
        type: "success",
        message: `${name} has been restored to Late Records.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col lg:flex-row">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Undertime Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            View system-detected undertime and add manual undertime adjustments.
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-white border border-slate-200 p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("system")}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              activeTab === "system"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            System Generated
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              activeTab === "manual"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-4 flex items-start gap-3 ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold">System Message</p>
            <p className="text-sm mt-1">{feedback.message}</p>
          </div>
        </div>
      )}

      {activeTab === "system" ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">System Generated Undertime</h3>

          {generatedUndertimes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No system-generated undertime records yet.
            </div>
          ) : (
            <div className="space-y-3">
              {generatedUndertimes.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{record.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {record.date} • {record.timeIn}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Source file: {record.sourceFileName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Clock3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Undertime</h3>
                <p className="text-sm text-slate-500">
                  date will exclude that late record.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Employee Name
                </label>
                <input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="e.g. Dela Cruz, Juan"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Undertime Hours
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    placeholder="From"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    placeholder="To"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for undertime..."
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Save Entry
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Manual Undertime Records</h3>
                  <p className="text-sm text-slate-500">
                    View and manage manual undertime by month.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
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
                          `Delete all manual undertime records for ${formatMonthLabel(selectedMonth)}?`
                        )
                      ) {
                        deleteManualUndertimesByMonth(selectedMonth);
                        setSelectedMonth("all");
                        setFeedback({
                          type: "success",
                          message: `All manual undertime records for ${formatMonthLabel(selectedMonth)} were removed and restored to Late Records.`,
                        });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete This Month
                  </button>
                )}
              </div>
            </div>

            {filteredManualUndertimes.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
                <Timer className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-semibold text-slate-700">
                  No manual undertime entries
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Use the form to add a manual undertime record.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredManualUndertimes.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{record.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{record.date}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Undertime Hours: {record.undertimeHours}
                        </p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-3">
                        <div className="text-sm text-slate-600">{record.reason}</div>

                        <button
                          onClick={() =>
                            handleRestore(record.id, record.name, record.date)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}