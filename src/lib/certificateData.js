// src/lib/certificateData.js
//
// Pure data-shaping helpers for bulk certificate generation:
//   - grouping students by class
//   - producing safe, collision-free file/folder names
//   - normalising placement ("win") records into a display-ready shape
//
// No DOM/canvas/PDF work happens here on purpose, so this file stays cheap
// to unit test in isolation from html-to-image / jsPDF.

const UNASSIGNED_CLASS_LABEL = "Unassigned";
const FALLBACK_STUDENT_LABEL = "Student";

/**
 * Turn an arbitrary string into a filesystem/zip-safe token.
 * - trims, collapses whitespace to underscores
 * - strips characters that are illegal (or awkward) in zip entry names
 * - falls back to a placeholder rather than ever returning an empty string
 */
export function sanitizeSegment(raw, fallback = "Unnamed") {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "") // illegal on Windows / ambiguous in zips
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Group students by their class_name, preserving first-seen class order
 * (rather than sorting alphabetically) so it roughly matches table order.
 * Students with no class fall into a single "Unassigned" bucket instead of
 * being dropped, so nobody silently loses their certificate.
 *
 * @param {Array<object>} students
 * @returns {Map<string, object[]>} className -> students[]
 */
export function groupStudentsByClass(students) {
  const groups = new Map();
  for (const student of students) {
    const label = String(student.class_name ?? "").trim() || UNASSIGNED_CLASS_LABEL;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(student);
  }
  return groups;
}

/**
 * Given the students in a single class folder, return a Map<studentId, filename>
 * (extension-less) that is guaranteed unique within that folder — same-name
 * students get their registration number, then a numeric suffix, appended.
 */
export function buildUniqueFilenames(studentsInClass) {
  const filenameByStudentId = new Map();
  const countsSoFar = new Map();

  for (const student of studentsInClass) {
    const baseName = sanitizeSegment(student.name, FALLBACK_STUDENT_LABEL);
    const regSuffix = student.reg_no
      ? `_${sanitizeSegment(student.reg_no, "")}`
      : "";
    let candidate = regSuffix ? `${baseName}${regSuffix}` : baseName;

    // Still colliding (e.g. two "John_Doe" with no reg no, or same reg no
    // typo'd twice) — fall back to student id, then a running counter.
    const seenKey = candidate.toLowerCase();
    const priorCount = countsSoFar.get(seenKey) ?? 0;
    if (priorCount > 0) {
      const idSuffix = student.id != null ? `_${student.id}` : `_${priorCount + 1}`;
      candidate = `${candidate}${idSuffix}`;
    }
    countsSoFar.set(seenKey, priorCount + 1);

    filenameByStudentId.set(student.id, candidate);
  }

  return filenameByStudentId;
}

/**
 * Normalise the raw output of getStudentWins() into the shape the
 * certificate templates render, guarding against any of the fields being
 * missing (group wins in particular can be missing eventName/place).
 */
export function normalizePlacements(rawWins) {
  if (!Array.isArray(rawWins)) return [];
  return rawWins
    .filter(Boolean)
    .map((w) => ({
      eventName: w.eventName?.trim() || "Untitled Event",
      place: Number.isFinite(Number(w.place)) ? Number(w.place) : null,
      isGroupWin: Boolean(w.isGroupWin),
      groupName: w.groupName?.trim() || null,
    }))
    .sort((a, b) => (a.place ?? 99) - (b.place ?? 99));
}

export function placeLabel(place) {
  switch (place) {
    case 1:
      return "1st Place";
    case 2:
      return "2nd Place";
    case 3:
      return "3rd Place";
    default:
      return "Participant";
  }
}

export { UNASSIGNED_CLASS_LABEL };
