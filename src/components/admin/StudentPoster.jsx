import { forwardRef, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

function MaleAvatarIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="32" cy="22" r="13" />
      <path d="M32 39c-14 0-23 8-23 19v3h46v-3c0-11-9-19-23-19Z" />
    </svg>
  );
}

function FemaleAvatarIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M32 9c-8 0-14 6.3-14 14.7 0 5 2.3 9.3 5.8 12-1 .6-2 1.2-2 2.4 0 1.3 1.3 2 2.6 2.5-1 .7-1.8 1.4-1.8 2.5 0 1.7 2.3 2.3 4.1 2.7L26 51h4v6h4v-6h4l-.7-5.2c1.8-.4 4.1-1 4.1-2.7 0-1.1-.8-1.8-1.8-2.5 1.3-.5 2.6-1.2 2.6-2.5 0-1.2-1-1.8-2-2.4 3.5-2.7 5.8-7 5.8-12C46 15.3 40 9 32 9Z" />
    </svg>
  );
}

function GenderAvatar({ gender, mutedClass }) {
  const Icon = gender === "Girls" ? FemaleAvatarIcon : MaleAvatarIcon;
  return (
    <span
      className={`flex h-full w-full items-center justify-center ${mutedClass}`}
    >
      <Icon className="h-20 w-20" />
    </span>
  );
}

const THEME = {
  dark: {
    base: "bg-gradient-to-b from-[#0b0f0d] via-[#0a0a0a] to-[#08110d]",
    text: "text-white",
    textMuted: "text-white/50",
    textFaint: "text-white/35",
    frameOuter: "border-white/[0.08]",
    frameInner: "border-[#21F1A8]/[0.15]",
    glowPrimary: "bg-[#21F1A8] opacity-[0.10] blur-[100px]",
    glowSecondary: "bg-[#21F1A8] opacity-[0.06] blur-[70px]",
    watermarkInitial: "text-white/[0.025]",
    avatarRing:
      "ring-4 ring-[#0a0a0a] shadow-[0_0_0_3px_rgba(33,241,168,0.55),0_10px_40px_rgba(33,241,168,0.25)]",
    avatarFallbackBg: "text-[#0a0a0a]",
    rosterBorder: "border-white/[0.08]",
    footerCard:
      "bg-gradient-to-r from-white/[0.06] to-white/[0.03] backdrop-blur-sm border border-white/10",
    footerLabel: "text-[#21F1A8]",
    footerValue: "text-white",
    qrCardBg: "bg-white",
    qrFg: "#0a0a0a",
    qrBg: "#ffffff",
    pillSecondary: "bg-white/[0.06] text-white/80 border border-white/10",
    watermarkFooter: "text-white/30",
    emptyCard: "border-white/10 text-white/35",
    headerRule: "via-[#21F1A8]/40",
    dividerDot: "bg-white/20",
  },
  light: {
    base: "bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9]",
    text: "text-slate-900",
    textMuted: "text-slate-500",
    textFaint: "text-slate-400",
    frameOuter: "border-slate-200",
    frameInner: "border-[#0f9c74]/20",
    glowPrimary: "bg-[#21F1A8] opacity-[0.16] blur-[100px]",
    glowSecondary: "bg-[#21F1A8] opacity-[0.10] blur-[70px]",
    watermarkInitial: "text-slate-900/[0.035]",
    avatarRing:
      "ring-4 ring-white shadow-[0_0_0_3px_rgba(15,156,116,0.35),0_10px_30px_rgba(15,23,42,0.18)]",
    avatarFallbackBg: "text-[#0a0a0a]",
    rosterBorder: "border-slate-200",
    footerCard:
      "bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)] border border-slate-200",
    footerLabel: "text-[#0f9c74]",
    footerValue: "text-slate-900",
    qrCardBg: "bg-white border border-slate-200",
    qrFg: "#0a0a0a",
    qrBg: "#ffffff",
    pillSecondary: "bg-slate-100 text-slate-700 border border-slate-200",
    watermarkFooter: "text-slate-400",
    emptyCard: "border-slate-300 text-slate-400",
    headerRule: "via-[#0f9c74]/30",
    dividerDot: "bg-slate-300",
  },
};

const PLACE_BADGE = {
  1: {
    label: "1st Place",
    numeral: "01",
    className:
      "bg-gradient-to-br from-[#4dffc9] to-[#21F1A8] text-[#0a0a0a] shadow-[0_0_16px_rgba(33,241,168,0.55)]",
    rowClass:
      "bg-gradient-to-r from-[#21F1A8]/[0.14] to-transparent border-l-4 border-[#21F1A8]",
    nameClass: "text-[#0f9c74] dark:text-white",
    numeralClass: "text-[#21F1A8]",
  },
  2: {
    label: "2nd Place",
    numeral: "02",
    className:
      "bg-gradient-to-br from-[#7dd8fb] to-[#38bdf8] text-[#0a0a0a] shadow-[0_0_16px_rgba(56,189,248,0.5)]",
    rowClass:
      "bg-gradient-to-r from-[#38bdf8]/[0.12] to-transparent border-l-4 border-[#38bdf8]",
    nameClass: "text-[#0b7dab] dark:text-white",
    numeralClass: "text-[#38bdf8]",
  },
  3: {
    label: "3rd Place",
    numeral: "03",
    className:
      "bg-gradient-to-br from-[#fdd775] to-[#fbbf24] text-[#0a0a0a] shadow-[0_0_16px_rgba(251,191,36,0.5)]",
    rowClass:
      "bg-gradient-to-r from-[#fbbf24]/[0.12] to-transparent border-l-4 border-[#fbbf24]",
    nameClass: "text-[#92650a] dark:text-white",
    numeralClass: "text-[#fbbf24]",
  },
};

