import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as XLSX from "xlsx";

export interface LateRecord {
  id: string;
  name: string;
  date: string;
  timeIn: string;
  minutesLate: number;
  secondsLate: number;
  totalSecondsLate: number;
  sourceFileId: string;
  sourceFileName: string;
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
  sourceFileId: string;
  sourceFileName: string;
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
  undertimeHours: string;
}

export interface MemoAlert {
  id: string;
  name: string;
  totalLates: number;
  totalMinutesLate: number;
  message: string;
  isRead: boolean;
}

export interface UploadedAttendanceFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  lateRecords: LateRecord[];
  generatedUndertimes: GeneratedUndertime[];
}

interface PersistedAttendanceData {
  fileName: string;
  uploadedFiles: UploadedAttendanceFile[];
  exemptions: Exemption[];
  absences: AbsentRecord[];
  manualUndertimes: UndertimeRecord[];
  readMemoEmployeeNames: string[];
}

interface AttendanceState {
  fileName: string;
  uploadedFiles: UploadedAttendanceFile[];
  lateRecords: LateRecord[];
  lateSummary: LateSummary[];
  generatedUndertimes: GeneratedUndertime[];
  exemptions: Exemption[];
  absences: AbsentRecord[];
  manualUndertimes: UndertimeRecord[];
  memoAlerts: MemoAlert[];
  unreadMemoCount: number;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addExemption: (ex: Omit<Exemption, "id">) => {
    success: boolean;
    message: string;
  };
  addAbsence: (ab: Omit<AbsentRecord, "id">) => void;
  addUndertime: (ut: Omit<UndertimeRecord, "id">) => void;
  deleteUploadedFile: (fileId: string) => void;
  clearAllAttendanceHistory: () => void;
  markAllMemoAlertsAsRead: () => void;
}

const AttendanceContext = createContext<AttendanceState | undefined>(undefined);

const STORAGE_KEY = "attendance-system-v3";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US");
}

function makeRecordKey(name: string, date: string, timeIn: string) {
  return `${normalizeName(name)}|${date}|${timeIn}`;
}

