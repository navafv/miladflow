// src/components/admin/CertificateTemplates.jsx
//
// Two A4-landscape certificate layouts, sized in px (1123x794 @ ~96dpi)
// so they capture 1:1 with the rest of the app's html-to-image based
// exports (see posterCapture.js / IdCardGenerator.jsx for the same
// convention).
//
// Both templates take a plain `student` object plus normalised
// `placements` (see certificateData.normalizePlacements) and render
// everything needed for a single certificate — no external state.
//
// Design language: quiet, premium "illuminated manuscript" take on a
// modern Islamic certificate — soft ivory ground, a fine double gold
// stroke with light corner flourishes, and the student's name as the
// single largest element on the page. Placements are woven into a
// flowing sentence rather than boxed into a grid. Font stacks fall
// back safely if Playfair Display / Cormorant Garamond aren't loaded
// by the app.

import { forwardRef } from "react";
import { placeLabel } from "../../lib/certificateData.js";

const PAGE_PX = { width: 1123, height: 794 };

// ---- Token system -----------------------------------------------------
const INK = "#211C14"; // warm near-black ink
const IVORY = "#FBF8F1"; // soft ivory ground
const IVORY_DEEP = "#F4EEDE"; // subtle inner vignette tint
const EMERALD = "#0B4A38"; // deep emerald, used sparingly for the title
const GOLD = "#AD8A3C"; // muted antique gold — strokes & labels
const GOLD_SOFT = "#D9BE7E"; // lighter gold for hairlines

const DISPLAY_FONT =
  "'Playfair Display', 'Cormorant Garamond', 'Times New Roman', serif";
const BODY_FONT = "'Cormorant Garamond', 'EB Garamond', Georgia, serif";
const LABEL_FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif";

// ---- Helpers -------------------------------------------------------------

/**
 * Turns a normalised placements array into a single flowing, grammatical
 * clause, e.g. "1st Place in Qira'ath, 2nd Place in Speech and 3rd Place
 * in Calligraphy". Group wins get their team name appended in parentheses.
 */
function joinPlacementsAsSentence(placements) {
  const phrases = placements.map((p) => {
    const place = placeLabel(p.place);
    const group = p.isGroupWin ? ` (${p.groupName || "Team"})` : "";
    return `${place} in ${p.eventName}${group}`;
  });

  if (phrases.length === 0) return "";
  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;

  const last = phrases[phrases.length - 1];
  const rest = phrases.slice(0, -1);
  return `${rest.join(", ")} and ${last}`;
}

// ---- Shared decorative chrome ------------------------------------------

/** Fine corner flourish — a light stroke motif, not a heavy medallion. */
function CornerFlourish({ corner }) {
  const pos = {
    tl: "top-[22px] left-[22px]",
    tr: "top-[22px] right-[22px] scale-x-[-1]",
    bl: "bottom-[22px] left-[22px] scale-y-[-1]",
    br: "bottom-[22px] right-[22px] scale-x-[-1] scale-y-[-1]",
  }[corner];

  return (
    <svg
      className={`absolute ${pos} h-[52px] w-[52px]`}
      viewBox="0 0 60 60"
      fill="none"
    >
      <path d="M2 20 V2 H20" stroke={GOLD} strokeWidth="1.4" />
      <path
        d="M2 30 Q2 2 30 2"
        stroke={GOLD_SOFT}
        strokeWidth="1"
        fill="none"
      />
      <circle cx="2" cy="2" r="2.6" fill={GOLD} />
    </svg>
  );
}

function StarGlyph({ size = 14, color = GOLD }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 1 L14.6 9.4 L23 12 L14.6 14.6 L12 23 L9.4 14.6 L1 12 L9.4 9.4 Z"
        fill={color}
      />
    </svg>
  );
}

function BismillahCartouche() {
  return (
    <span
      dir="rtl"
      className="text-[20px] leading-none"
      style={{
        color: EMERALD,
        fontFamily: "'Amiri','Traditional Arabic',serif",
      }}
    >
      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
    </span>
  );
}