function Pill({ children, className }) {
  return (
    <span
      className={`flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-widest ${className}`}
    >
      {children}
    </span>
  );
}

const StudentPoster = forwardRef(function StudentPoster(
  {
    theme = "dark",
    student = {},
    winningEvents = [],
    imageBlobUrl = null,
    madrassaName = "Madrassa Milad",
    siteUrl,
    watermarkUrl = "miladflow.vercel.app",
  },
  ref,
) {
  const t = THEME[theme] ?? THEME.dark;

  const photo = imageBlobUrl || student.image || null;
  const safeName = student.name?.trim() || "Unnamed Student";
  const initial = safeName[0]?.toUpperCase() || "?";
  const uid = student.student_number ?? student.reg_no ?? student.id ?? null;

  const isRemotePhoto =
    !!photo && !photo.startsWith("blob:") && !photo.startsWith("data:");
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [photo]);
  const showPhoto = !!photo && !imgFailed;
  const baseSiteUrl =
    siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const hasValidQrTarget = student.id != null;
  const qrValue = hasValidQrTarget
    ? `${baseSiteUrl}?student=${student.id}`
    : null;
  const categoryText =
    student.category_name ||
    student.category?.name ||
    (typeof student.category === "string" ? student.category : null);
  const teamText =
    student.team_name ||
    student.team?.name ||
    (typeof student.team === "string" ? student.team : null);
  const sortedWins = [...(winningEvents || [])]
    .map((w) => (w ? { ...w, place: Number(w.place) } : w))
    .filter((w) => w && PLACE_BADGE[w.place])
    .sort((a, b) => a.place - b.place);

  return (
    <div
      ref={ref}
      className={`relative flex w-[540px] flex-col overflow-hidden p-9 ${t.base}`}
      style={{ fontFamily: '"Manrope", sans-serif' }}
    >
      <div
        className={`pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full ${t.glowPrimary}`}
      />
      <div
        className={`pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full ${t.glowSecondary}`}
      />

      <div
        className={`pointer-events-none absolute right-2 top-4 select-none text-[280px] font-black leading-none ${t.watermarkInitial}`}
        style={{ fontFamily: '"Cormorant Garamond", serif' }}
      >
        {initial}
      </div>

      <div
        className={`pointer-events-none absolute inset-4 rounded-[22px] border ${t.frameOuter}`}
      />
      <div
        className={`pointer-events-none absolute inset-[18px] rounded-[16px] border ${t.frameInner}`}
      />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#21F1A8] shadow-[0_0_8px_rgba(33,241,168,0.9)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#0f9c74] dark:text-[#21F1A8]">
            {madrassaName}
          </p>
        </div>
        <p
          className={`text-[9px] font-bold uppercase tracking-[0.25em] ${t.textFaint}`}
        >
          Milad-un-Nabi
        </p>
      </div>
      <div
        className={`relative z-10 mt-3 h-px w-full bg-gradient-to-r from-transparent ${t.headerRule} to-transparent`}
      />

      <div className="relative z-10 mt-7 flex flex-col items-center text-center">
        <div className="relative">
          <div
            className={`absolute -inset-2 rounded-full bg-[#21F1A8] opacity-20 blur-xl`}
          />
          <div
            className={`relative flex h-[136px] w-[136px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#4dffc9] to-[#0f9c74] ${t.avatarRing}`}
          >
            {showPhoto ? (
              <img
                src={photo}
                alt={safeName}
                className="h-full w-full rounded-full object-cover"
                {...(isRemotePhoto ? { crossOrigin: "anonymous" } : {})}
                onError={() => setImgFailed(true)}
              />
            ) : student.gender ? (
              <GenderAvatar
                gender={student.gender}
                mutedClass={t.avatarFallbackBg + "/60"}
              />
            ) : (
              <span
                className={`flex h-full w-full items-center justify-center text-5xl font-black ${t.avatarFallbackBg}`}
              >
                {initial}
              </span>
            )}
          </div>
        </div>

        <h1
          className={`mt-5 line-clamp-2 max-w-[460px] text-center text-[52px] font-semibold italic leading-[1] tracking-tight ${t.text}`}
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          {safeName}
        </h1>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {student.class_name && (
            <Pill className={t.pillSecondary}>{student.class_name}</Pill>
          )}
          {categoryText && (
            <Pill className={t.pillSecondary}>{categoryText}</Pill>
          )}
          {teamText && (
            <Pill className="bg-gradient-to-r from-[#4dffc9] to-[#21F1A8] text-[#0a0a0a] shadow-[0_2px_10px_rgba(33,241,168,0.35)]">
              {teamText}
            </Pill>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-7 flex flex-col">
        <div
          className={`mb-4 flex items-center justify-between border-b pb-2.5 ${t.rosterBorder}`}
        >
          <span
            className={`text-[11px] font-black uppercase tracking-[0.22em] ${t.textMuted}`}
          >
            Placements
          </span>
          <span className="rounded-full bg-[#21F1A8]/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#0f9c74] dark:text-[#21F1A8]">
            {sortedWins.length} WIN{sortedWins.length === 1 ? "" : "S"}
          </span>
        </div>

        {sortedWins.length === 0 ? (
          <div
            className={`flex items-center justify-center rounded-xl border border-dashed ${t.emptyCard} py-10 text-[11px] font-semibold uppercase tracking-widest`}
          >
            No placements recorded yet
          </div>
        ) : (
          <div
            className={
              sortedWins.length > 5
                ? "grid grid-cols-2 gap-x-3 gap-y-2.5 py-1"
                : "flex flex-col gap-3 py-1"
            }
          >
            {sortedWins.map((w) => {
              const badge = PLACE_BADGE[w.place];
              const compact = sortedWins.length > 5;
              return (
                <div
                  key={
                    w.placementId ?? `${w.eventId ?? w.eventName}-${w.place}`
                  }
                  className={`flex min-w-0 flex-nowrap items-center gap-2 rounded-r-lg pr-2 ${
                    compact ? "gap-1.5 py-2 pl-2.5" : "gap-3 py-3 pl-3.5 pr-3"
                  } ${badge.rowClass}`}
                >
                  <span
                    className={`flex-shrink-0 font-black italic ${
                      compact ? "text-[12px]" : "text-[15px]"
                    } ${badge.numeralClass}`}
                    style={{ fontFamily: '"Cormorant Garamond", serif' }}
                  >
                    {badge.numeral}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate font-bold ${
                      compact ? "text-[11.5px]" : "text-[13px]"
                    } ${badge.nameClass}`}
                  >
                    {w.eventName || "Untitled Event"}
                  </span>
                  <span
                    className={`flex-shrink-0 whitespace-nowrap rounded-full font-black uppercase tracking-wider ${
                      compact
                        ? "px-1.5 py-0.5 text-[8px]"
                        : "px-2.5 py-1 text-[10px]"
                    } ${badge.className}`}
                  >
                    {compact ? `#${w.place}` : badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-2 pt-2">
        <div
          className={`flex flex-nowrap items-center justify-between rounded-2xl p-4 ${t.footerCard}`}
        >
          <div className="flex flex-1 min-w-0 items-center justify-between pr-6">
            <div className="flex min-w-0 flex-col gap-1.5">
              <p
                className={`whitespace-nowrap text-[9px] font-black uppercase tracking-[0.22em] ${t.footerLabel}`}
              >
                Participant ID
              </p>
              <p
                className={`truncate font-mono text-xl font-bold tracking-wider ${t.footerValue}`}
              >
                {uid ?? "—"}
              </p>
            </div>

            {teamText && (
              <div className="flex min-w-0 flex-col items-end gap-1.5 text-right pl-4">
                <p
                  className={`whitespace-nowrap text-[9px] font-black uppercase tracking-[0.22em] ${t.footerLabel}`}
                >
                  Team
                </p>
                <p
                  className={`truncate text-lg font-bold tracking-wider ${t.footerValue}`}
                >
                  {teamText}
                </p>
              </div>
            )}
          </div>
          <div className={`flex-shrink-0 rounded-xl p-2 ${t.qrCardBg}`}>
            {hasValidQrTarget ? (
              <QRCodeSVG
                value={qrValue}
                size={50}
                fgColor={t.qrFg}
                bgColor={t.qrBg}
                level="M"
              />
            ) : (
              <div
                className="flex h-[50px] w-[50px] flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-slate-400/60 text-center"
                title="No student ID available — link omitted"
              >
                <span className="text-[7px] font-black uppercase leading-none tracking-wider text-slate-400">
                  Invalid
                </span>
                <span className="text-[7px] font-black uppercase leading-none tracking-wider text-slate-400">
                  Link
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <span className={`h-1 w-1 rounded-full ${t.dividerDot}`} />
          <p
            className={`text-center text-[9px] font-semibold uppercase tracking-[0.15em] ${t.watermarkFooter}`}
          >
            Powered by Milad Flow SaaS &nbsp;·&nbsp; {watermarkUrl}
          </p>
          <span className={`h-1 w-1 rounded-full ${t.dividerDot}`} />
        </div>
      </div>
    </div>
  );
});

export default StudentPoster;
