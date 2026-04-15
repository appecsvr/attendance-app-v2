import { useMemo, useState } from "react";
import { Clock, Search, AlertCircle, X } from "lucide-react";
import { useAttendance, type LateRecord } from "../context/AttendanceContext";

function getDefaultUndertimeStart(dateValue: string) {
  const day = new Date(dateValue).getDay();
  return day === 6 ? "7:00 AM" : "8:00 AM";
}

function getDefaultUndertimeRange(record: LateRecord) {
  return `${getDefaultUndertimeStart(record.date)} to ${record.timeIn}`;
}

export function LateRecords() {
  const { lateRecords, lateSummary, convertLateToUndertime } = useAttendance();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"detailed" | "summary">("detailed");
  const [selectedLateRecord, setSelectedLateRecord] = useState<LateRecord | null>(null);
  const [manualFromTime, setManualFromTime] = useState("");
  const [manualToTime, setManualToTime] = useState("");
  const [manualPeriod, setManualPeriod] = useState("AM");
  const [conversionReason, setConversionReason] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const filteredRecords = useMemo(
    () =>
      lateRecords.filter((r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [lateRecords, searchTerm]
  );

  const filteredSummary = useMemo(
    () =>
      lateSummary.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [lateSummary, searchTerm]
  );

  const resetModal = () => {
    setSelectedLateRecord(null);
    setManualFromTime("");
    setManualToTime("");
    setManualPeriod("AM");
    setConversionReason("");
  };

  const openUndertimeModal = (record: LateRecord) => {
    setSelectedLateRecord(record);
    setManualFromTime("");
    setManualToTime("");
    setManualPeriod("AM");
    setConversionReason("");
    setFeedback(null);
  };

  const handleConfirmUndertime = () => {
    if (!selectedLateRecord) return;

    const hasManualInput = manualFromTime.trim() || manualToTime.trim();

    if (hasManualInput && (!manualFromTime.trim() || !manualToTime.trim())) {
      setFeedback({
        type: "error",
        message: "Please complete both From and To fields for manual override.",
      });
      return;
    }

    const undertimeHours = hasManualInput
      ? `${manualFromTime.trim()} to ${manualToTime.trim()} ${manualPeriod}`
      : getDefaultUndertimeRange(selectedLateRecord);

    const result = convertLateToUndertime({
      lateRecordId: selectedLateRecord.id,
      undertimeHours,
      isManualOverride: Boolean(hasManualInput),
      reason: conversionReason.trim(),
    });

    setFeedback({
      type: result.success ? "success" : "error",
      message: result.message,
    });

    if (result.success) {
      resetModal();
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Late Arrivals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Detailed breakdown of late clock-ins based on shift rules
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("detailed")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "detailed"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Detailed Records
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "summary"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Summary View
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-4 ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="text-sm font-semibold">System Message</p>
          <p className="text-sm mt-1">{feedback.message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === "detailed" ? (
            filteredRecords.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">
                      Employee Name
                    </th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">
                      Date
                    </th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">
                      Time In
                    </th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-right">
                      Minutes Late
                    </th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                            {record.name.substring(0, 2)}
                          </div>
                          <span className="font-medium text-slate-900">{record.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-slate-600 text-sm">{record.date}</td>
                      <td className="py-3 px-6 text-slate-600 text-sm">{record.timeIn}</td>
                      <td className="py-3 px-6 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          {record.minutesLate > 0
                            ? `${record.minutesLate} min ${record.secondsLate} sec`
                            : `${record.secondsLate} sec`}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => openUndertimeModal(record)}
                          className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          Mark as Undertime
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-600">No records found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Upload a valid Excel file to view late arrivals.
                </p>
              </div>
            )
          ) : filteredSummary.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase">
                      {item.name.substring(0, 2)}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.totalLates} Lates
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Time Lost</span>
                    <span className="font-semibold text-slate-700">
                      {item.totalMinutesLate} mins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-600">No summary available</p>
              <p className="text-sm text-slate-400 mt-1">
                Upload a valid Excel file to generate summary.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedLateRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Convert Late Record to Undertime
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  This will remove the selected record from Late Records and move it to
                  Undertime.
                </p>
              </div>
              <button
                onClick={resetModal}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{selectedLateRecord.name}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedLateRecord.date} • {selectedLateRecord.timeIn}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Suggested Undertime Range
                </label>
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
                  {getDefaultUndertimeRange(selectedLateRecord)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Monday to Friday starts at 8:00 AM. Saturday starts at 7:00 AM.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Manual Override (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px] gap-3">
                  <input
                    value={manualFromTime}
                    onChange={(e) => setManualFromTime(e.target.value)}
                    placeholder="From (ex. 8:00)"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    value={manualToTime}
                    onChange={(e) => setManualToTime(e.target.value)}
                    placeholder="To (ex. 10:44:38)"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={manualPeriod}
                    onChange={(e) => setManualPeriod(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Leave this blank if you want to use the system-generated range.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  value={conversionReason}
                  onChange={(e) => setConversionReason(e.target.value)}
                  placeholder="e.g. Approved undertime conversion"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">
              <button
                onClick={resetModal}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUndertime}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Confirm Undertime
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}