function CertificateChrome({ children }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${PAGE_PX.width}px`,
        height: `${PAGE_PX.height}px`,
        background: `radial-gradient(ellipse at 50% 0%, ${IVORY_DEEP} 0%, ${IVORY} 60%)`,
        color: INK,
        fontFamily: BODY_FONT,
      }}
    >
      {/* Outer fine gold stroke */}
      <div
        className="absolute inset-[14px]"
        style={{ border: `1px solid ${GOLD}` }}
      />
      {/* Inner hairline gold stroke, slightly offset for a "double rule" look */}
      <div
        className="absolute inset-[19px]"
        style={{ border: `1px solid ${GOLD_SOFT}` }}
      />

      <CornerFlourish corner="tl" />
      <CornerFlourish corner="tr" />
      <CornerFlourish corner="bl" />
      <CornerFlourish corner="br" />

      {/* Slim hairline just under the header, quieter than a full band */}
      <div
        className="absolute left-[110px] right-[110px] top-[132px] h-[1px]"
        style={{ background: GOLD_SOFT }}
      />

      <div className="relative flex h-full w-full flex-col px-[96px] pb-[52px] pt-[46px]">
        {children}
      </div>
    </div>
  );
}

function CertificateHeader({ madrassaName, festivalName, kicker }) {
  return (
    <div className="flex flex-col items-center text-center">
      <BismillahCartouche />

      <span
        className="mt-[16px] text-[14px] font-semibold uppercase"
        style={{
          fontFamily: LABEL_FONT,
          letterSpacing: "0.4em",
          color: EMERALD,
        }}
      >
        {madrassaName || "Madrassa"}
      </span>

      {festivalName ? (
        <span
          className="mt-[5px] text-[15px] italic"
          style={{ fontFamily: BODY_FONT, color: GOLD }}
        >
          {festivalName}
        </span>
      ) : null}

      <div className="mt-[12px] flex items-center gap-[12px]">
        <div className="h-[1px] w-[44px]" style={{ background: GOLD_SOFT }} />
        <StarGlyph size={11} />
        <div className="h-[1px] w-[44px]" style={{ background: GOLD_SOFT }} />
      </div>

      <h1
        className="mt-[12px] text-[34px] font-bold uppercase leading-none"
        style={{
          fontFamily: DISPLAY_FONT,
          color: EMERALD,
          letterSpacing: "0.14em",
        }}
      >
        {kicker}
      </h1>
    </div>
  );
}

function SignatureLine({ label }) {
  return (
    <div className="flex w-[230px] flex-col items-center">
      <div
        className="h-[1px] w-full"
        style={{ background: GOLD, opacity: 0.6 }}
      />
      <span
        className="mt-[8px] text-[11px] font-semibold uppercase"
        style={{
          fontFamily: LABEL_FONT,
          letterSpacing: "0.18em",
          color: EMERALD,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function CertificateFooter({
  student,
  leftLabel = "Principal / Sadr Muallim",
  rightLabel = "Program Convener",
}) {
  return (
    <div className="mt-auto flex items-end justify-between pt-[20px]">
      <SignatureLine label={leftLabel} />

      <span
        className="pb-[6px] text-[12px]"
        style={{
          fontFamily: LABEL_FONT,
          color: `${INK}80`,
          letterSpacing: "0.04em",
        }}
      >
        Reg. No. {student.reg_no || "—"}
      </span>

      <SignatureLine label={rightLabel} />
    </div>
  );
}

// ---- Placement certificate ---------------------------------------------

/**
 * Placed students: every placement the student earned is woven into one
 * flowing certifying sentence rather than listed in a grid or table.
 */
export const PlacementCertificate = forwardRef(function PlacementCertificate(
  { student, placements, madrassaName, festivalName },
  ref,
) {
  const placementSentence = joinPlacementsAsSentence(placements);

  return (
    <div ref={ref}>
      <CertificateChrome>
        <CertificateHeader
          madrassaName={madrassaName}
          festivalName={festivalName}
          kicker="Certificate of Excellence"
        />

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span
            className="text-[16px]"
            style={{
              fontFamily: BODY_FONT,
              color: `${INK}A6`,
              fontStyle: "italic",
            }}
          >
            This is to proudly certify that
          </span>

          <span
            className="mt-[10px] text-[64px] font-bold leading-none"
            style={{ fontFamily: DISPLAY_FONT, color: EMERALD }}
          >
            {student.name}
          </span>

          <div className="mt-[16px] flex items-center gap-[12px]">
            <div
              className="h-[1px] w-[36px]"
              style={{ background: GOLD_SOFT }}
            />
            <StarGlyph size={9} />
            <div
              className="h-[1px] w-[36px]"
              style={{ background: GOLD_SOFT }}
            />
          </div>

          <p
            className="mt-[18px] max-w-[720px] text-[19px] leading-relaxed"
            style={{ fontFamily: BODY_FONT, color: `${INK}D9` }}
          >
            of Class{" "}
            <strong style={{ color: EMERALD }}>
              {student.class_name || "—"}
            </strong>{" "}
            has demonstrated outstanding merit and excellence by securing{" "}
            <strong style={{ color: GOLD }}>{placementSentence}</strong>
            {festivalName ? (
              <>
                {" "}
                during{" "}
                <strong style={{ color: EMERALD }}>{festivalName}</strong>
              </>
            ) : (
              " during this festival"
            )}
            , earning the pride and appreciation of the entire institution.
          </p>
        </div>

        <CertificateFooter student={student} />
      </CertificateChrome>
    </div>
  );
});

// ---- Participation certificate ------------------------------------------

/**
 * Non-placed students: standard participation certificate, no results table.
 */
export const ParticipationCertificate = forwardRef(
  function ParticipationCertificate(
    { student, madrassaName, festivalName },
    ref,
  ) {
    return (
      <div ref={ref}>
        <CertificateChrome>
          <CertificateHeader
            madrassaName={madrassaName}
            festivalName={festivalName}
            kicker="Certificate of Participation"
          />

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span
              className="text-[16px]"
              style={{
                fontFamily: BODY_FONT,
                color: `${INK}A6`,
                fontStyle: "italic",
              }}
            >
              This is to proudly certify that
            </span>

            <span
              className="mt-[10px] text-[68px] font-bold leading-none"
              style={{ fontFamily: DISPLAY_FONT, color: EMERALD }}
            >
              {student.name}
            </span>

            <div className="mt-[16px] flex items-center gap-[12px]">
              <div
                className="h-[1px] w-[40px]"
                style={{ background: GOLD_SOFT }}
              />
              <StarGlyph size={10} />
              <div
                className="h-[1px] w-[40px]"
                style={{ background: GOLD_SOFT }}
              />
            </div>

            <p
              className="mt-[18px] max-w-[700px] text-[19px] leading-relaxed"
              style={{ fontFamily: BODY_FONT, color: `${INK}D9` }}
            >
              of Class{" "}
              <strong style={{ color: EMERALD }}>
                {student.class_name || "—"}
              </strong>{" "}
              graced{" "}
              {festivalName ? (
                <strong style={{ color: EMERALD }}>{festivalName}</strong>
              ) : (
                "this festival"
              )}{" "}
              with sincere devotion and radiant spirit, lending grace to every
              moment shared and leaving behind an impression as lasting as it
              was luminous.
            </p>
          </div>

          <CertificateFooter student={student} />
        </CertificateChrome>
      </div>
    );
  },
);
