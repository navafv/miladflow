import { useRef, useState } from "react";

export default function Dropzone({ onFiles, accept = ".csv,.xlsx,.xls" }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    setFileName(file.name);
    onFiles?.(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload Excel or CSV file"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#21F1A8] ${
        dragging
          ? "border-[#21F1A8] bg-[#21F1A8]/10"
          : "border-slate-200 bg-slate-50 hover:border-[#21F1A8]/60 dark:border-slate-700 dark:bg-[#262626] dark:hover:border-[#21F1A8]/60"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="h-9 w-9 text-[#21F1A8]"
      >
        <path
          d="M12 16V4m0 0-4 4m4-4 4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {fileName ? (
        <p className="text-sm font-semibold text-[#171717] dark:text-white">
          {fileName} selected
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Drag & drop your Excel or CSV file here
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            or click to browse · .csv, .xlsx, .xls
          </p>
        </>
      )}
    </div>
  );
}
