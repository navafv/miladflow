import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";

const A4_PORTRAIT = { width: 210, height: 297 };
const A4_LANDSCAPE = { width: 297, height: 210 };
const A3_PORTRAIT = { width: 297, height: 420 };
const A3_LANDSCAPE = { width: 420, height: 297 };

const PAGE_PADDING_MM = 10;
const GAP_MM = 3;

const LAYOUTS = {
  9: {
    name: "A4 Portrait",
    cols: 3,
    rows: 3,
    paper: A4_PORTRAIT,
    printRule: "A4 portrait",
  },
  8: {
    name: "A4 Landscape",
    cols: 4,
    rows: 2,
    paper: A4_LANDSCAPE,
    printRule: "A4 landscape",
  },
  16: {
    name: "A3 Portrait",
    cols: 4,
    rows: 4,
    paper: A3_PORTRAIT,
    printRule: "A3 portrait",
  },
  18: {
    name: "A3 Landscape",
    cols: 6,
    rows: 3,
    paper: A3_LANDSCAPE,
    printRule: "A3 landscape",
  },
};

const MAX_VISIBLE_EVENTS = 7;

// Baseline sizing is tuned for 4 events (the common case). Fewer events get
// a bit more breathing room; more events shrink gracefully so up to
// MAX_VISIBLE_EVENTS (7) still fits the card's fixed height.
const EVENT_LIST_SIZE_STEPS = {
  1: {
    fontSize: "2.8mm",
    badgeSize: "4.2mm",
    badgeFont: "2.2mm",
    gap: "1.4mm",
  },
  2: {
    fontSize: "2.8mm",
    badgeSize: "4.2mm",
    badgeFont: "2.2mm",
    gap: "1.4mm",
  },
  3: { fontSize: "2.6mm", badgeSize: "3.9mm", badgeFont: "2mm", gap: "1.2mm" },
  4: {
    fontSize: "2.5mm",
    badgeSize: "3.6mm",
    badgeFont: "1.9mm",
    gap: "1.1mm",
  }, // default
  5: {
    fontSize: "2.4mm",
    badgeSize: "3.4mm",
    badgeFont: "1.8mm",
    gap: "0.9mm",
  },
  6: {
    fontSize: "2.3mm",
    badgeSize: "3.2mm",
    badgeFont: "1.7mm",
    gap: "0.8mm",
  },
  7: { fontSize: "2.2mm", badgeSize: "3mm", badgeFont: "1.6mm", gap: "0.7mm" },
};

