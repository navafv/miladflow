import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";

function TrophyIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20 8h24v4h8a2 2 0 0 1 2 2v3c0 7.2-5.1 13.2-11.9 14.6C40.9 35.9 37 39.6 33 40.4V49h9v4H22v-4h9v-8.6c-4-.8-7.9-4.5-9.1-8.4C15.1 30.6 10 24.6 10 17.4v-3a2 2 0 0 1 2-2h8V8Zm-6 8v1.4c0 4.4 2.9 8.3 7 9.7-.6-2-1-4.2-1-6.5V16h-6Zm36 0h-6v2.6c0 2.3-.4 4.5-1 6.5 4.1-1.4 7-5.3 7-9.7V16Z" />
    </svg>
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
    watermarkIcon: "text-white/[0.03]",
    headerRule: "via-[#21F1A8]/40",
    dividerDot: "bg-white/20",
    catBadge: "border border-[#21F1A8]/40 bg-[#21F1A8]/10 text-[#21F1A8]",
    genderBadge: "border border-white/15 bg-white/5 text-white/70",
    heroText: "text-[#0a0a0a]",
    heroTeamPill: "bg-[#0a0a0a]/15 text-[#0a0a0a]",
    runnerName: "text-white",
    footerCard:
      "bg-gradient-to-r from-white/[0.06] to-white/[0.03] backdrop-blur-sm border border-white/10",
    footerLabel: "text-[#21F1A8]",
    footerValue: "text-white",
    qrCardBg: "bg-white",
    qrFg: "#0a0a0a",
    qrBg: "#ffffff",
    rosterBorder: "border-white/[0.08]",
    watermarkFooter: "text-white/30",
    emptyCard: "border-white/10 text-white/35",
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
    watermarkIcon: "text-slate-900/[0.035]",
    headerRule: "via-[#0f9c74]/30",
    dividerDot: "bg-slate-300",
    catBadge: "border border-[#0f9c74]/40 bg-[#0f9c74]/10 text-[#0f9c74]",
    genderBadge: "border border-slate-200 bg-slate-100 text-slate-600",
    heroText: "text-[#0a0a0a]",
    heroTeamPill: "bg-[#0a0a0a]/10 text-[#0a0a0a]",
    runnerName: "text-slate-900",
    footerCard:
      "bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)] border border-slate-200",
    footerLabel: "text-[#0f9c74]",
    footerValue: "text-slate-900",
    qrCardBg: "bg-white border border-slate-200",
    qrFg: "#0a0a0a",
    qrBg: "#ffffff",
    rosterBorder: "border-slate-200",
    watermarkFooter: "text-slate-400",
    emptyCard: "border-slate-300 text-slate-400",
  },
};

const placeMeta = {
  1: {
    label: "1st Place",
    numeral: "01",
    hero: "bg-gradient-to-br from-[#4dffc9] to-[#21F1A8] border-[#21F1A8]/60 shadow-[0_0_40px_-8px_rgba(33,241,168,0.65)]",
    badge: "bg-[#0a0a0a]/85 text-[#21F1A8]",
    numeralClass: "text-[#0a0a0a]/50",
  },
  2: {
    label: "2nd Place",
    numeral: "02",
    badge:
      "bg-gradient-to-br from-[#7dd8fb] to-[#38bdf8] text-[#0a0a0a] shadow-[0_0_16px_rgba(56,189,248,0.5)]",
    numeralClass: "text-[#38bdf8]",
    runnerCard: {
      dark: "bg-gradient-to-br from-[#38bdf8]/[0.12] to-transparent border-[#38bdf8]/30",
      light: "bg-[#38bdf8]/10 border-[#38bdf8]/30 shadow-sm",
    },
    teamPill: "bg-[#38bdf8]/15 text-[#38bdf8]",
  },
  3: {
    label: "3rd Place",
    numeral: "03",
    badge:
      "bg-gradient-to-br from-[#fdd775] to-[#fbbf24] text-[#0a0a0a] shadow-[0_0_16px_rgba(251,191,36,0.5)]",
    numeralClass: "text-[#fbbf24]",
    runnerCard: {
      dark: "bg-gradient-to-br from-[#fbbf24]/[0.12] to-transparent border-[#fbbf24]/30",
      light: "bg-[#fbbf24]/10 border-[#fbbf24]/30 shadow-sm",
    },
    teamPill: "bg-[#fbbf24]/15 text-[#fbbf24]",
  },
};

const MAX_NAMES_PER_CARD = 4;

