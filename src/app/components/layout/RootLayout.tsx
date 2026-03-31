import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard,
  Clock,
  ShieldCheck,
  UserX,
  Timer,
  UploadCloud,
  Bell,
  Users,
  AlertTriangle,
  CheckCheck,
} from "lucide-react";
import { useAttendance } from "../../context/AttendanceContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Late Records", href: "/lates", icon: Clock },
  { name: "Exemptions", href: "/exemptions", icon: ShieldCheck },
  { name: "Absences", href: "/absences", icon: UserX },
  { name: "Undertime", href: "/undertime", icon: Timer },
];

export function RootLayout() {
  const location = useLocation();
  const {
    fileName,
    memoAlerts,
    unreadMemoCount,
    markAllMemoAlertsAsRead,
  } = useAttendance();

  const [isBellOpen, setIsBellOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 fixed inset-y-0 z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900">TimeCore</span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3 mt-4">
            Menu
          </div>

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-3">
          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-indigo-900">
                  Current File
                </p>
                <p className="text-xs text-indigo-700 truncate">
                  {fileName || "None selected"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Memo Reminders
                </p>
                <p className="text-xs text-amber-700">
                  {memoAlerts.length > 0
                    ? `${memoAlerts.length} employee(s) due for memo review`
                    : "No memo reminders yet"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-end px-6 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsBellOpen((prev) => !prev)}
                className="relative text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Bell className="w-5 h-5" />

                {unreadMemoCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMemoCount}
                  </span>
                )}
              </button>

              {isBellOpen && (
                <div className="absolute right-0 mt-3 w-[360px] bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Memo Notifications
                      </p>
                      <p className="text-xs text-slate-500">
                        Employees with 4 lates and above
                      </p>
                    </div>

                    {memoAlerts.length > 0 && (
                      <button
                        onClick={markAllMemoAlertsAsRead}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        <CheckCheck className="w-4 h-4" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {memoAlerts.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-medium text-slate-700">
                          No memo alerts yet
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Notifications will appear here once an employee reaches 4 lates.
                        </p>
                      </div>
                    ) : (
                      memoAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`px-4 py-4 border-b border-slate-100 last:border-b-0 ${
                            alert.isRead ? "bg-white" : "bg-amber-50/60"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center ${
                                alert.isRead
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {alert.name}
                                </p>
                                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                                  {alert.totalLates} lates
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 mt-1 leading-5">
                                {alert.message}
                              </p>

                              <p className="text-[11px] text-slate-500 mt-2">
                                Total late minutes: {alert.totalMinutesLate}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-sm font-bold">
              HR
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}