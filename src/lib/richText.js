import {
  MALAYALAM_FONT_FAMILY,
  PDF_FONT_NAME,
  ensureMalayalamFontFace,
} from "./pdfFonts.js";

const RASTER_SCALE = 4;
const MALAYALAM_RANGE = /[\u0D00-\u0D7F]/;

export function containsMalayalam(text) {
  return MALAYALAM_RANGE.test(text ?? "");
}

export { ensureMalayalamFontFace };

function getMeasureCtx() {
  const canvas = document.createElement("canvas");
  return canvas.getContext("2d");
}

function wrapWithCanvas(ctx, text, maxWidth) {
  if (!maxWidth) return [text];
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function measureWrap(doc, text, maxWidth, fontSize, bold) {
  if (!text) return [""];
  if (containsMalayalam(text)) {
    const ctx = getMeasureCtx();
    ctx.font = `${bold ? 700 : 400} ${fontSize}px "${MALAYALAM_FONT_FAMILY}"`;
    return wrapWithCanvas(ctx, text, maxWidth);
  }
  doc.setFont(PDF_FONT_NAME, bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  return maxWidth ? doc.splitTextToSize(text, maxWidth) : [text];
}

function rasterizeLine(text, fontSize, bold, colorRgb) {
  const ctx = getMeasureCtx();
  const weight = bold ? 700 : 400;
  ctx.font = `${weight} ${fontSize}px "${MALAYALAM_FONT_FAMILY}"`;
  const width = Math.max(1, Math.ceil(ctx.measureText(text).width) + 4);
  const height = Math.ceil(fontSize * 1.4);

  const canvas = ctx.canvas;
  canvas.width = width * RASTER_SCALE;
  canvas.height = height * RASTER_SCALE;

  const rctx = canvas.getContext("2d");
  rctx.scale(RASTER_SCALE, RASTER_SCALE);
  rctx.font = `${weight} ${fontSize}px "${MALAYALAM_FONT_FAMILY}"`;
  rctx.textBaseline = "top";
  rctx.fillStyle = `rgb(${colorRgb.join(",")})`;
  rctx.clearRect(0, 0, width, height);
  rctx.fillText(text, 2, height * 0.12);

  return { dataUrl: canvas.toDataURL("image/png"), width, height };
}

/**
 * Draws one line of text at (x, y), auto-routing Malayalam text through
 * the canvas rasterizer (correct shaping) and everything else through
 * jsPDF's native text renderer (crisp, selectable).
 * Returns the width consumed (useful for alignment callers that need it).
 */
export function drawTextLine(
  doc,
  text,
  x,
  y,
  { fontSize, bold = false, color = [23, 23, 23], align = "left" },
) {
  if (!text) return 0;

  if (!containsMalayalam(text)) {
    doc.setFont(PDF_FONT_NAME, bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.text(text, x, y, { align });
    return doc.getTextWidth(text);
  }

  const { dataUrl, width, height } = rasterizeLine(text, fontSize, bold, color);
  let imgX = x;
  if (align === "center") imgX = x - width / 2;
  else if (align === "right") imgX = x - width;
  // rasterizeLine draws with textBaseline "top" starting a bit below the
  // canvas top edge; nudge up so it visually aligns with doc.text's baseline.
  doc.addImage(dataUrl, "PNG", imgX, y - fontSize * 0.83, width, height);
  return width;
}

/**
 * Wraps `text` to maxWidth (if given) and draws each line, advancing y by
 * lineHeight. Returns the y position after the last line.
 */
export function drawWrappedText(
  doc,
  text,
  x,
  y,
  {
    fontSize,
    bold = false,
    color = [23, 23, 23],
    align = "left",
    maxWidth,
    lineHeight,
  },
) {
  const lh = lineHeight ?? fontSize * 1.18;
  const lines = measureWrap(doc, text, maxWidth, fontSize, bold);
  lines.forEach((line) => {
    drawTextLine(doc, line, x, y, { fontSize, bold, color, align });
    y += lh;
  });
  return y;
}
