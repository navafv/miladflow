// src/components/admin/BulkCertificateGenerator.jsx
//
// useBulkCertificateGenerator() drives the whole "one certificate per
// student, zipped by class" flow:
//
//   1. For each student, fetch their placements (getStudentWins).
//   2. Render the correct template (placed vs. participation) into an
//      off-screen node — one student at a time, so the DOM never holds
//      more than a single certificate and memory stays flat regardless
//      of list size.
//   3. Capture that node to a PNG (html-to-image, same helper the rest of
//      the app already uses) and wrap it into a single-page A4 PDF.
//   4. Once every student has been processed, zip all the PDFs into
//      certificates/<Class>/<Student>.pdf and trigger the download.
//
// A student whose placement fetch or render/capture fails is skipped
// (and reported in `state.failed`) rather than aborting the whole batch —
// one bad record shouldn't block certificates for everyone else.

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import { captureNode } from "./posterCapture.js";
import { PlacementCertificate, ParticipationCertificate } from "./CertificateTemplates.jsx";
import { getStudentWins } from "../../lib/resultsStore.js";
import { normalizePlacements } from "../../lib/certificateData.js";
import {
  assembleCertificateZip,
  downloadBlob,
  buildZipFilename,
} from "../../lib/certificateZip.js";

const A4_LANDSCAPE_MM = { width: 297, height: 210 };

function pngDataUrlToPdfBlob(dataUrl) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  pdf.addImage(
    dataUrl,
    "PNG",
    0,
    0,
    A4_LANDSCAPE_MM.width,
    A4_LANDSCAPE_MM.height,
    undefined,
    "FAST",
  );
  return pdf.output("blob");
}

const INITIAL_STATE = {
  status: "idle", // idle | running | zipping | done | error
  current: 0,
  total: 0,
  currentName: "",
  failed: [],
};

export function useBulkCertificateGenerator({ madrassaName }) {
  const [state, setState] = useState(INITIAL_STATE);
  // The one student currently mounted off-screen for capture, or null.
  const [renderJob, setRenderJob] = useState(null);
  const nodeRef = useRef(null);
  const resolveCaptureRef = useRef(null);

  // Whenever renderJob changes, wait for paint + fonts/images, capture the
  // node, then hand the data URL back to whoever is awaiting it in generate().
  useLayoutEffect(() => {
    if (!renderJob) return undefined;
    let cancelled = false;

    (async () => {
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      if (cancelled) return;
      let dataUrl = null;
      try {
        dataUrl = await captureNode(nodeRef.current, { backgroundColor: "#ffffff" });
      } catch {
        dataUrl = null;
      }
      if (!cancelled) resolveCaptureRef.current?.(dataUrl);
      resolveCaptureRef.current = null;
    })();

    return () => {
      cancelled = true;
    };
  }, [renderJob]);

  const renderAndCapture = useCallback((job) => {
    return new Promise((resolve) => {
      resolveCaptureRef.current = resolve;
      setRenderJob(job);
    });
  }, []);

  const generate = useCallback(
    async (students) => {
      if (!students || students.length === 0) return;

      setState({
        status: "running",
        current: 0,
        total: students.length,
        currentName: "",
        failed: [],
      });

      const generated = [];
      const failed = [];

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        setState((s) => ({ ...s, current: i + 1, currentName: student.name || "" }));

        try {
          // Missing/broken placement data should not fail the student —
          // it just means they fall back to a participation certificate.
          let placements = [];
          try {
            placements = normalizePlacements(await getStudentWins(student.id));
          } catch {
            placements = [];
          }

          const dataUrl = await renderAndCapture({
            student,
            placements,
            isPlaced: placements.length > 0,
          });
          if (!dataUrl) throw new Error("Certificate render failed");

          const blob = pngDataUrlToPdfBlob(dataUrl);
          generated.push({ student, blob });
        } catch {
          failed.push(student.name || `Student #${student.id}`);
        }
      }

      setRenderJob(null);

      if (generated.length === 0) {
        setState({
          status: "error",
          current: students.length,
          total: students.length,
          currentName: "",
          failed,
        });
        return;
      }

      setState((s) => ({ ...s, status: "zipping" }));
      const zipBlob = await assembleCertificateZip(generated, "pdf");
      downloadBlob(zipBlob, buildZipFilename(madrassaName));

      setState({
        status: "done",
        current: students.length,
        total: students.length,
        currentName: "",
        failed,
      });
    },
    [madrassaName, renderAndCapture],
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const portal =
    typeof document === "undefined" || !renderJob
      ? null
      : createPortal(
          <div
            aria-hidden="true"
            // Fully off-screen but still laid out/rendered, which
            // html-to-image needs in order to capture real pixels.
            style={{ position: "fixed", top: 0, left: "-10000px", zIndex: -1 }}
          >
            <div ref={nodeRef}>
              {renderJob.isPlaced ? (
                <PlacementCertificate
                  student={renderJob.student}
                  placements={renderJob.placements}
                  madrassaName={madrassaName}
                />
              ) : (
                <ParticipationCertificate
                  student={renderJob.student}
                  madrassaName={madrassaName}
                />
              )}
            </div>
          </div>,
          document.body,
        );

  return { state, generate, reset, portal };
}
