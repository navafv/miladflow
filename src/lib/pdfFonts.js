import notoMalayalamRegularUrl from "../assets/fonts/NotoSansMalayalam-Regular.ttf?url";
import notoMalayalamBoldUrl from "../assets/fonts/NotoSansMalayalam-Bold.ttf?url";
import { emitToast } from "./toastBus.js";

export const MALAYALAM_FONT_FAMILY = "MiladFlow Export Malayalam";

const MALAYALAM_PDF_FONT_NAME = "NotoSansMalayalam";
const FALLBACK_PDF_FONT_NAME = "helvetica";

export let PDF_FONT_NAME = MALAYALAM_PDF_FONT_NAME;

const STYLE_TAG_ATTR = "data-milad-export-font";

let cssReadyPromise = null;
let base64Promise = null;
let hasWarnedFontFallback = false;

function warnFontFallbackOnce() {
  if (hasWarnedFontFallback) return;
  hasWarnedFontFallback = true;
  emitToast(
    "Malayalam fonts failed to load. Text may not render correctly.",
    "error",
  );
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load font file: ${url} (HTTP ${res.status})`);
  }
  return arrayBufferToBase64(await res.arrayBuffer());
}

function loadFontBase64() {
  if (!base64Promise) {
    base64Promise = Promise.all([
      fetchAsBase64(notoMalayalamRegularUrl),
      fetchAsBase64(notoMalayalamBoldUrl),
    ])
      .then(([regular, bold]) => ({ regular, bold }))
      .catch((err) => {
        base64Promise = null;
        throw err;
      });
  }
  return base64Promise;
}

export function ensureMalayalamFontFace() {
  if (!cssReadyPromise) {
    cssReadyPromise = (async () => {
      try {
        const { regular, bold } = await loadFontBase64();

        if (!document.querySelector(`style[${STYLE_TAG_ATTR}]`)) {
          const style = document.createElement("style");
          style.setAttribute(STYLE_TAG_ATTR, "true");
          style.textContent = `
            @font-face {
              font-family: "${MALAYALAM_FONT_FAMILY}";
              src: url(data:font/ttf;base64,${regular}) format("truetype");
              font-weight: 400;
              font-style: normal;
              font-display: block;
            }
            @font-face {
              font-family: "${MALAYALAM_FONT_FAMILY}";
              src: url(data:font/ttf;base64,${bold}) format("truetype");
              font-weight: 700;
              font-style: normal;
              font-display: block;
            }
          `;
          document.head.appendChild(style);
        }

        await Promise.all([
          document.fonts.load(`400 16px "${MALAYALAM_FONT_FAMILY}"`),
          document.fonts.load(`700 16px "${MALAYALAM_FONT_FAMILY}"`),
        ]);
        await document.fonts.ready;
      } catch (err) {
        console.warn(
          "MiladFlow: could not load the Malayalam export font — " +
            "Malayalam text in exported posters/tables may not render " +
            "correctly, but the export will continue.",
          err,
        );
        warnFontFallbackOnce();
        cssReadyPromise = null;
      }
    })();
  }
  return cssReadyPromise;
}

export async function registerMalayalamPdfFont(doc) {
  try {
    const { regular, bold } = await loadFontBase64();

    doc.addFileToVFS("NotoSansMalayalam-Regular.ttf", regular);
    doc.addFont(
      "NotoSansMalayalam-Regular.ttf",
      MALAYALAM_PDF_FONT_NAME,
      "normal",
    );

    doc.addFileToVFS("NotoSansMalayalam-Bold.ttf", bold);
    doc.addFont("NotoSansMalayalam-Bold.ttf", MALAYALAM_PDF_FONT_NAME, "bold");

    PDF_FONT_NAME = MALAYALAM_PDF_FONT_NAME;
  } catch (err) {
    console.warn(
      "MiladFlow: could not load the Malayalam PDF font — falling back " +
        "to the built-in Helvetica font for this export. English text " +
        "and layout are unaffected; Malayalam text may not render " +
        "correctly.",
      err,
    );
    warnFontFallbackOnce();
    PDF_FONT_NAME = FALLBACK_PDF_FONT_NAME;
  }

  doc.setFont(PDF_FONT_NAME, "normal");
}
