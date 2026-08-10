export function sanitizeFilenameSegment(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/[#&{}$!'`=@+^~;,]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function todayStamp(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildExportFilename({
  baseName,
  filters = [],
  allLabel = "All",
  date = new Date(),
}) {
  const activeParts = (filters ?? [])
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0 && v.toLowerCase() !== "all")
    .map(sanitizeFilenameSegment)
    .filter(Boolean);

  const baseSegment = sanitizeFilenameSegment(baseName) || "Export";
  const prefix =
    activeParts.length > 0
      ? activeParts.join("_")
      : sanitizeFilenameSegment(allLabel) || "All";

  return `${prefix}_${baseSegment}_${todayStamp(date)}`;
}
