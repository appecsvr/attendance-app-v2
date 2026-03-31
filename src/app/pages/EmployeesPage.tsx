import { useMemo, useState } from "react";
import { useAttendance } from "../context/AttendanceContext";

type EmployeeRow = {
  fullName: string;
  employmentStatus: string;
  lateExemptionsCount: number;
  absenceCount: number;
  latesCount: number;
  totalUndertime: number;
};

function formatMinutes(minutes: number) {
  if (!minutes || minutes <= 0) return "0 min";

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min`;
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
          employmentStatus: "Present",
          lateExemptionsCount: 0,
          absenceCount: 0,
          latesCount: 0,
          totalUndertime: 0,
        });
      }

      return map.get(cleanName)!;
    };

    // LATES
    lateRecords.forEach((late) => {
      const employee = ensureEmployee(late.name);
      if (!employee) return;

      employee.latesCount += 1;
      employee.employmentStatus = "Late";
    });

    // EXEMPTIONS
    exemptions.forEach((item) => {
      const employee = ensureEmployee(item.name);
      if (!employee) return;

      employee.lateExemptionsCount += 1;
      employee.employmentStatus = "Excused Late";
    });

    // ABSENCES
    absences.forEach((item) => {
      const employee = ensureEmployee(item.name);
      if (!employee) return;

      employee.absenceCount += 1;
      employee.employmentStatus = "Absent";
    });

    // GENERATED UNDERTIME
    generatedUndertimes.forEach((item) => {
      const employee = ensureEmployee(item.name);
      if (!employee) return;

      employee.totalUndertime += 1;

      if (employee.employmentStatus === "Present") {
        employee.employmentStatus = "Undertime";
      }
    });

    // MANUAL UNDERTIME
    manualUndertimes.forEach((item) => {
      const employee = ensureEmployee(item.name);
      if (!employee) return;

      const hours = Number(item.undertimeHours || 0);
      employee.totalUndertime += hours * 60;

      if (employee.employmentStatus === "Present") {
        employee.employmentStatus = "Undertime";
      }
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
    if (!keyword) return employees;

    return employees.filter((emp) =>
      emp.fullName.toLowerCase().includes(keyword)
    );
  }, [employees, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
          <p className="text-sm text-slate-500">
            Summary of employee attendance activity
          </p>
        </div>

        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-500 md:w-80"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Total Employees</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {employees.length}
          </h2>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">With Lates</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {employees.filter((e) => e.latesCount > 0).length}
          </h2>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">With Absences</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {employees.filter((e) => e.absenceCount > 0).length}
          </h2>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">With Exemptions</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {employees.filter((e) => e.lateExemptionsCount > 0).length}
          </h2>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Full Name</th>
                <th className="px-4 py-3 font-semibold">Employment Status</th>
                <th className="px-4 py-3 font-semibold">Late Exemptions</th>
                <th className="px-4 py-3 font-semibold">Absence Count</th>
                <th className="px-4 py-3 font-semibold">Lates Count</th>
                <th className="px-4 py-3 font-semibold">Total Undertime</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.fullName}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {emp.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {emp.employmentStatus}
                  </td>
                  <td className="px-4 py-3">{emp.lateExemptionsCount}</td>
                  <td className="px-4 py-3">{emp.absenceCount}</td>
                  <td className="px-4 py-3">{emp.latesCount}</td>
                  <td className="px-4 py-3">
                    {formatMinutes(emp.totalUndertime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}