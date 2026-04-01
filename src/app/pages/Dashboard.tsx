import { useAttendance } from "../context/AttendanceContext";
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

export function Dashboard() {
  const {
    handleFileUpload,
    fileName,
    uploadedFiles,
    lateRecords,
    lateSummary,
    generatedUndertimes,
    absences,
    memoAlerts,
    unreadMemoCount,
    deleteUploadedFile,
    clearAllAttendanceHistory,
  } = useAttendance();

  const topLates = [...lateSummary].slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of employee attendance, stored records, uploaded files, and memo alerts
        </p>
      </div>

      <div className="bg-white rounded-3xl p-10 border border-slate-200 border-dashed shadow-sm text-center">
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
                <h3 className="text-lg font-bold text-amber-900">
                  Memo / Penalty Reminder
                </h3>
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
                      <p className="font-semibold text-slate-900 truncate">
                        {alert.name}
                      </p>
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
            value: generatedUndertimes.length,
            icon: Timer,
            color: "text-purple-600",
            bg: "bg-purple-100",
          },
          {
            label: "Total Absences",
            value: absences.length,
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
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={topLates}
                  margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalLates"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#2563EB" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400">
              <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
              <p>No data available to display chart</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 min-h-[360px]">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Quick Summary</h3>

          <div className="space-y-4">
            {topLates.length > 0 ? (
              topLates.map((person, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                      {i + 1}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {person.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {person.totalMinutesLate} mins total
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800">
                    {person.totalLates} lates
                  </span>
                </div>
              ))
            ) : (
              <div className="h-72 flex items-center justify-center text-sm text-slate-400">
                Upload a file to see rankings.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}