function getStoredData(): PersistedAttendanceData {
  if (typeof window === "undefined") {
    return {
      fileName: "",
      uploadedFiles: [],
      exemptions: [],
      absences: [],
      manualUndertimes: [],
      readMemoEmployeeNames: [],
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {
      fileName: "",
      uploadedFiles: [],
      exemptions: [],
      absences: [],
      manualUndertimes: [],
      readMemoEmployeeNames: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedAttendanceData>;

    return {
      fileName: parsed.fileName ?? "",
      uploadedFiles: parsed.uploadedFiles ?? [],
      exemptions: parsed.exemptions ?? [],
      absences: parsed.absences ?? [],
      manualUndertimes: parsed.manualUndertimes ?? [],
      readMemoEmployeeNames: parsed.readMemoEmployeeNames ?? [],
    };
  } catch {
    return {
      fileName: "",
      uploadedFiles: [],
      exemptions: [],
      absences: [],
      manualUndertimes: [],
      readMemoEmployeeNames: [],
    };
  }
}

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const initialData = getStoredData();

  const [fileName, setFileName] = useState(initialData.fileName);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedAttendanceFile[]>(
    initialData.uploadedFiles
  );
  const [exemptions, setExemptions] = useState<Exemption[]>(initialData.exemptions);
  const [absences, setAbsences] = useState<AbsentRecord[]>(initialData.absences);
  const [manualUndertimes, setManualUndertimes] = useState<UndertimeRecord[]>(
    initialData.manualUndertimes
  );
  const [readMemoEmployeeNames, setReadMemoEmployeeNames] = useState<string[]>(
    initialData.readMemoEmployeeNames
  );

  useEffect(() => {
    const payload: PersistedAttendanceData = {
      fileName,
      uploadedFiles,
      exemptions,
      absences,
      manualUndertimes,
      readMemoEmployeeNames,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    fileName,
    uploadedFiles,
    exemptions,
    absences,
    manualUndertimes,
    readMemoEmployeeNames,
  ]);

  const lateRecords = useMemo(() => {
    const allRawLateRecords = uploadedFiles.flatMap((file) => file.lateRecords);

    if (allRawLateRecords.length === 0) return [];

    const exemptionCountMap = new Map<string, number>();

    exemptions.forEach((ex) => {
      const exemptionDate = normalizeDate(ex.date);
      const key = `${normalizeName(ex.name)}|${exemptionDate}`;
      exemptionCountMap.set(key, (exemptionCountMap.get(key) ?? 0) + 1);
    });

    const consumedExemptions = new Map<string, number>();

    return allRawLateRecords.filter((record) => {
      const key = `${normalizeName(record.name)}|${record.date}`;
      const allowedExemptions = exemptionCountMap.get(key) ?? 0;
      const alreadyConsumed = consumedExemptions.get(key) ?? 0;

      if (alreadyConsumed < allowedExemptions) {
        consumedExemptions.set(key, alreadyConsumed + 1);
        return false;
      }

      return true;
    });
  }, [uploadedFiles, exemptions]);

  const lateSummary = useMemo<LateSummary[]>(() => {
    const lateCount: Record<string, { lates: number; minutes: number }> = {};

    lateRecords.forEach((record) => {
      const cleanName = record.name.trim();

      if (!lateCount[cleanName]) {
        lateCount[cleanName] = { lates: 0, minutes: 0 };
      }

      lateCount[cleanName].lates += 1;
      lateCount[cleanName].minutes += record.minutesLate;
    });

    return Object.entries(lateCount)
      .map(([name, stats]) => ({
        name,
        totalLates: stats.lates,
        totalMinutesLate: stats.minutes,
      }))
      .sort((a, b) => {
        if (b.totalLates !== a.totalLates) return b.totalLates - a.totalLates;
        return b.totalMinutesLate - a.totalMinutesLate;
      });
  }, [lateRecords]);

  const generatedUndertimes = useMemo(() => {
    return uploadedFiles
      .flatMap((file) => file.generatedUndertimes)
      .sort((a, b) => {
        const aDate = new Date(`${a.date} ${a.timeIn}`).getTime();
        const bDate = new Date(`${b.date} ${b.timeIn}`).getTime();
        return bDate - aDate;
      });
  }, [uploadedFiles]);

  const memoAlerts = useMemo<MemoAlert[]>(() => {
    const readSet = new Set(readMemoEmployeeNames.map((name) => normalizeName(name)));

    return lateSummary
      .filter((item) => item.totalLates >= 4)
      .map((item) => ({
        id: `memo-${normalizeName(item.name)}`,
        name: item.name,
        totalLates: item.totalLates,
        totalMinutesLate: item.totalMinutesLate,
        message: `${item.name} has already reached ${item.totalLates} lates and is due for memo / penalty review.`,
        isRead: readSet.has(normalizeName(item.name)),
      }))
      .sort((a, b) => b.totalLates - a.totalLates);
  }, [lateSummary, readMemoEmployeeNames]);

  const unreadMemoCount = memoAlerts.filter((item) => !item.isRead).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        const newFileId = createId();
        const parsedLateRecords: LateRecord[] = [];
        const parsedGeneratedUndertime: GeneratedUndertime[] = [];

        const allExistingLateKeys = new Set(
          uploadedFiles.flatMap((uploadedFile) =>
            uploadedFile.lateRecords.map((record) =>
              makeRecordKey(record.name, record.date, record.timeIn)
            )
          )
        );

        const allExistingUndertimeKeys = new Set(
          uploadedFiles.flatMap((uploadedFile) =>
            uploadedFile.generatedUndertimes.map((record) =>
              makeRecordKey(record.name, record.date, record.timeIn)
            )
          )
        );

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          for (let i = 4; i < jsonData.length; i += 1) {
            const row = jsonData[i];
            if (!row?.[2] || !row?.[4]) continue;

            const name = String(row[2]).trim();
            const dateTime = new Date(row[4]);

            if (!name || Number.isNaN(dateTime.getTime())) continue;

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
              const lateStart = 8 * 3600 + 6 * 60;

              const exactHourUndertime =
                minutes === 0 &&
                seconds === 0 &&
                (hours === 9 || hours === 10 || hours === 11);

              const afternoonUndertime =
                totalSeconds >= 12 * 3600 && totalSeconds <= 17 * 3600;

              if (exactHourUndertime || afternoonUndertime) {
                isUndertime = true;
              } else if (totalSeconds >= lateStart) {
                isLate = true;
                totalSecondsLateValue = totalSeconds - officialTime;
                minutesLate = Math.floor(totalSecondsLateValue / 60);
                secondsLate = totalSecondsLateValue % 60;
              }
            } else if (dayOfWeek === 6) {
              const officialTime = 7 * 3600;
              const lateStart = 7 * 3600 + 6 * 60;

              const exactHourUndertime =
                minutes === 0 &&
                seconds === 0 &&
                (hours === 8 || hours === 9 || hours === 10 || hours === 11);

              const afternoonUndertime =
                totalSeconds >= 12 * 3600 && totalSeconds <= 17 * 3600;

              if (exactHourUndertime || afternoonUndertime) {
                isUndertime = true;
              } else if (totalSeconds >= lateStart) {
                isLate = true;
                totalSecondsLateValue = totalSeconds - officialTime;
                minutesLate = Math.floor(totalSecondsLateValue / 60);
                secondsLate = totalSecondsLateValue % 60;
              }
            }

            const timeIn = dateTime.toLocaleTimeString("en-US");
            const dateStr = dateTime.toLocaleDateString("en-US");
            const recordKey = makeRecordKey(name, dateStr, timeIn);

            if (isUndertime) {
              if (!allExistingUndertimeKeys.has(recordKey)) {
                allExistingUndertimeKeys.add(recordKey);
                parsedGeneratedUndertime.push({
                  id: createId(),
                  name,
                  date: dateStr,
                  timeIn,
                  sourceFileId: newFileId,
                  sourceFileName: file.name,
                });
              }
            } else if (isLate) {
              if (!allExistingLateKeys.has(recordKey)) {
                allExistingLateKeys.add(recordKey);
                parsedLateRecords.push({
                  id: createId(),
                  name,
                  date: dateStr,
                  timeIn,
                  minutesLate,
                  secondsLate,
                  totalSecondsLate: totalSecondsLateValue,
                  sourceFileId: newFileId,
                  sourceFileName: file.name,
                });
              }
            }
          }
        });

        const newUploadedFile: UploadedAttendanceFile = {
          id: newFileId,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          lateRecords: parsedLateRecords.sort((a, b) => {
            const aDate = new Date(`${a.date} ${a.timeIn}`).getTime();
            const bDate = new Date(`${b.date} ${b.timeIn}`).getTime();
            return bDate - aDate;
          }),
          generatedUndertimes: parsedGeneratedUndertime.sort((a, b) => {
            const aDate = new Date(`${a.date} ${a.timeIn}`).getTime();
            const bDate = new Date(`${b.date} ${b.timeIn}`).getTime();
            return bDate - aDate;
          }),
        };

        setUploadedFiles((prev) => [newUploadedFile, ...prev]);

        if (e.target) {
          e.target.value = "";
        }
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Error reading Excel file. Please check the format.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const addExemption = (ex: Omit<Exemption, "id">) => {
    const exemptionDate = normalizeDate(ex.date);
    const normalizedExemptionName = normalizeName(ex.name);

    const matchingLateRecords = lateRecords.filter(
      (record) =>
        normalizeName(record.name) === normalizedExemptionName &&
        record.date === exemptionDate
    );

    if (matchingLateRecords.length === 0) {
      return {
        success: false,
        message: "No matching active late record found for this employee and date.",
      };
    }

    const sameExemptionExists = exemptions.some(
      (item) =>
        normalizeName(item.name) === normalizedExemptionName &&
        normalizeDate(item.date) === exemptionDate &&
        item.reason.trim().toLowerCase() === ex.reason.trim().toLowerCase()
    );

    if (sameExemptionExists) {
      return {
        success: false,
        message: "This exemption appears to be already saved.",
      };
    }

    const newExemption: Exemption = {
      ...ex,
      id: createId(),
    };

    setExemptions((prev) => [newExemption, ...prev]);

    return {
      success: true,
      message: "Exemption saved successfully.",
    };
  };

  const addAbsence = (ab: Omit<AbsentRecord, "id">) => {
    const newAbsence: AbsentRecord = {
      ...ab,
      id: createId(),
    };

    setAbsences((prev) => [newAbsence, ...prev]);
  };

  const addUndertime = (ut: Omit<UndertimeRecord, "id">) => {
    const newUndertime: UndertimeRecord = {
      ...ut,
      id: createId(),
    };

    setManualUndertimes((prev) => [newUndertime, ...prev]);
  };

  const deleteUploadedFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const clearAllAttendanceHistory = () => {
    setFileName("");
    setUploadedFiles([]);
    setReadMemoEmployeeNames([]);
  };

  const markAllMemoAlertsAsRead = () => {
    const uniqueNames = Array.from(new Set(memoAlerts.map((item) => item.name.trim())));
    setReadMemoEmployeeNames(uniqueNames);
  };

  return (
    <AttendanceContext.Provider
      value={{
        fileName,
        uploadedFiles,
        lateRecords,
        lateSummary,
        generatedUndertimes,
        exemptions,
        absences,
        manualUndertimes,
        memoAlerts,
        unreadMemoCount,
        handleFileUpload,
        addExemption,
        addAbsence,
        addUndertime,
        deleteUploadedFile,
        clearAllAttendanceHistory,
        markAllMemoAlertsAsRead,
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