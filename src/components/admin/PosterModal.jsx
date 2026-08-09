import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";
import { captureNode, downloadDataUrl, shareDataUrl } from "./posterCapture.js";
import { useToast, Toast } from "./Toast.jsx";

export default function PosterModal({
  open,
  onClose,
  title,
  filename,
  children,
  showPhotoUpload = true,
}) {
  const posterRef = useRef(null);
  const wrapRef = useRef(null);
  const fileInputRef = useRef(null);

  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [posterImage, setPosterImage] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [previewScale, setPreviewScale] = useState(1);
  const { toast, showToast, dismiss } = useToast();

  const captureCacheRef = useRef({ key: null, dataUrl: null });

  useEffect(() => {
    return () => {
      if (posterImage) URL.revokeObjectURL(posterImage);
    };
  }, [posterImage]);

  useEffect(() => {
    if (open) captureCacheRef.current = { key: null, dataUrl: null };
  }, [open, filename]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const el = wrapRef.current;
    if (!el) return undefined;

    const recalc = () => {
      const naturalWidth = posterRef.current?.offsetWidth || 540;
      const available = el.clientWidth;
      setPreviewScale(Math.min(1, available / naturalWidth));
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  if (!open) return null;

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterImage((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleRemoveImage = () => {
    setPosterImage((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const backgroundColorFor = (t) => (t === "light" ? "#f8fafc" : "#171717");
  const buildFilename = () =>
    `${(filename || "poster").replace(/\s+/g, "-")}.png`;

  const capture = async () => {
    const cacheKey = `${theme}::${posterImage ?? ""}`;
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
    if (downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      downloadDataUrl(dataUrl, buildFilename());
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
    if (sharing) return;
    setSharing(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const status = await shareDataUrl(dataUrl, {
        filename: buildFilename(),
        title: title || "Poster",
        caption: title || "Poster",
        fallbackUrl:
          typeof window !== "undefined" ? window.location.origin : undefined,
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
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="flex flex-col items-center gap-5">
        {showPhotoUpload && (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-[#171717]">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Poster photo (optional)
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Chosen only for this poster — not saved to the record or server.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#21F1A8] hover:text-[#21F1A8] dark:border-slate-700 dark:text-slate-200"
              >
                {posterImage ? "Change photo" : "Select photo"}
              </button>
              {posterImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:border-rose-400 hover:text-rose-500 dark:border-slate-700 dark:text-slate-400"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
          </div>
        )}

        <div className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-[#171717]">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Poster theme
          </p>
          <div className="flex items-center gap-1 rounded-full bg-slate-200/70 p-1 dark:bg-white/10">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
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
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
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
              {children(posterRef, posterImage, theme)}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 rounded-lg bg-[#21F1A8] px-5 py-2.5 text-sm font-semibold text-[#171717] shadow-sm transition-colors hover:bg-[#1de09a] disabled:cursor-not-allowed disabled:opacity-50"
          >
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
            {downloading ? "Preparing…" : "Download poster"}
          </button>

          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#21F1A8] hover:text-[#0f9c74] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:text-[#21F1A8]"
          >
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
            {sharing ? "Preparing…" : "Share poster"}
          </button>
        </div>
      </div>

      <Toast toast={toast} onDismiss={dismiss} />
    </Modal>
  );
}
