import notoMalayalamRegularUrl from "../assets/fonts/NotoSansMalayalam-Regular.ttf?url";
import notoMalayalamBoldUrl from "../assets/fonts/NotoSansMalayalam-Bold.ttf?url";

export const MALAYALAM_FONT_FAMILY = "MiladFlow Export Malayalam";

const STYLE_TAG_ATTR = "data-milad-export-font";

let readyPromise = null;

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

/**
 * Injects a real <style> @font-face block (base64 data: URIs, so it never
 * needs another network round-trip once loaded) and waits for both weights
 * to actually be usable before resolving. Safe to call repeatedly — the
 * work only happens once per page session.
 */
export function ensureMalayalamFontFace() {
  if (!readyPromise) {
    readyPromise = (async () => {
      if (!document.querySelector(`style[${STYLE_TAG_ATTR}]`)) {
        const [regularBase64, boldBase64] = await Promise.all([
          fetchAsBase64(notoMalayalamRegularUrl),
          fetchAsBase64(notoMalayalamBoldUrl),
        ]);

        const style = document.createElement("style");
        style.setAttribute(STYLE_TAG_ATTR, "true");
        style.textContent = `
          @font-face {
            font-family: "${MALAYALAM_FONT_FAMILY}";
            src: url(data:font/ttf;base64,${regularBase64}) format("truetype");
            font-weight: 400;
            font-style: normal;
            font-display: block;
          }
          @font-face {
            font-family: "${MALAYALAM_FONT_FAMILY}";
            src: url(data:font/ttf;base64,${boldBase64}) format("truetype");
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
  return readyPromise;
}