function WinnerNames({
  names,
  nameClass,
  teamPillClass,
  maxNames = MAX_NAMES_PER_CARD,
  nameMaxWidth = "max-w-[220px]",
  teamMaxWidth = "max-w-[200px]",
}) {
  const visible = names.slice(0, maxNames);
  const overflow = names.length - visible.length;

  return (
    <div className="mt-2.5 space-y-2.5">
      {visible.map((n, i) => {
        const displayName =
          n?.name || n?.winner_name || n?.student_name || "Unnamed";
        const displayTeam =
          n?.team ||
          n?.team_name ||
          n?.student_team_name ||
          n?.student?.team?.name ||
          null;

        return (
          <div key={n?.id ?? i} className="max-w-full">
            <p
              className={`${nameMaxWidth} truncate ${nameClass}`}
              title={displayName}
            >
              {displayName}
            </p>
            {displayTeam && (
              <span
                className={`mt-1 inline-block flex-shrink-0 ${teamMaxWidth} truncate whitespace-nowrap rounded-full px-2.5 py-0.5 align-bottom text-[10px] font-bold uppercase tracking-wider ${teamPillClass}`}
                title={displayTeam}
              >
                {displayTeam}
              </span>
            )}
          </div>
        );
      })}

      {overflow > 0 && (
        <p
          className={`text-[10px] font-bold uppercase tracking-widest ${nameClass} opacity-60`}
        >
          + {overflow} More Winner{overflow === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

const EventPoster = forwardRef(function EventPoster(
  {
    theme = "dark",
    madrassaName = "Your Madrassa",
    eventName,
    eventId,
    category,
    gender,
    winners,
    festivalTag = "Milad-un-Nabi Festival",
    siteUrl,
    watermarkUrl = "miladflow.vercel.app",
  },
  ref,
) {
  const t = THEME[theme] ?? THEME.dark;

  const safeWinners = winners || {};
  const first = safeWinners[1] ?? [];
  const second = safeWinners[2] ?? [];
  const third = safeWinners[3] ?? [];
  const totalWinners = first.length + second.length + third.length;
  const hasAnyWinner = totalWinners > 0;

  const baseSiteUrl =
    siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const hasValidQrTarget = eventId != null;
  const qrValue = hasValidQrTarget ? `${baseSiteUrl}?event=${eventId}` : null;

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

      <TrophyIcon
        className={`pointer-events-none absolute -right-6 top-6 h-[260px] w-[260px] select-none ${t.watermarkIcon}`}
      />

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
          Official Results
        </p>
      </div>
      <div
        className={`relative z-10 mt-3 h-px w-full bg-gradient-to-r from-transparent ${t.headerRule} to-transparent`}
      />

      <div className="relative z-10 mt-7 text-center">
        <h1
          className={`mx-auto line-clamp-3 max-w-[460px] text-center text-[44px] font-semibold italic leading-[1.05] tracking-tight ${t.text}`}
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          {eventName || "Untitled Event"}
        </h1>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {category && (
            <span
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-widest ${t.catBadge}`}
            >
              {category}
            </span>
          )}
          {gender && (
            <span
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-widest ${t.genderBadge}`}
            >
              {gender}
            </span>
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
            Results
          </span>
          <span className="rounded-full bg-[#21F1A8]/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#0f9c74] dark:text-[#21F1A8]">
            {totalWinners} WINNER{totalWinners === 1 ? "" : "S"}
          </span>
        </div>

        {!hasAnyWinner ? (
          <div
            className={`flex items-center justify-center rounded-xl border border-dashed ${t.emptyCard} py-10 text-[11px] font-semibold uppercase tracking-widest`}
          >
            Results pending
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {first.length > 0 && (
              <div
                className={`relative overflow-hidden rounded-2xl border-2 px-6 py-5 ${placeMeta[1].hero}`}
              >
                <span
                  className={`pointer-events-none absolute right-3 top-1 select-none text-[64px] font-black italic leading-none ${placeMeta[1].numeralClass}`}
                  style={{ fontFamily: '"Cormorant Garamond", serif' }}
                >
                  {placeMeta[1].numeral}
                </span>
                <span
                  className={`relative inline-block flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${placeMeta[1].badge}`}
                >
                  {placeMeta[1].label}
                </span>
                <div className="relative">
                  <WinnerNames
                    names={first}
                    nameClass={`text-2xl font-black leading-snug ${t.heroText}`}
                    teamPillClass={t.heroTeamPill}
                    nameMaxWidth="max-w-[380px]"
                    teamMaxWidth="max-w-[280px]"
                  />
                </div>
              </div>
            )}

            {(second.length > 0 || third.length > 0) && (
              <div className="grid grid-cols-2 gap-3.5">
                {second.length > 0 && (
                  <div
                    className={`rounded-2xl border px-5 py-4 ${placeMeta[2].runnerCard[theme] ?? placeMeta[2].runnerCard.dark}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[15px] font-black italic ${placeMeta[2].numeralClass}`}
                        style={{ fontFamily: '"Cormorant Garamond", serif' }}
                      >
                        {placeMeta[2].numeral}
                      </span>
                      <span
                        className={`inline-block flex-shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${placeMeta[2].badge}`}
                      >
                        {placeMeta[2].label}
                      </span>
                    </div>
                    <WinnerNames
                      names={second}
                      nameClass={`text-base font-bold leading-snug ${t.runnerName}`}
                      teamPillClass={placeMeta[2].teamPill}
                    />
                  </div>
                )}
                {third.length > 0 && (
                  <div
                    className={`rounded-2xl border px-5 py-4 ${placeMeta[3].runnerCard[theme] ?? placeMeta[3].runnerCard.dark}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[15px] font-black italic ${placeMeta[3].numeralClass}`}
                        style={{ fontFamily: '"Cormorant Garamond", serif' }}
                      >
                        {placeMeta[3].numeral}
                      </span>
                      <span
                        className={`inline-block flex-shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${placeMeta[3].badge}`}
                      >
                        {placeMeta[3].label}
                      </span>
                    </div>
                    <WinnerNames
                      names={third}
                      nameClass={`text-base font-bold leading-snug ${t.runnerName}`}
                      teamPillClass={placeMeta[3].teamPill}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-6 pt-4">
        <div
          className={`flex flex-nowrap items-center justify-between rounded-2xl p-4 ${t.footerCard}`}
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <p
              className={`whitespace-nowrap text-[9px] font-black uppercase tracking-[0.22em] ${t.footerLabel}`}
            >
              Festival
            </p>
            <p
              className={`truncate text-[15px] font-bold tracking-wide ${t.footerValue}`}
            >
              {festivalTag}
            </p>
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
                title="No event ID available — link omitted"
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

export default EventPoster;
