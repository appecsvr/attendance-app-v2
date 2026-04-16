import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as XLSX from "xlsx";
import { useAuth } from "./AuthContext";

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
  sourceLateRecordId?: string;
  originalTimeIn?: string;
  sourceType?: "manual-entry" | "late-conversion";
  isManualOverride?: boolean;
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
  selectedMonthScope: string;
  selectedDayScope: string;
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
  monthScopeOptions: string[];
  dayScopeOptions: string[];
  selectedMonthScope: string;
  selectedDayScope: string;
  setSelectedMonthScope: (scope: string) => void;
  setSelectedDayScope: (scope: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addExemption: (ex: Omit<Exemption, "id">) => {
    success: boolean;
    message: string;
  };
  addAbsence: (ab: Omit<AbsentRecord, "id">) => {
    success: boolean;
    message: string;
  };
  addUndertime: (ut: Omit<UndertimeRecord, "id">) => {
    success: boolean;
    message: string;
  };
  convertLateToUndertime: (payload: {
    lateRecordId: string;
    undertimeHours: string;
    reason?: string;
    isManualOverride?: boolean;
  }) => {
    success: boolean;
    message: string;
  };
  deleteUploadedFile: (fileId: string) => void;
  clearAllAttendanceHistory: () => void;
  deleteAbsencesByMonth: (monthKey: string) => void;
  deleteExemptionsByMonth: (monthKey: string) => void;
  deleteManualUndertimesByMonth: (monthKey: string) => void;
  restoreExemption: (id: string) => void;
  restoreManualUndertime: (id: string) => void;
  markAllMemoAlertsAsRead: () => void;
  exportFilteredWorkbook: () => { success: boolean; message: string };
}

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

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatDayLabel(dayValue: string) {
  return new Date(dayValue).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

function getDefaultStoredData(): PersistedAttendanceData {
  return {
    fileName: "",
    uploadedFiles: [],
    exemptions: [],
    absences: [],
    manualUndertimes: [],
    readMemoEmployeeNames: [],
    selectedMonthScope: "all",
    selectedDayScope: "all",
  };
}

function buildStorageKey(workspace: string | null | undefined) {
  if (!workspace) return null;
  return `attendance-system-v6-${workspace}`;
}

function getStoredData(storageKey: string | null): PersistedAttendanceData {
  if (typeof window === "undefined" || !storageKey) {
    return getDefaultStoredData();
  }

  const raw = window.localStorage.getItem(storageKey);

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
      selectedMonthScope: parsed.selectedMonthScope ?? "all",
      selectedDayScope: parsed.selectedDayScope ?? "all",
    };
  } catch {
    return getDefaultStoredData();
  }
}

function matchesCurrentScope(
  dateValue: string,
  selectedMonthScope: string,
  selectedDayScope: string
) {
  const normalized = normalizeDate(dateValue);

  if (selectedDayScope !== "all") {
    return normalized === selectedDayScope;
  }

  if (selectedMonthScope !== "all") {
    return getMonthKey(dateValue) === selectedMonthScope;
  }

  return true;
}