function getEventListSizing(rowCount) {
  const clamped = Math.min(Math.max(rowCount, 1), MAX_VISIBLE_EVENTS);
  return EVENT_LIST_SIZE_STEPS[clamped];
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function CardFront({ student, madrassaName }) {
  const events = student.events ?? [];
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
  const extraEventsCount = events.length - visibleEvents.length;
  // "+N more" counts as a row for sizing purposes too, so the text doesn't
  // suddenly jump in size right when the overflow line appears.
  const eventRowCount = visibleEvents.length + (extraEventsCount > 0 ? 1 : 0);
  const eventSizing = getEventListSizing(eventRowCount);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[4mm] border border-[#171717]/20 bg-white text-[#171717] shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-[1.5mm] bg-[#21F1A8]" />

      <div className="mt-[1.5mm] flex flex-col items-center justify-center border-b border-[#171717]/10 bg-white px-[2mm] py-[3mm]">
        <span className="line-clamp-2 text-center text-[3.2mm] font-extrabold uppercase leading-tight tracking-widest text-[#171717]">
          {madrassaName || "Madrassa"}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center px-[3mm] py-[3mm] text-center">
        <div className="mt-[1mm] flex w-full shrink-0 flex-col items-center">
          <p className="line-clamp-3 text-[4.2mm] font-black leading-tight tracking-tight text-[#171717]">
            {student.name}
          </p>
          <p className="mt-[1.5mm] rounded-md border border-[#21F1A8]/30 bg-[#21F1A8]/20 px-[3mm] py-[1mm] font-mono text-[3mm] font-bold tracking-widest text-[#171717]">
            {student.student_number ?? student.reg_no ?? "—"}
          </p>
        </div>

        <div className="mt-[2mm] flex w-full shrink-0 flex-col rounded-[2mm] border border-slate-100 bg-slate-50 px-[2mm] py-[1.5mm]">
          <div className="flex items-start justify-between border-b border-slate-200 pb-[1mm] gap-[1mm]">
            <span className="text-[2.5mm] font-bold uppercase text-slate-400 whitespace-nowrap">
              Class
            </span>
            <span className="line-clamp-2 text-right text-[2.8mm] font-bold leading-tight text-[#171717]">
              {student.class_name || "—"}
            </span>
          </div>
          <div className="flex items-start justify-between pt-[1mm] gap-[1mm]">
            <span className="text-[2.5mm] font-bold uppercase text-slate-400 whitespace-nowrap">
              Category
            </span>
            <span className="line-clamp-2 text-right text-[2.8mm] font-bold leading-tight text-[#171717]">
              {student.category_name || student.category?.name || "—"}
            </span>
          </div>
        </div>

        {visibleEvents.length > 0 && (
          <div className="mt-[2.5mm] flex w-full min-h-0 flex-1 flex-col text-left">
            <span className="mb-[1.2mm] block shrink-0 border-b border-slate-200 pb-[0.8mm] text-[2.3mm] font-extrabold uppercase tracking-wide text-[#171717]">
              Registered Events
            </span>
            <div
              className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden"
              style={{ gap: eventSizing.gap }}
            >
              {visibleEvents.map((e, idx) => (
                <div
                  key={idx}
                  className="flex items-center leading-tight"
                  style={{ gap: "1.2mm", fontSize: eventSizing.fontSize }}
                >
                  <span
                    className="flex items-center justify-center rounded-full bg-[#21F1A8] font-bold text-[#171717] shrink-0"
                    style={{
                      height: eventSizing.badgeSize,
                      minWidth: eventSizing.badgeSize,
                      fontSize: eventSizing.badgeFont,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="line-clamp-1 font-semibold text-[#171717]">
                    {e}
                  </span>
                </div>
              ))}
              {extraEventsCount > 0 && (
                <div
                  className="flex items-center leading-tight"
                  style={{ gap: "1.2mm", fontSize: eventSizing.fontSize }}
                >
                  <span
                    className="flex items-center justify-center rounded-full bg-[#171717]/10 font-bold text-[#171717] shrink-0"
                    style={{
                      height: eventSizing.badgeSize,
                      minWidth: eventSizing.badgeSize,
                      fontSize: eventSizing.badgeFont,
                    }}
                  >
                    +
                  </span>
                  <span className="font-semibold italic text-[#171717]/60">
                    {extraEventsCount} more event
                    {extraEventsCount === 1 ? "" : "s"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 bg-[#21F1A8] px-[3mm] py-[1.5mm] text-center text-[2.8mm] font-black uppercase tracking-widest text-[#171717]">
        Participant
      </div>
    </div>
  );
}

function CardBack({ student, qrValue }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-[2mm] overflow-hidden rounded-[4mm] border border-[#171717]/20 bg-white text-[#171717] shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-[1.5mm] bg-[#21F1A8]" />

      <div className="rounded-[3mm] border-[0.8mm] border-[#21F1A8] bg-white p-[2mm]">
        <QRCodeSVG
          value={qrValue}
          size={76}
          fgColor="#171717"
          bgColor="#ffffff"
          level="M"
        />
      </div>

      <div className="mt-[2mm] flex flex-col items-center px-[3mm] text-center">
        <p className="line-clamp-3 text-[3.6mm] font-bold leading-tight">
          {student.name}
        </p>
        <p className="mt-[1mm] font-mono text-[2.8mm] font-bold text-[#171717]/70">
          {student.student_number ?? student.reg_no ?? ""}
        </p>
      </div>

      <div className="mt-[3mm] w-3/4 border-t border-dashed border-[#171717]/20 pt-[2mm]">
        <p className="text-center text-[2.2mm] font-medium leading-tight text-[#171717]/60">
          Scan to view results &amp; the event storefront
        </p>
      </div>
    </div>
  );
}

export default function IdCardGenerator({
  students,
  layout,
  includeQr,
  madrassaName,
  tenantSlug,
  onClose,
}) {
  const activeLayout = LAYOUTS[layout] ?? LAYOUTS[9];
  const { cols, rows, paper, printRule, name: layoutName } = activeLayout;
  const perPage = cols * rows;

  const pages = useMemo(() => chunk(students, perPage), [students, perPage]);

  const qrValue = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/${tenantSlug ?? ""}`;
  }, [tenantSlug]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const cardGridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: `${GAP_MM}mm`,
    width: `${paper.width - PAGE_PADDING_MM * 2}mm`,
    height: `${paper.height - PAGE_PADDING_MM * 2}mm`,
  };

  const pageStyle = {
    width: `${paper.width}mm`,
    height: `${paper.height}mm`,
    padding: `${PAGE_PADDING_MM}mm`,
  };

  const content = (
    <div
      id="id-card-print-root"
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-500/80 print:bg-white"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#21F1A8]/20 bg-[#171717] px-6 py-3 text-white shadow-lg print:hidden">
        <div>
          <p className="text-sm font-bold text-[#21F1A8]">
            ID Card Preview ({layoutName})
          </p>
          <p className="mt-1 text-xs text-white/60">
            {students.length} student{students.length === 1 ? "" : "s"} ·{" "}
            {perPage} per page · {pages.length} front page
            {pages.length === 1 ? "" : "s"}
            {includeQr
              ? ` · ${pages.length} back page${pages.length === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-[#21F1A8] px-5 py-2.5 text-sm font-bold text-[#171717] shadow-sm transition hover:bg-[#1de09a]"
          >
            Print Cards
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 py-8 print:gap-0 print:py-0">
        {pages.map((pageStudents, pageIndex) => (
          <div key={`page-${pageIndex}`} className="contents">
            <div
              className="id-card-page relative shrink-0 bg-white shadow-2xl print:shadow-none"
              style={pageStyle}
            >
              <div style={cardGridStyle}>
                {pageStudents.map((student) => (
                  <CardFront
                    key={`front-${student.id}`}
                    student={student}
                    madrassaName={madrassaName}
                  />
                ))}
                {Array.from({ length: perPage - pageStudents.length }).map(
                  (_, i) => (
                    <div
                      key={`front-pad-${i}`}
                      className="rounded-[4mm] border-2 border-dashed border-slate-200"
                    />
                  ),
                )}
              </div>
            </div>

            {includeQr && (
              <div
                className="id-card-page shrink-0 bg-white shadow-2xl print:shadow-none"
                style={pageStyle}
              >
                <div style={{ ...cardGridStyle, direction: "rtl" }}>
                  {pageStudents.map((student) => (
                    <div
                      key={`back-${student.id}`}
                      style={{ direction: "ltr" }}
                    >
                      <CardBack student={student} qrValue={qrValue} />
                    </div>
                  ))}
                  {Array.from({ length: perPage - pageStudents.length }).map(
                    (_, i) => (
                      <div
                        key={`back-pad-${i}`}
                        style={{ direction: "ltr" }}
                        className="rounded-[4mm] border-2 border-dashed border-slate-200"
                      />
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          @page {
            size: ${printRule};
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
          body > *:not(#id-card-print-root) {
            display: none !important;
          }
          #id-card-print-root {
            position: static !important;
            inset: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }
          .id-card-page {
            page-break-after: always;
            box-shadow: none !important;
            margin: 0 auto;
          }
          .id-card-page:last-child {
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
