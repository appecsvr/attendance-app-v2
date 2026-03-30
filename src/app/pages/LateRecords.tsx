import { useState } from "react";
import { Clock, Search, AlertCircle } from "lucide-react";
import { useAttendance } from "../context/AttendanceContext";

export function LateRecords() {
  const { lateRecords, lateSummary } = useAttendance();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"detailed" | "summary">("detailed");

  const filteredRecords = lateRecords.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSummary = lateSummary.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                          <Clock className="w-3 h-3" /> {record.minutesLate > 0
  ? `${record.minutesLate} min ${record.secondsLate} sec`
  : `${record.secondsLate} sec`}
                        </span>
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
    </div>
  );
}