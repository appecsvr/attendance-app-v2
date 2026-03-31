import { useMemo, useState } from "react";
import { useAttendance } from "../context/AttendanceContext";

type EmployeeRow = {
  fullName: string;
  lateExemptionsCount: number;
  absenceCount: number;
  latesCount: number;
  totalUndertime: number;
};

function formatMinutes(minutes: number) {
  if (!minutes || minutes <= 0) return "None";

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
  if (hrs > 0) return `${hrs} hr`;
  return `${mins} min`;
}

function formatCount(value: number) {
  return value > 0 ? value : "None";
}

export default function EmployeesPage() {
  const {
    lateRecords = [],
    exemptions = [],
    absences = [],
    generatedUndertimes = [],
    manualUndertimes = [],
  } = useAttendance();

  const [search, setSearch] = useState("");

  const employees = useMemo<EmployeeRow[]>(() => {
    const map = new Map<string, EmployeeRow>();

    const ensureEmployee = (name: string) => {
      const cleanName = name?.trim();
      if (!cleanName) return null;

      if (!map.has(cleanName)) {
        map.set(cleanName, {
          fullName: cleanName,
          lateExemptionsCount: 0,
          absenceCount: 0,
          latesCount: 0,
          totalUndertime: 0,
        });
      }

      return map.get(cleanName)!;
    };

    lateRecords.forEach((late) => {
      const employee = ensureEmployee(late.name);
      if (!employee) return;
      employee.latesCount += 1;
    });

    exemptions.forEach((item) => {
      const employee = ensureEmployee(item.name);
      if (!employee) return;
      employee.lateExemptionsCount += 1;
    });

    absences.forEach((item) => {
      const employee = ensureEmployee(item.name);
      if (!employee) return;
      employee.absenceCount += 1;
    });

    generatedUndertimes.forEach((item) => {
      const employee = ensureEmployee(item.name);
      if (!employee) return;
      employee.totalUndertime += 1;
    });

    manualUndertimes.forEach((item) => {
      const employee = ensureEmployee(item.name);
      if (!employee) return;

      const hours = Number(item.undertimeHours || 0);
      employee.totalUndertime += hours * 60;
    });

    return Array.from(map.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName)
    );
  }, [
    lateRecords,
    exemptions,
    absences,
    generatedUndertimes,
    manualUndertimes,
  ]);

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return [];

    return employees.filter((emp) =>
      emp.fullName.toLowerCase().includes(keyword)
    );
  }, [employees, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search employee records and attendance totals
          </p>
        </div>

        <div className="w-full lg:w-[360px]">
          <input
            type="text"
            placeholder="Search employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Employees</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {employees.length}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">With Lates</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {employees.filter((e) => e.latesCount > 0).length}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">With Absences</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {employees.filter((e) => e.absenceCount > 0).length}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">With Exemptions</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {employees.filter((e) => e.lateExemptionsCount > 0).length}
          </h2>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            Employee Search Result
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Search an employee to view attendance totals.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Full Name</th>
                <th className="px-5 py-3 font-semibold">Late Exemptions</th>
                <th className="px-5 py-3 font-semibold">Absence Count</th>
                <th className="px-5 py-3 font-semibold">Lates Count</th>
                <th className="px-5 py-3 font-semibold">Total Undertime</th>
              </tr>
            </thead>

            <tbody>
              {search.trim() === "" ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    Type an employee name in the search box to view records.
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    No employee found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.fullName}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {emp.fullName}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatCount(emp.lateExemptionsCount)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatCount(emp.absenceCount)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatCount(emp.latesCount)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatMinutes(emp.totalUndertime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}