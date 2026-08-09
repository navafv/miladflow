export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

export function AddButton({ onClick, label = "Add new" }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg bg-[#21F1A8] px-4 py-2 text-xs font-semibold text-[#171717] shadow-sm transition-colors hover:bg-[#1de09a] focus-visible:outline-2 focus-visible:outline-[#21F1A8]"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M10 4v12M4 10h12" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  );
}

export function TableShell({
  children,
  label = "Data table",
  stickyFirstColumn = false,
  className = "",
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 sm:hidden">
        Swipe or scroll sideways to see all columns →
      </p>
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        className="table-scroll-shadow overflow-x-auto rounded-2xl border border-slate-200 bg-white focus-visible:outline-2 focus-visible:outline-[#21F1A8] focus-visible:outline-offset-2 dark:border-slate-800 dark:bg-[#262626]"
      >
        <table
          className={`w-full min-w-[640px] text-left text-sm ${
            stickyFirstColumn
              ? "[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_td:first-child]:bg-white [&_th:first-child]:z-10 dark:[&_td:first-child]:bg-[#262626]"
              : ""
          }`}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function Th({ children }) {
  return (
    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
      {children}
    </th>
  );
}

export function Td({ children, className = "", ...rest }) {
  return (
    <td
      {...rest}
      className={`border-b border-slate-200 px-4 py-3 align-middle text-slate-700 dark:border-slate-800 dark:text-slate-200 ${className}`}
    >
      {children}
    </td>
  );
}

export function RowActions({ onEdit, onDelete, hideDelete = false }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onEdit}
        aria-label="Edit"
        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-[#21F1A8]/10 hover:text-[#21F1A8] focus-visible:outline-2 focus-visible:outline-[#21F1A8] dark:text-slate-400"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M13.5 3.5a1.5 1.5 0 0 1 2 2L6 15l-3 1 1-3 9.5-9.5Z"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {!hideDelete && (
        <button
          onClick={onDelete}
          aria-label="Delete"
          className="rounded-md p-1.5 text-rose-500 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-[#21F1A8] dark:text-rose-400 dark:hover:bg-rose-500/10"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6.5 0 .6 9.4A1.5 1.5 0 0 0 7.6 17h4.8a1.5 1.5 0 0 0 1.5-1.6L14.5 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
