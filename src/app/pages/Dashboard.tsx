import { useState } from "react";
import { useAttendance } from "../context/AttendanceContext";
import DragDropUpload from "../components/layout/DragDropUpload";
import {
  Upload,
  FileSpreadsheet,
  Users,
  Clock,
  Timer,
  ShieldAlert,
  BarChart3,
  Bell,
  AlertTriangle,
  Trash2,
  FolderOpen,
  CalendarRange,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatMonthLabel(monthKey: string) {
  if (monthKey === "all") return "All Months";

  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatDayLabel(dayValue: string) {
  if (dayValue === "all") return "All Dates";

  return new Date(dayValue).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

export function Dashboard() {
  const {
    handleFileUpload,
    fileName,
    uploadedFiles,
    lateRecords,
    lateSummary,
    generatedUndertimes,
    absences,
    exemptions,
    manualUndertimes,
    memoAlerts,
    unreadMemoCount,
    deleteUploadedFile,
    clearAllAttendanceHistory,
    selectedMonthScope,
    selectedDayScope,
    exportFilteredWorkbook,
  } = useAttendance();

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const topLates = [...lateSummary].slice(0, 5);

  const filterLabel =
    selectedDayScope !== "all"
      ? formatDayLabel(selectedDayScope)
      : selectedMonthScope !== "all"
      ? formatMonthLabel(selectedMonthScope)
      : "All Records";

  const handleExcelExport = () => {
    const result = exportFilteredWorkbook();
    setFeedback({
      type: result.success ? "success" : "error",
      message: result.message,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of employee attendance, stored records, uploaded files, and memo alerts
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          <CalendarRange className="w-4 h-4" />
          Current report scope: {filterLabel}
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
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">System Message</p>
            <p className="text-sm mt-1">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl p-10 border border-slate-200 border-dashed shadow-sm text-center">
          <div className="flex flex-col items-center justify-center space-y-5">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900">Upload Attendance Data</h3>
              <p className="text-sm text-slate-500 max-w-xl mx-auto mt-2">
                Import daily biometric Excel files. Each upload is saved separately and can also be deleted separately.
              </p>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-sm transition-all">
              <Upload className="w-4 h-4" />
              Browse Files
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {fileName && (
              <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100">
                {fileName} loaded successfully
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Reports</h3>
              <p className="text-sm text-slate-500">
                Export the current report scope to Excel.
              </p>
            </div>
          </div>

          <button
            onClick={handleExcelExport}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel Report
          </button>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Current export scope</p>
            <p className="mt-1">
              The Excel export follows your selected report scope:
              <span className="font-semibold"> {filterLabel}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Uploaded Attendance Files</h3>
              <p className="text-sm text-slate-500">
                You can delete one file only, or clear all attendance history.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm("Clear all uploaded attendance history?")) {
                clearAllAttendanceHistory();
                setFeedback({
                  type: "success",
                  message: "All uploaded attendance history and related records were cleared.",
                });
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All History
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {uploadedFiles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No uploaded attendance files yet.
            </div>
          ) : (
            uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4 flex-col sm:flex-row"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Uploaded: {new Date(file.uploadedAt).toLocaleString("en-US")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {file.lateRecords.length} late record(s) • {file.generatedUndertimes.length} undertime record(s)
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${file.fileName}?`)) {
                      deleteUploadedFile(file.id);
                      setFeedback({
                        type: "success",
                        message:
                          "Uploaded file deleted. Related exemption, absence, and manual undertime records for removed dates were also cleaned.",
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-red-200 bg-white text-red-700 hover:bg-red-50 font-medium whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete File
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {memoAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-col lg:flex-row">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-amber-900">Penalty Reminder</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Employees who reached 4 lates and above are now visible in the notification bell.
                </p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-white border border-amber-200 text-sm font-semibold text-amber-800">
              {unreadMemoCount} unread alert(s)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
            {memoAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-2xl border border-amber-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{alert.name}</p>
                      <p className="text-xs text-slate-500">
                        {alert.totalMinutesLate} total late minutes
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">
                    {alert.totalLates} lates
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-3">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Total Late Records",
            value: lateRecords.length,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-100",
          },
          {
            label: "Employees Late",
            value: lateSummary.length,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-100",
          },
          {
            label: "Undertime Cases",
            value: generatedUndertimes.length + manualUndertimes.length,
            icon: Timer,
            color: "text-purple-600",
            bg: "bg-purple-100",
          },
          {
            label: "Total Exceptions",
            value: absences.length + exemptions.length,
            icon: ShieldAlert,
            color: "text-red-600",
            bg: "bg-red-100",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-4xl font-bold text-slate-900 leading-none mt-1">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 min-h-[360px]">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Top 5 Most Frequent Lates
          </h3>

          {topLates.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={topLates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="totalLates" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-center text-slate-400">
              <div>
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-600">No chart data yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Upload attendance files to populate this chart.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Top Employees This Scope</h3>

          {topLates.length > 0 ? (
            <div className="space-y-3">
              {topLates.map((employee, index) => (
                <div
                  key={employee.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{employee.name}</p>
                      <p className="text-xs text-slate-500">
                        {employee.totalMinutesLate} total late minutes
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{employee.totalLates}</p>
                    <p className="text-xs text-slate-500">lates</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No employee late summary available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}