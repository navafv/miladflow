// src/lib/certificateZip.js
//
// Assembles already-rendered certificate blobs into a single downloadable
// zip, organised as:
//
//   certificates/
//     Computer_Science_A/
//       John_Doe.pdf
//       Jane_Smith.pdf
//     Unassigned/
//       ...
//
// Requires the `jszip` package:  npm install jszip

import JSZip from "jszip";
import { groupStudentsByClass, buildUniqueFilenames, sanitizeSegment } from "./certificateData.js";

const ROOT_FOLDER = "certificates";

/**
 * @param {Array<{student: object, blob: Blob}>} generatedCertificates
 *   One entry per successfully-generated certificate.
 * @param {string} extension  "pdf" | "png" (no leading dot)
 * @returns {Promise<Blob>} the assembled zip file, ready to save
 */
export async function assembleCertificateZip(generatedCertificates, extension = "pdf") {
  const zip = new JSZip();
  const root = zip.folder(ROOT_FOLDER);

  // Re-derive class groups so folder + filename collision handling stays
  // consistent with what was shown in the UI, even though generation may
  // have happened one student at a time.
  const students = generatedCertificates.map((c) => c.student);
  const classGroups = groupStudentsByClass(students);

  const blobByStudentId = new Map(
    generatedCertificates.map((c) => [c.student.id, c.blob]),
  );

  for (const [classLabel, studentsInClass] of classGroups.entries()) {
    const folderName = sanitizeSegment(classLabel, "Unassigned");
    const folder = root.folder(folderName);
    const filenameByStudentId = buildUniqueFilenames(studentsInClass);

    for (const student of studentsInClass) {
      const blob = blobByStudentId.get(student.id);
      if (!blob) continue; // student failed generation — skip, don't break the zip
      const filename = `${filenameByStudentId.get(student.id)}.${extension}`;
      folder.file(filename, blob);
    }
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/**
 * Triggers a browser download for a blob without needing file-saver as a
 * dependency (mirrors the anchor-click pattern already used by
 * posterCapture.js's downloadDataUrl).
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a tick to pick up the click before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildZipFilename(madrassaName) {
  const namePart = sanitizeSegment(madrassaName, "Certificates");
  const datePart = new Date().toISOString().slice(0, 10);
  return `${namePart}_Certificates_${datePart}.zip`;
}
