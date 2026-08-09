import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";
import StudentPoster from "./StudentPoster.jsx";
import { useToast, Toast } from "./Toast.jsx";
import { captureNode, downloadDataUrl, shareDataUrl } from "./posterCapture.js";

const SITE_URL = "https://miladflow.vercel.app";
const SITE_LABEL = "miladflow.vercel.app";

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M22 12a10 10 0 0 1-10 10v-3a7 7 0 0 0 7-7h3Z"
      />
    </svg>
  );
}

export default function PosterGeneratorModal({
  open,
  onClose,
  student,
  winningEvents = [],
  madrassaName,
}) {
  const posterRef = useRef(null);
  const wrapRef = useRef(null);
  const fileInputRef = useRef(null);

  const [theme, setTheme] = useState("dark");
  const [imageBlobUrl, setImageBlobUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const { toast, showToast, dismiss } = useToast();
  const captureCacheRef = useRef({ key: null, dataUrl: null });

  const winsOnly = (winningEvents || []).filter(
    (w) => w && (w.place === 1 || w.place === 2 || w.place === 3),
  );
  const eligible = winsOnly.length > 0;

  useEffect(() => {
    if (open) {
      setTheme("dark");
      setImageBlobUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      captureCacheRef.current = { key: null, dataUrl: null };
    }
  }, [open, student?.id]);

  useLayoutEffect(() => {
    if (!open || !eligible) return undefined;
    const el = wrapRef.current;
    if (!el) return undefined;

    const recalc = () => {
      const naturalWidth = posterRef.current?.offsetWidth || 540;
      setPreviewScale(Math.min(1, el.clientWidth / naturalWidth));
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, eligible, theme]);

  if (!open) return null;

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageBlobUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => {
      showToast("Could not read that image. Please try another file.", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageBlobUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildFilename = () => {
    const namePart = (student?.name || "student").trim().replace(/\s+/g, "_");
    const uid =
      student?.student_number ?? student?.reg_no ?? student?.id ?? "unknown";
    return `Student_${namePart}_${uid}_Poster.png`;
  };

  const buildShareCaption = () =>
    `Masha Allah! \u{1F389} Congratulations to ${student?.name || "our student"} for securing placements in our Milad Fest! \u2728 View live results at: ${SITE_URL}`;

  const backgroundColorFor = (t) => (t === "light" ? "#f8fafc" : "#0a0a0a");

  const capture = async () => {
    const cacheKey = `${theme}::${imageBlobUrl ?? ""}`;
    if (
      captureCacheRef.current.key === cacheKey &&
      captureCacheRef.current.dataUrl
    ) {
      return captureCacheRef.current.dataUrl;
    }
    const dataUrl = await captureNode(posterRef.current, {
      backgroundColor: backgroundColorFor(theme),
    });
    captureCacheRef.current = { key: cacheKey, dataUrl };
    return dataUrl;
  };

  const handleDownload = async () => {
    if (!eligible || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      downloadDataUrl(dataUrl, buildFilename());
      showToast("Poster downloaded successfully.", "success");
    } catch (err) {
      console.error("Poster export failed", err);
      showToast(
        "Could not generate the poster image. Please try again.",
        "error",
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!eligible || sharing) return;
    setSharing(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const status = await shareDataUrl(dataUrl, {
        filename: buildFilename(),
        title: `${student?.name || "Student"} — Milad Fest Poster`,
        caption: buildShareCaption(),
        fallbackUrl: SITE_URL,
      });
      if (status === "shared-text-only") {
        showToast(
          "Your browser can\u2019t share images directly — shared the caption instead. Use Download to get the image.",
          "info",
        );
      } else if (status === "downloaded-fallback") {
        showToast(
          "Sharing isn\u2019t supported on this browser — downloaded the poster instead.",
          "info",
        );
      } else {
        showToast("Poster shared successfully.", "success");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Poster share failed", err);
        showToast(
          "Could not share the poster. Please try downloading instead.",
          "error",
        );
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Poster \u2014 ${student?.name || ""}`}
      wide
    >
      {!eligible ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-[#171717]">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-slate-300 dark:text-slate-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
          </svg>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Posters are only generated for place winners.
          </p>
          <p className="max-w-sm text-xs text-slate-400 dark:text-slate-500">
            {student?.name || "This student"} has no recorded 1st, 2nd, or 3rd
            place finishes yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <div className="flex w-full flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-[#171717] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Poster photo (optional)
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Chosen only for this poster \u2014 not saved to the student
                record or server.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-[#21F1A8] hover:text-[#0f9c74] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-200 dark:hover:text-[#21F1A8] dark:focus-visible:ring-offset-[#171717]"
              >
                {imageBlobUrl ? "Change photo" : "Select photo"}
              </button>
              {imageBlobUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all duration-200 hover:border-rose-400 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-400 dark:focus-visible:ring-offset-[#171717]"
                >
                  Remove
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-[#171717]">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Poster theme
            </p>
            <div className="flex items-center gap-1 rounded-full bg-slate-200/70 p-1 dark:bg-white/10">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                aria-pressed={theme === "dark"}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#171717] ${
                  theme === "dark"
                    ? "bg-[#0a0a0a] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                aria-pressed={theme === "light"}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#171717] ${
                  theme === "light"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Light
              </button>
            </div>
          </div>

          <div
            ref={wrapRef}
            className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-black/20"
          >
            <div
              style={{
                height: (posterRef.current?.offsetHeight || 675) * previewScale,
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top center",
                  width: 540,
                }}
                className="mx-auto"
              >
                <StudentPoster
                  ref={posterRef}
                  theme={theme}
                  student={student}
                  winningEvents={winsOnly}
                  imageBlobUrl={imageBlobUrl}
                  madrassaName={madrassaName}
                  siteUrl={SITE_URL}
                  watermarkUrl={SITE_LABEL}
                />
              </div>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading || sharing}
              aria-busy={downloading}
              className="flex min-w-[152px] items-center justify-center gap-2 rounded-lg bg-[#21F1A8] px-5 py-2.5 text-sm font-semibold text-[#171717] shadow-sm transition-all duration-200 hover:bg-[#1de09a] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm disabled:active:scale-100 dark:focus-visible:ring-offset-[#171717]"
            >
              {downloading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-4 w-4"
                >
                  <path
                    d="M10 2.5v10m0 0-3.5-3.5M10 12.5 13.5 9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.5 14v1.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {downloading ? "Preparing\u2026" : "Download Image"}
            </button>

            <button
              onClick={handleShare}
              disabled={sharing || downloading}
              aria-busy={sharing}
              className="flex min-w-[152px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-[#21F1A8] hover:text-[#0f9c74] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm disabled:active:scale-100 dark:border-slate-700 dark:text-slate-200 dark:hover:text-[#21F1A8] dark:focus-visible:ring-offset-[#171717]"
            >
              {sharing ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-4 w-4"
                >
                  <circle cx="15" cy="5" r="2.2" />
                  <circle cx="5" cy="10" r="2.2" />
                  <circle cx="15" cy="15" r="2.2" />
                  <path d="m7 8.8 6-2.6M7 11.2l6 2.6" strokeLinecap="round" />
                </svg>
              )}
              {sharing ? "Preparing\u2026" : "Share Poster"}
            </button>
          </div>
        </div>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </Modal>
  );
}
