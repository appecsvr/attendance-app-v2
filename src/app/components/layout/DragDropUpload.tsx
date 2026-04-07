import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

type DragDropUploadProps = {
  onFileSelect: (file: File) => void;
};

export default function DragDropUpload({
  onFileSelect,
}: DragDropUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File) {
    const isExcel =
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".xls");

    if (!isExcel) {
      alert("Please upload an Excel file only.");
      return;
    }

    onFileSelect(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
        isDragging
          ? "border-violet-500 bg-violet-50"
          : "border-slate-300 bg-white hover:border-violet-400"
      }`}
    >
      <UploadCloud className="mx-auto mb-4 h-12 w-12 text-violet-500" />

      <h2 className="text-xl font-semibold text-slate-800">
        Drag & Drop Attendance File
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        Drop your Excel file here or click to browse
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}