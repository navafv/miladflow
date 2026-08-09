export function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#21F1A8] focus:ring-2 focus:ring-[#21F1A8] dark:border-slate-700 dark:bg-[#171717] dark:text-white";

export function TextInput(props) {
  return (
    <input {...props} className={`${inputClass} ${props.className ?? ""}`} />
  );
}

export function NumberInput({ value, ...props }) {
  return (
    <input
      type="number"
      value={value ?? ""}
      {...props}
      className={`${inputClass} ${props.className ?? ""}`}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputClass} ${props.className ?? ""}`}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-[#171717]">
      <span className="text-sm font-medium text-slate-900 dark:text-white">
        {label}
      </span>
      <span
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[#21F1A8]" : "bg-slate-200 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full shadow transition ${
            checked ? "left-5 bg-[#171717]" : "left-0.5 bg-white"
          }`}
        />
      </span>
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
  ...rest
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        aria-hidden="true"
      >
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="m17 17-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...rest}
        className={`${inputClass} w-full pl-9 pr-8`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-[#21F1A8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8]"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#171717]">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === opt
              ? "bg-[#21F1A8] text-[#171717] shadow-sm"
              : "text-slate-500 hover:text-[#21F1A8] dark:text-slate-400 dark:hover:text-[#21F1A8]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
