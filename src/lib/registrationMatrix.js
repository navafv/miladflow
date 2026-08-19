export const TICK = "✓";
export const DASH = "—";

export function indexToLetter(index) {
  let n = index;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function buildGroupLetterMaps(groupEntries = []) {
  const entriesByEvent = new Map();
  for (const entry of groupEntries) {
    if (!entriesByEvent.has(entry.event_id)) {
      entriesByEvent.set(entry.event_id, []);
    }
    entriesByEvent.get(entry.event_id).push(entry);
  }

  const letterMapsByEvent = new Map();
  for (const [eventId, entries] of entriesByEvent) {
    const studentToLetter = new Map();
    entries.forEach((entry, idx) => {
      const letter = indexToLetter(idx);
      (entry.students ?? []).forEach((student) => {
        studentToLetter.set(student.id, letter);
      });
    });
    letterMapsByEvent.set(eventId, studentToLetter);
  }
  return letterMapsByEvent;
}

export function resolveMatrixCell({
  event,
  studentId,
  isRegistered,
  letterMapsByEvent,
}) {
  if (event.event_type === "group") {
    const letter = letterMapsByEvent.get(event.id)?.get(studentId);
    if (letter) return letter;
    return isRegistered ? TICK : DASH;
  }
  return isRegistered ? TICK : DASH;
}

export function buildMatrixExportTable({
  events,
  students,
  registeredPairs,
  groupEntries,
}) {
  const pairSet =
    registeredPairs instanceof Set
      ? registeredPairs
      : new Set((registeredPairs ?? []).map(([sid, eid]) => `${sid}:${eid}`));

  const letterMapsByEvent = buildGroupLetterMaps(groupEntries);

  const columns = [
    { key: "studentName", label: "Student Name" },
    { key: "regNo", label: "Reg. No." },
    { key: "className", label: "Class" },
    { key: "team", label: "Team" },
    ...events.map((ev) => ({
      key: `event_${ev.id}`,
      label: ev.name,
      vertical: true,
    })),
  ];

  const rows = students.map((s) => {
    const row = {
      studentName: s.name,
      regNo: s.reg_no,
      className: s.class_name ?? "—",
      team: s.team_name,
    };
    events.forEach((ev) => {
      const isRegistered = pairSet.has(`${s.id}:${ev.id}`);
      row[`event_${ev.id}`] = resolveMatrixCell({
        event: ev,
        studentId: s.id,
        isRegistered,
        letterMapsByEvent,
      });
    });
    return row;
  });

  return { columns, rows };
}
