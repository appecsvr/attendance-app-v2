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
  selectedMonth: string;
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
  monthOptions: string[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addExemption: (ex: Omit<Exemption, "id">) => {
    success: boolean;
    message: string;
  };
  addAbsence: (ab: Omit<AbsentRecord, "id">) => void;
  addUndertime: (ut: Omit<UndertimeRecord, "id">) => void;
  deleteUploadedFile: (fileId: string) => void;
  clearAllAttendanceHistory: () => void;
  deleteAbsencesByMonth: (monthKey: string) => void;
  deleteExemptionsByMonth: (monthKey: string) => void;
  deleteManualUndertimesByMonth: (monthKey: string) => void;
  markAllMemoAlertsAsRead: () => void;
  exportBackup: () => void;
  importBackupFile: (file: File) => Promise<{ success: boolean; message: string }>;
  exportFilteredWorkbook: () => { success: boolean; message: string };
}

const AttendanceContext = createContext<AttendanceState | undefined>(undefined);

const STORAGE_KEY = "attendance-system-v4";
const BACKUP_VERSION = "1.0.0";

type BackupPayload = PersistedAttendanceData & {
  backupVersion: string;
  exportedAt: string;
};

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

function getMonthKey(dateValue: string) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getDefaultStoredData(): PersistedAttendanceData {
  return {
    fileName: "",
    uploadedFiles: [],
    exemptions: [],
    absences: [],
    manualUndertimes: [],
    readMemoEmployeeNames: [],
    selectedMonth: "all",
  };
}

function getStoredData(): PersistedAttendanceData {
  if (typeof window === "undefined") {
    return getDefaultStoredData();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return getDefaultStoredData();
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
      selectedMonth: parsed.selectedMonth ?? "all",
    };
  } catch {
    return getDefaultStoredData();
  }
}

function makeDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsText(file);
  });
}

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const initialData = getStoredData();

  const [fileName, setFileName] = useState(initialData.fileName);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedAttendanceFile[]>(
    initialData.uploadedFiles
  );
  const [exemptionsState, setExemptions] = useState<Exemption[]>(initialData.exemptions);
  const [absencesState, setAbsences] = useState<AbsentRecord[]>(initialData.absences);
  const [manualUndertimesState, setManualUndertimes] = useState<UndertimeRecord[]>(
    initialData.manualUndertimes
  );
  const [readMemoEmployeeNames, setReadMemoEmployeeNames] = useState<string[]>(
    initialData.readMemoEmployeeNames
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialData.selectedMonth || "all"
  );

  useEffect(() => {
    const payload: PersistedAttendanceData = {
      fileName,
      uploadedFiles,
      exemptions: exemptionsState,
      absences: absencesState,
      manualUndertimes: manualUndertimesState,
      readMemoEmployeeNames,
      selectedMonth,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    fileName,
    uploadedFiles,
    exemptionsState,
    absencesState,
    manualUndertimesState,
    readMemoEmployeeNames,
    selectedMonth,
  ]);

  const rawLateRecords = useMemo(() => {
    const allRawLateRecords = uploadedFiles.flatMap((file) => file.lateRecords);

    if (allRawLateRecords.length === 0) return [];

    const exemptionCountMap = new Map<string, number>();

    exemptionsState.forEach((ex) => {
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
  }, [uploadedFiles, exemptionsState]);

  const rawGeneratedUndertimes = useMemo(() => {
    return uploadedFiles
      .flatMap((file) => file.generatedUndertimes)
      .sort((a, b) => {
        const aDate = new Date(`${a.date} ${a.timeIn}`).getTime();
        const bDate = new Date(`${b.date} ${b.timeIn}`).getTime();
        return bDate - aDate;
      });
  }, [uploadedFiles]);

  const monthOptions = useMemo(() => {
    const allMonths = new Set<string>();

    rawLateRecords.forEach((record) => allMonths.add(getMonthKey(record.date)));
    rawGeneratedUndertimes.forEach((record) => allMonths.add(getMonthKey(record.date)));
    exemptionsState.forEach((record) => allMonths.add(getMonthKey(record.date)));
    absencesState.forEach((record) => allMonths.add(getMonthKey(record.date)));
    manualUndertimesState.forEach((record) => allMonths.add(getMonthKey(record.date)));

    return Array.from(allMonths).sort((a, b) => b.localeCompare(a));
  }, [
    rawLateRecords,
    rawGeneratedUndertimes,
    exemptionsState,
    absencesState,
    manualUndertimesState,
  ]);

  useEffect(() => {
    if (selectedMonth !== "all" && !monthOptions.includes(selectedMonth)) {
      setSelectedMonth("all");
    }
  }, [monthOptions, selectedMonth]);

  const lateRecords = useMemo(() => {
    if (selectedMonth === "all") return rawLateRecords;
    return rawLateRecords.filter((record) => getMonthKey(record.date) === selectedMonth);
  }, [rawLateRecords, selectedMonth]);

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
    if (selectedMonth === "all") return rawGeneratedUndertimes;
    return rawGeneratedUndertimes.filter(
      (record) => getMonthKey(record.date) === selectedMonth
    );
  }, [rawGeneratedUndertimes, selectedMonth]);

  const exemptions = useMemo(() => {
    if (selectedMonth === "all") return exemptionsState;
    return exemptionsState.filter((record) => getMonthKey(record.date) === selectedMonth);
  }, [exemptionsState, selectedMonth]);

  const absences = useMemo(() => {
    if (selectedMonth === "all") return absencesState;
    return absencesState.filter((record) => getMonthKey(record.date) === selectedMonth);
  }, [absencesState, selectedMonth]);

  const manualUndertimes = useMemo(() => {
    if (selectedMonth === "all") return manualUndertimesState;
    return manualUndertimesState.filter(
      (record) => getMonthKey(record.date) === selectedMonth
    );
  }, [manualUndertimesState, selectedMonth]);

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
        setFileName(file.name);

        const uploadedMonth = parsedLateRecords[0]?.date || parsedGeneratedUndertime[0]?.date;
        if (uploadedMonth) {
          setSelectedMonth(getMonthKey(uploadedMonth));
        }

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

    const matchingLateRecords = rawLateRecords.filter(
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

    const sameExemptionExists = exemptionsState.some(
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
    setSelectedMonth(getMonthKey(ex.date));

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
    setSelectedMonth(getMonthKey(ab.date));
  };

  const addUndertime = (ut: Omit<UndertimeRecord, "id">) => {
    const newUndertime: UndertimeRecord = {
      ...ut,
      id: createId(),
    };

    setManualUndertimes((prev) => [newUndertime, ...prev]);
    setSelectedMonth(getMonthKey(ut.date));
  };

  const deleteUploadedFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const updatedFiles = prev.filter((file) => file.id !== fileId);
      setFileName(updatedFiles.length > 0 ? updatedFiles[0].fileName : "");
      return updatedFiles;
    });
  };

  const clearAllAttendanceHistory = () => {
    setFileName("");
    setUploadedFiles([]);
    setReadMemoEmployeeNames([]);
    setSelectedMonth("all");
  };

  const deleteAbsencesByMonth = (monthKey: string) => {
    setAbsences((prev) =>
      prev.filter((record) => getMonthKey(record.date) !== monthKey)
    );
  };

  const deleteExemptionsByMonth = (monthKey: string) => {
    setExemptions((prev) =>
      prev.filter((record) => getMonthKey(record.date) !== monthKey)
    );
  };

  const deleteManualUndertimesByMonth = (monthKey: string) => {
    setManualUndertimes((prev) =>
      prev.filter((record) => getMonthKey(record.date) !== monthKey)
    );
  };

  const markAllMemoAlertsAsRead = () => {
    const uniqueNames = Array.from(new Set(memoAlerts.map((item) => item.name.trim())));
    setReadMemoEmployeeNames((prev) => Array.from(new Set([...prev, ...uniqueNames])));
  };

  const exportBackup = () => {
    const payload: BackupPayload = {
      backupVersion: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      fileName,
      uploadedFiles,
      exemptions: exemptionsState,
      absences: absencesState,
      manualUndertimes: manualUndertimesState,
      readMemoEmployeeNames,
      selectedMonth,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const stamp = new Date().toISOString().slice(0, 10);
    makeDownload(blob, `attendance-backup-${stamp}.json`);
  };

  const importBackupFile = async (file: File) => {
    try {
      const text = await readFileAsText(file);
      const parsed = JSON.parse(text) as Partial<BackupPayload>;

      if (!Array.isArray(parsed.uploadedFiles)) {
        return {
          success: false,
          message: "Invalid backup file. Uploaded files are missing.",
        };
      }

      setFileName(parsed.fileName ?? "");
      setUploadedFiles(parsed.uploadedFiles ?? []);
      setExemptions(parsed.exemptions ?? []);
      setAbsences(parsed.absences ?? []);
      setManualUndertimes(parsed.manualUndertimes ?? []);
      setReadMemoEmployeeNames(parsed.readMemoEmployeeNames ?? []);
      setSelectedMonth(parsed.selectedMonth ?? "all");

      return {
        success: true,
        message: `Backup imported successfully from ${file.name}.`,
      };
    } catch (error) {
      console.error("Backup import failed:", error);
      return {
        success: false,
        message: "Backup import failed. Please use a valid JSON backup file.",
      };
    }
  };

  const exportFilteredWorkbook = () => {
    try {
      const workbook = XLSX.utils.book_new();

      const lateRows = lateRecords.map((record) => ({
        Employee: record.name,
        Date: record.date,
        TimeIn: record.timeIn,
        MinutesLate: record.minutesLate,
        SecondsLate: record.secondsLate,
        SourceFile: record.sourceFileName,
      }));

      const summaryRows = lateSummary.map((item) => ({
        Employee: item.name,
        TotalLates: item.totalLates,
        TotalMinutesLate: item.totalMinutesLate,
      }));

      const exemptionRows = exemptions.map((item) => ({
        Employee: item.name,
        Date: item.date,
        Reason: item.reason,
      }));

      const absenceRows = absences.map((item) => ({
        Employee: item.name,
        Date: item.date,
        Reason: item.reason,
      }));

      const generatedUndertimeRows = generatedUndertimes.map((item) => ({
        Employee: item.name,
        Date: item.date,
        TimeIn: item.timeIn,
        SourceFile: item.sourceFileName,
      }));

      const manualUndertimeRows = manualUndertimes.map((item) => ({
        Employee: item.name,
        Date: item.date,
        Hours: item.undertimeHours,
        Reason: item.reason,
      }));

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(lateRows.length ? lateRows : [{ Message: "No data" }]),
        "Late Records"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(summaryRows.length ? summaryRows : [{ Message: "No data" }]),
        "Late Summary"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(exemptionRows.length ? exemptionRows : [{ Message: "No data" }]),
        "Exemptions"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(absenceRows.length ? absenceRows : [{ Message: "No data" }]),
        "Absences"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          generatedUndertimeRows.length ? generatedUndertimeRows : [{ Message: "No data" }]
        ),
        "System Undertime"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          manualUndertimeRows.length ? manualUndertimeRows : [{ Message: "No data" }]
        ),
        "Manual Undertime"
      );

      const suffix = selectedMonth === "all" ? "all-months" : selectedMonth;
      XLSX.writeFile(workbook, `attendance-report-${suffix}.xlsx`);

      return {
        success: true,
        message: "Excel report exported successfully.",
      };
    } catch (error) {
      console.error("Excel export failed:", error);
      return {
        success: false,
        message: "Excel export failed. Please try again.",
      };
    }
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
        monthOptions,
        selectedMonth,
        setSelectedMonth,
        handleFileUpload,
        addExemption,
        addAbsence,
        addUndertime,
        deleteUploadedFile,
        clearAllAttendanceHistory,
        deleteAbsencesByMonth,
        deleteExemptionsByMonth,
        deleteManualUndertimesByMonth,
        markAllMemoAlertsAsRead,
        exportBackup,
        importBackupFile,
        exportFilteredWorkbook,
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