const AttendanceContext = createContext<AttendanceState | undefined>(undefined);
const STORAGE_KEY_PREFIX = "attendance-system-v6";

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const { workspace, loading: authLoading } = useAuth();

  const storageKey = useMemo(() => {
    if (!workspace) return null;
    return buildStorageKey(workspace) ?? `${STORAGE_KEY_PREFIX}-${workspace}`;
  }, [workspace]);

  const [fileName, setFileName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedAttendanceFile[]>([]);
  const [exemptionsState, setExemptions] = useState<Exemption[]>([]);
  const [absencesState, setAbsences] = useState<AbsentRecord[]>([]);
  const [manualUndertimesState, setManualUndertimes] = useState<
    UndertimeRecord[]
  >([]);
  const [readMemoEmployeeNames, setReadMemoEmployeeNames] = useState<string[]>([]);
  const [selectedMonthScope, setSelectedMonthScope] = useState<string>("all");
  const [selectedDayScope, setSelectedDayScope] = useState<string>("all");
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);

  useEffect(() => {
    if (authLoading || !storageKey) return;

    const initialData = getStoredData(storageKey);

    setFileName(initialData.fileName);
    setUploadedFiles(initialData.uploadedFiles);
    setExemptions(initialData.exemptions);
    setAbsences(initialData.absences);
    setManualUndertimes(initialData.manualUndertimes);
    setReadMemoEmployeeNames(initialData.readMemoEmployeeNames);
    setSelectedMonthScope(initialData.selectedMonthScope || "all");
    setSelectedDayScope(initialData.selectedDayScope || "all");
    setIsStorageHydrated(true);
  }, [authLoading, storageKey]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      authLoading ||
      !storageKey ||
      !isStorageHydrated
    ) {
      return;
    }

    const payload: PersistedAttendanceData = {
      fileName,
      uploadedFiles,
      exemptions: exemptionsState,
      absences: absencesState,
      manualUndertimes: manualUndertimesState,
      readMemoEmployeeNames,
      selectedMonthScope,
      selectedDayScope,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [
    authLoading,
    storageKey,
    isStorageHydrated,
    fileName,
    uploadedFiles,
    exemptionsState,
    absencesState,
    manualUndertimesState,
    readMemoEmployeeNames,
    selectedMonthScope,
    selectedDayScope,
  ]);

  const allLateRecords = useMemo(() => {
    return uploadedFiles.flatMap((file) => file.lateRecords);
  }, [uploadedFiles]);

  const allGeneratedUndertimes = useMemo(() => {
    return uploadedFiles
      .flatMap((file) => file.generatedUndertimes)
      .sort((a, b) => {
        const aDate = new Date(`${a.date} ${a.timeIn}`).getTime();
        const bDate = new Date(`${b.date} ${b.timeIn}`).getTime();
        return bDate - aDate;
      });
  }, [uploadedFiles]);

  const uploadedAvailableDates = useMemo(() => {
    const daySet = new Set<string>();

    uploadedFiles.forEach((file) => {
      file.lateRecords.forEach((record) => daySet.add(normalizeDate(record.date)));
      file.generatedUndertimes.forEach((record) =>
        daySet.add(normalizeDate(record.date))
      );
    });

    return Array.from(daySet).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [uploadedFiles]);

  const uploadedAvailableMonths = useMemo(() => {
    const monthSet = new Set<string>();

    uploadedAvailableDates.forEach((dateValue) => {
      monthSet.add(getMonthKey(dateValue));
    });

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [uploadedAvailableDates]);

  const dayScopeOptions = useMemo(() => {
    if (selectedMonthScope === "all") {
      return uploadedAvailableDates;
    }

    return uploadedAvailableDates.filter(
      (dateValue) => getMonthKey(dateValue) === selectedMonthScope
    );
  }, [uploadedAvailableDates, selectedMonthScope]);

  useEffect(() => {
    if (
      selectedMonthScope !== "all" &&
      !uploadedAvailableMonths.includes(selectedMonthScope)
    ) {
      setSelectedMonthScope("all");
    }
  }, [selectedMonthScope, uploadedAvailableMonths]);

  useEffect(() => {
    if (selectedDayScope !== "all" && !dayScopeOptions.includes(selectedDayScope)) {
      setSelectedDayScope("all");
    }
  }, [selectedDayScope, dayScopeOptions]);

  const adjustedLateRecords = useMemo(() => {
    if (allLateRecords.length === 0) return [];

    const linkedUndertimeLateIds = new Set(
      manualUndertimesState
        .map((ut) => ut.sourceLateRecordId)
        .filter(Boolean) as string[]
    );

    const adjustmentCountMap = new Map<string, number>();

    exemptionsState.forEach((ex) => {
      const key = `${normalizeName(ex.name)}|${normalizeDate(ex.date)}`;
      adjustmentCountMap.set(key, (adjustmentCountMap.get(key) ?? 0) + 1);
    });

    manualUndertimesState
      .filter((ut) => !ut.sourceLateRecordId)
      .forEach((ut) => {
        const key = `${normalizeName(ut.name)}|${normalizeDate(ut.date)}`;
        adjustmentCountMap.set(key, (adjustmentCountMap.get(key) ?? 0) + 1);
      });

    const consumedAdjustments = new Map<string, number>();

    return allLateRecords.filter((record) => {
      if (linkedUndertimeLateIds.has(record.id)) {
        return false;
      }

      const key = `${normalizeName(record.name)}|${record.date}`;
      const allowed = adjustmentCountMap.get(key) ?? 0;
      const used = consumedAdjustments.get(key) ?? 0;

      if (used < allowed) {
        consumedAdjustments.set(key, used + 1);
        return false;
      }

      return true;
    });
  }, [allLateRecords, exemptionsState, manualUndertimesState]);

  const lateRecords = useMemo(() => {
    return adjustedLateRecords.filter((record) =>
      matchesCurrentScope(record.date, selectedMonthScope, selectedDayScope)
    );
  }, [adjustedLateRecords, selectedMonthScope, selectedDayScope]);

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
    return allGeneratedUndertimes.filter((record) =>
      matchesCurrentScope(record.date, selectedMonthScope, selectedDayScope)
    );
  }, [allGeneratedUndertimes, selectedMonthScope, selectedDayScope]);

  const exemptions = useMemo(() => {
    return exemptionsState.filter((record) =>
      matchesCurrentScope(record.date, selectedMonthScope, selectedDayScope)
    );
  }, [exemptionsState, selectedMonthScope, selectedDayScope]);

  const absences = useMemo(() => {
    return absencesState.filter((record) =>
      matchesCurrentScope(record.date, selectedMonthScope, selectedDayScope)
    );
  }, [absencesState, selectedMonthScope, selectedDayScope]);

  const manualUndertimes = useMemo(() => {
    return manualUndertimesState.filter((record) =>
      matchesCurrentScope(record.date, selectedMonthScope, selectedDayScope)
    );
  }, [manualUndertimesState, selectedMonthScope, selectedDayScope]);

  const memoAlerts = useMemo<MemoAlert[]>(() => {
    const readSet = new Set(readMemoEmployeeNames.map((name) => normalizeName(name)));

    return lateSummary
      .filter((item) => item.totalLates >= 4)
      .map((item) => ({
        id: `memo-${normalizeName(item.name)}`,
        name: item.name,
        totalLates: item.totalLates,
        totalMinutesLate: item.totalMinutesLate,
        message: `${item.name} has already reached ${item.totalLates} lates and is due for memo/penalty review.`,
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
          const jsonData: unknown[] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          });

          for (let i = 4; i < jsonData.length; i += 1) {
            const row = jsonData[i] as unknown[];

            if (!row?.[2] || !row?.[4]) continue;

            const name = String(row[2]).trim();
            const dateTime = new Date(row[4] as string | number | Date);

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

        const uploadedDay =
          parsedLateRecords[0]?.date || parsedGeneratedUndertime[0]?.date || null;

        if (uploadedDay) {
          setSelectedMonthScope(getMonthKey(uploadedDay));
          setSelectedDayScope(uploadedDay);
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

    if (!uploadedAvailableDates.includes(exemptionDate)) {
      return {
        success: false,
        message: "This date is not found in uploaded attendance files.",
      };
    }

    const matchingLateRecords = allLateRecords.filter(
      (record) =>
        normalizeName(record.name) === normalizedExemptionName &&
        record.date === exemptionDate
    );

    if (matchingLateRecords.length === 0) {
      return {
        success: false,
        message: "No matching late record found for this employee and date.",
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
    setSelectedMonthScope(getMonthKey(exemptionDate));
    setSelectedDayScope(exemptionDate);

    return {
      success: true,
      message: "Exemption saved successfully and matching late record is now excluded.",
    };
  };

  const addAbsence = (ab: Omit<AbsentRecord, "id">) => {
    const absenceDate = normalizeDate(ab.date);

    if (!uploadedAvailableDates.includes(absenceDate)) {
      return {
        success: false,
        message: "This date is not found in uploaded attendance files.",
      };
    }

    const newAbsence: AbsentRecord = {
      ...ab,
      id: createId(),
    };

    setAbsences((prev) => [newAbsence, ...prev]);
    setSelectedMonthScope(getMonthKey(absenceDate));
    setSelectedDayScope(absenceDate);

    return {
      success: true,
      message: "Absence saved successfully.",
    };
  };

  const addUndertime = (ut: Omit<UndertimeRecord, "id">) => {
    const undertimeDate = normalizeDate(ut.date);
    const normalizedName = normalizeName(ut.name);

    if (!uploadedAvailableDates.includes(undertimeDate)) {
      return {
        success: false,
        message: "This date is not found in uploaded attendance files.",
      };
    }

    const matchingLateRecords = allLateRecords.filter(
      (record) =>
        normalizeName(record.name) === normalizedName &&
        record.date === undertimeDate
    );

    if (matchingLateRecords.length === 0) {
      return {
        success: false,
        message:
          "No matching late record found for this employee and date. Manual undertime will only offset a late record if name and date match.",
      };
    }

    const newUndertime: UndertimeRecord = {
      ...ut,
      id: createId(),
      sourceType: ut.sourceType ?? "manual-entry",
      isManualOverride: ut.isManualOverride ?? true,
    };

    setManualUndertimes((prev) => [newUndertime, ...prev]);
    setSelectedMonthScope(getMonthKey(undertimeDate));
    setSelectedDayScope(undertimeDate);

    return {
      success: true,
      message:
        "Manual undertime saved successfully and matching late record is now excluded.",
    };
  };

  const convertLateToUndertime = (payload: {
    lateRecordId: string;
    undertimeHours: string;
    reason?: string;
    isManualOverride?: boolean;
  }) => {
    const lateRecord = allLateRecords.find(
      (record) => record.id === payload.lateRecordId
    );

    if (!lateRecord) {
      return {
        success: false,
        message: "The selected late record was not found.",
      };
    }

    const alreadyConverted = manualUndertimesState.some(
      (item) => item.sourceLateRecordId === lateRecord.id
    );

    if (alreadyConverted) {
      return {
        success: false,
        message: "This late record has already been converted to undertime.",
      };
    }

    const newUndertime: UndertimeRecord = {
      id: createId(),
      name: lateRecord.name,
      date: lateRecord.date,
      reason: payload.reason?.trim() || "Converted from late record",
      undertimeHours: payload.undertimeHours,
      sourceLateRecordId: lateRecord.id,
      originalTimeIn: lateRecord.timeIn,
      sourceType: "late-conversion",
      isManualOverride: payload.isManualOverride ?? false,
    };

    setManualUndertimes((prev) => [newUndertime, ...prev]);
    setSelectedMonthScope(getMonthKey(lateRecord.date));
    setSelectedDayScope(lateRecord.date);

    return {
      success: true,
      message: `${lateRecord.name} was successfully moved to Undertime Records.`,
    };
  };

  const deleteUploadedFile = (fileId: string) => {
    setUploadedFiles((prevFiles) => {
      const fileToDelete = prevFiles.find((file) => file.id === fileId);
      const updatedFiles = prevFiles.filter((file) => file.id !== fileId);

      setFileName(updatedFiles.length > 0 ? updatedFiles[0].fileName : "");

      if (fileToDelete) {
        const deletedDates = new Set<string>();

        fileToDelete.lateRecords.forEach((record) =>
          deletedDates.add(normalizeDate(record.date))
        );
        fileToDelete.generatedUndertimes.forEach((record) =>
          deletedDates.add(normalizeDate(record.date))
        );

        const remainingDates = new Set<string>();
        updatedFiles.forEach((file) => {
          file.lateRecords.forEach((record) =>
            remainingDates.add(normalizeDate(record.date))
          );
          file.generatedUndertimes.forEach((record) =>
            remainingDates.add(normalizeDate(record.date))
          );
        });

        const datesToRemove = Array.from(deletedDates).filter(
          (dateValue) => !remainingDates.has(dateValue)
        );

        if (datesToRemove.length > 0) {
          setExemptions((prev) =>
            prev.filter((item) => !datesToRemove.includes(normalizeDate(item.date)))
          );
          setAbsences((prev) =>
            prev.filter((item) => !datesToRemove.includes(normalizeDate(item.date)))
          );
          setManualUndertimes((prev) =>
            prev.filter((item) => !datesToRemove.includes(normalizeDate(item.date)))
          );
        }
      }

      return updatedFiles;
    });
  };

  const clearAllAttendanceHistory = () => {
    setFileName("");
    setUploadedFiles([]);
    setExemptions([]);
    setAbsences([]);
    setManualUndertimes([]);
    setReadMemoEmployeeNames([]);
    setSelectedMonthScope("all");
    setSelectedDayScope("all");

    if (typeof window !== "undefined" && storageKey) {
      window.localStorage.removeItem(storageKey);
    }
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

  const restoreExemption = (id: string) => {
    setExemptions((prev) => prev.filter((record) => record.id !== id));
  };

  const deleteManualUndertimesByMonth = (monthKey: string) => {
    setManualUndertimes((prev) =>
      prev.filter((record) => getMonthKey(record.date) !== monthKey)
    );
  };

  const restoreManualUndertime = (id: string) => {
    setManualUndertimes((prev) => prev.filter((record) => record.id !== id));
  };

  const markAllMemoAlertsAsRead = () => {
    const uniqueNames = Array.from(new Set(memoAlerts.map((item) => item.name.trim())));
    setReadMemoEmployeeNames((prev) =>
      Array.from(new Set([...prev, ...uniqueNames]))
    );
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
        Reason: item.reason,
        UndertimeHours: item.undertimeHours,
        SourceType: item.sourceType ?? "",
        OriginalTimeIn: item.originalTimeIn ?? "",
        SourceLateRecordId: item.sourceLateRecordId ?? "",
        IsManualOverride: item.isManualOverride ? "Yes" : "No",
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
        XLSX.utils.json_to_sheet(
          exemptionRows.length ? exemptionRows : [{ Message: "No data" }]
        ),
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
          generatedUndertimeRows.length
            ? generatedUndertimeRows
            : [{ Message: "No data" }]
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

      const suffix =
        selectedDayScope !== "all"
          ? formatDayLabel(selectedDayScope)
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
          : selectedMonthScope !== "all"
          ? formatMonthLabel(selectedMonthScope)
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
          : "all-records";

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
        monthScopeOptions: uploadedAvailableMonths,
        dayScopeOptions,
        selectedMonthScope,
        selectedDayScope,
        setSelectedMonthScope,
        setSelectedDayScope,
        handleFileUpload,
        addExemption,
        addAbsence,
        addUndertime,
        convertLateToUndertime,
        deleteUploadedFile,
        clearAllAttendanceHistory,
        deleteAbsencesByMonth,
        deleteExemptionsByMonth,
        deleteManualUndertimesByMonth,
        restoreExemption,
        restoreManualUndertime,
        markAllMemoAlertsAsRead,
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