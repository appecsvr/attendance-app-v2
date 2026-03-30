import React, { createContext, useContext, useState, type ReactNode } from "react";
import * as XLSX from "xlsx";

export interface LateRecord {
  id: string;
  name: string;
  date: string;
  timeIn: string;
  minutesLate: number;
  secondsLate: number;
  totalSecondsLate: number;
}

export interface LateSummary {
  name: string;
  totalLates: number;
  totalMinutesLate: number;
}

export interface GeneratedUndertime {
  id: string;
  name: string;
  date: string;
  timeIn: string;
}

export interface Exemption {
  id: string;
  name: string;
  reason: string;
  date: string;
  minutesLate?: number;
}

export interface AbsentRecord {
  id: string;
  name: string;
  date: string;
  reason: string;
}

export interface UndertimeRecord {
  id: string;
  name: string;
  date: string;
  reason: string;
  minutesEarly: number;
}

interface AttendanceState {
  fileName: string;
  lateRecords: LateRecord[];
  lateSummary: LateSummary[];
  generatedUndertimes: GeneratedUndertime[];
  exemptions: Exemption[];
  absences: AbsentRecord[];
  manualUndertimes: UndertimeRecord[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addExemption: (ex: Omit<Exemption, "id">) => {
    success: boolean;
    message: string;
  };
  addAbsence: (ab: Omit<AbsentRecord, "id">) => void;
  addUndertime: (ut: Omit<UndertimeRecord, "id">) => void;
}

const AttendanceContext = createContext<AttendanceState | undefined>(undefined);

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [fileName, setFileName] = useState("");
  const [lateRecords, setLateRecords] = useState<LateRecord[]>([]);
  const [lateSummary, setLateSummary] = useState<LateSummary[]>([]);
  const [generatedUndertimes, setGeneratedUndertimes] = useState<GeneratedUndertime[]>([]);
  const [exemptions, setExemptions] = useState<Exemption[]>([]);
  const [absences, setAbsences] = useState<AbsentRecord[]>([]);
  const [manualUndertimes, setManualUndertimes] = useState<UndertimeRecord[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        const allLateRecords: LateRecord[] = [];
        const allGeneratedUndertime: GeneratedUndertime[] = [];
        const lateCount: Record<string, { lates: number; minutes: number }> = {};

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          for (let i = 4; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row[2] || !row[4]) continue;

            const name = String(row[2]).trim();
            const dateTime = new Date(row[4]);
            if (Number.isNaN(dateTime.getTime())) continue;

            const dayOfWeek = dateTime.getDay();
            const hours = dateTime.getHours();
            const minutes = dateTime.getMinutes();
            const seconds = dateTime.getSeconds();
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;

            let isLate = false;
            let isUndertime = false;
            let minutesLate = 0;
            let secondsLate = 0;
            let totalSecondsLateValue = 0;

            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              const officialTime = 8 * 3600;
              const graceThreshold = 8 * 3600 + 5 * 60;

              const exactHourUndertime =
                minutes === 0 &&
                seconds === 0 &&
                (hours === 9 || hours === 10 || hours === 11);

              const afternoonUndertime =
                totalSeconds >= 12 * 3600 && totalSeconds <= 17 * 3600;

              if (exactHourUndertime || afternoonUndertime) {
                isUndertime = true;
              } else if (totalSeconds > graceThreshold) {
                isLate = true;
                totalSecondsLateValue = totalSeconds - officialTime;
                minutesLate = Math.floor(totalSecondsLateValue / 60);
                secondsLate = totalSecondsLateValue % 60;
              }
            } else if (dayOfWeek === 6) {
              const officialTime = 7 * 3600;
              const graceThreshold = 7 * 3600 + 5 * 60;

              const exactHourUndertime =
                minutes === 0 &&
                seconds === 0 &&
                (hours === 8 || hours === 9 || hours === 10 || hours === 11);

              const afternoonUndertime =
                totalSeconds >= 12 * 3600 && totalSeconds <= 17 * 3600;

              if (exactHourUndertime || afternoonUndertime) {
                isUndertime = true;
              } else if (totalSeconds > graceThreshold) {
                isLate = true;
                totalSecondsLateValue = totalSeconds - officialTime;
                minutesLate = Math.floor(totalSecondsLateValue / 60);
                secondsLate = totalSecondsLateValue % 60;
              }
            }

