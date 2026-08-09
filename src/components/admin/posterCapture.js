import { toPng } from "html-to-image";

export async function waitForImages(node) {
  if (!node) return;
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      }
      return new Promise((resolve) => {
        const done = () => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve();
        };
        img.addEventListener("load", done);
        img.addEventListener("error", done);
      });
    }),
  );
}

const GOOGLE_FONTS_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

let cachedFontEmbedCSS = null;
async function getFontEmbedCSS() {
  if (cachedFontEmbedCSS) return cachedFontEmbedCSS;
  try {
    const res = await fetch(GOOGLE_FONTS_CSS_URL);
    cachedFontEmbedCSS = await res.text();
  } catch {
    cachedFontEmbedCSS = "";
  }
  return cachedFontEmbedCSS;
}

export async function waitForFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await document.fonts.ready;
    await Promise.all(
      [
        '600 14px "Manrope"',
        '700 14px "Manrope"',
        '800 14px "Manrope"',
        '600 48px "Cormorant Garamond"',
        'italic 600 48px "Cormorant Garamond"',
      ].map((font) => document.fonts.load(font).catch(() => {})),
    );
  } catch {}
}

export async function captureNode(node, { backgroundColor = "#0a0a0a" } = {}) {
  if (!node) return null;
  const [, fontEmbedCSS] = await Promise.all([
    waitForImages(node),
    waitForFonts(),
    getFontEmbedCSS(),
  ]);
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
  return toPng(node, {
    pixelRatio: 3,
    backgroundColor,
    cacheBust: true,
    width: node.offsetWidth,
    height: node.offsetHeight,
    fontEmbedCSS,
    style: {
      transform: "none",
    },
  });
}

export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function shareDataUrl(
  dataUrl,
  { filename, title, caption, fallbackUrl },
) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title, text: caption });
    return "shared-file";
  }

  if (navigator.share) {
    await navigator.share({ title, text: caption, url: fallbackUrl });
    return "shared-text-only";
  }

  downloadDataUrl(dataUrl, filename);
  return "downloaded-fallback";
}
