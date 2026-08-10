import notoMalayalamRegularUrl from "../assets/fonts/NotoSansMalayalam-Regular.ttf?url";
import notoMalayalamBoldUrl from "../assets/fonts/NotoSansMalayalam-Bold.ttf?url";

export const MALAYALAM_FONT_FAMILY = "MiladFlow Export Malayalam";

export const PDF_FONT_NAME = "NotoSansMalayalam";

const STYLE_TAG_ATTR = "data-milad-export-font";

let cssReadyPromise = null;
let base64Promise = null;

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
    ]).then(([regular, bold]) => ({ regular, bold }));
  }
  return base64Promise;
}

export function ensureMalayalamFontFace() {
  if (!cssReadyPromise) {
    cssReadyPromise = (async () => {
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
    })();
  }
  return cssReadyPromise;
}

export async function registerMalayalamPdfFont(doc) {
  const { regular, bold } = await loadFontBase64();

  doc.addFileToVFS("NotoSansMalayalam-Regular.ttf", regular);
  doc.addFont("NotoSansMalayalam-Regular.ttf", PDF_FONT_NAME, "normal");

  doc.addFileToVFS("NotoSansMalayalam-Bold.ttf", bold);
  doc.addFont("NotoSansMalayalam-Bold.ttf", PDF_FONT_NAME, "bold");

  doc.setFont(PDF_FONT_NAME, "normal");
}