            const timeIn = dateTime.toLocaleTimeString("en-US");
            const dateStr = dateTime.toLocaleDateString("en-US");
            const id = Math.random().toString(36).slice(2, 11);

            if (isUndertime) {
              allGeneratedUndertime.push({
                id,
                name,
                date: dateStr,
                timeIn,
              });
            } else if (isLate) {
              allLateRecords.push({
                id,
                name,
                date: dateStr,
                timeIn,
                minutesLate,
                secondsLate,
                totalSecondsLate: totalSecondsLateValue,
              });

              if (!lateCount[name]) {
                lateCount[name] = { lates: 0, minutes: 0 };
              }

              lateCount[name].lates += 1;
              lateCount[name].minutes += minutesLate;
            }
          }
        });

        const summary: LateSummary[] = Object.entries(lateCount)
          .map(([name, stats]) => ({
            name,
            totalLates: stats.lates,
            totalMinutesLate: stats.minutes,
          }))
          .sort((a, b) => b.totalLates - a.totalLates);

        setLateRecords(allLateRecords);
        setGeneratedUndertimes(allGeneratedUndertime);
        setLateSummary(summary);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Error reading Excel file. Please check the format.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const addExemption = (ex: Omit<Exemption, "id">) => {
    const exemptionDate = new Date(ex.date).toLocaleDateString("en-US");
    const normalizedExemptionName = ex.name.trim().toLowerCase();

    const matchingLateRecords = lateRecords.filter(
      (record) =>
        record.name.trim().toLowerCase() === normalizedExemptionName &&
        record.date === exemptionDate
    );

    if (matchingLateRecords.length === 0) {
      return {
        success: false,
        message: "No matching late record found for this employee and date.",
      };
    }

    const newExemption: Exemption = {
      ...ex,
      id: Math.random().toString(36).slice(2, 11),
    };

    setExemptions((prev) => [newExemption, ...prev]);

    setLateRecords((prevLateRecords) =>
      prevLateRecords.filter(
        (record) =>
          !(
            record.name.trim().toLowerCase() === normalizedExemptionName &&
            record.date === exemptionDate
          )
      )
    );

    setLateSummary((prevSummary) => {
      const removedCount = matchingLateRecords.length;
      const removedMinutes = matchingLateRecords.reduce(
        (sum, record) => sum + record.minutesLate,
        0
      );

      return prevSummary
        .map((item) => {
          if (item.name.trim().toLowerCase() === normalizedExemptionName) {
            return {
              ...item,
              totalLates: Math.max(0, item.totalLates - removedCount),
              totalMinutesLate: Math.max(0, item.totalMinutesLate - removedMinutes),
            };
          }
          return item;
        })
        .filter((item) => item.totalLates > 0);
    });

    return {
      success: true,
      message: "Exemption saved successfully.",
    };
  };

  const addAbsence = (ab: Omit<AbsentRecord, "id">) => {
    setAbsences((prev) => [
      { ...ab, id: Math.random().toString(36).slice(2, 11) },
      ...prev,
    ]);
  };

  const addUndertime = (ut: Omit<UndertimeRecord, "id">) => {
    setManualUndertimes((prev) => [
      { ...ut, id: Math.random().toString(36).slice(2, 11) },
      ...prev,
    ]);
  };

  return (
    <AttendanceContext.Provider
      value={{
        fileName,
        lateRecords,
        lateSummary,
        generatedUndertimes,
        exemptions,
        absences,
        manualUndertimes,
        handleFileUpload,
        addExemption,
        addAbsence,
        addUndertime,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
};