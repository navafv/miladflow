import {
  MALAYALAM_FONT_FAMILY,
  PDF_FONT_NAME,
  ensureMalayalamFontFace,
} from "./pdfFonts.js";

const RASTER_SCALE = 2;
const MALAYALAM_RANGE = /[\u0D00-\u0D7F]/;
const MAX_RASTER_WIDTH_PX = 900;
const ELLIPSIS = "…";
const RASTER_JPEG_QUALITY = 0.4;

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

function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  if (ctx.measureText(ELLIPSIS).width > maxWidth) return ELLIPSIS;

  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi + 1) / 2);
    const candidate = text.slice(0, mid) + ELLIPSIS;
    if (ctx.measureText(candidate).width <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return text.slice(0, lo) + ELLIPSIS;
}

function rasterizeLine(text, fontSize, bold, colorRgb, bgRgb) {
  const ctx = getMeasureCtx();
  const weight = bold ? 700 : 400;
  ctx.font = `${weight} ${fontSize}px "${MALAYALAM_FONT_FAMILY}"`;

  const safeText = truncateToWidth(ctx, text, MAX_RASTER_WIDTH_PX - 4);

  const width = Math.max(
    1,
    Math.min(
      MAX_RASTER_WIDTH_PX,
      Math.ceil(ctx.measureText(safeText).width) + 4,
    ),
  );
  const height = Math.ceil(fontSize * 1.4);

  const canvas = ctx.canvas;
  canvas.width = width * RASTER_SCALE;
  canvas.height = height * RASTER_SCALE;

  const rctx = canvas.getContext("2d");
  rctx.scale(RASTER_SCALE, RASTER_SCALE);
  rctx.font = `${weight} ${fontSize}px "${MALAYALAM_FONT_FAMILY}"`;
  rctx.textBaseline = "top";
  rctx.fillStyle = `rgb(${(bgRgb ?? [255, 255, 255]).join(",")})`;
  rctx.fillRect(0, 0, width, height);
  rctx.fillStyle = `rgb(${colorRgb.join(",")})`;
  rctx.fillText(safeText, 2, height * 0.12);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", RASTER_JPEG_QUALITY),
    width,
    height,
  };
}

function rasterizeVerticalLine(
  text,
  fontSize,
  bold,
  colorRgb,
  bgRgb,
  maxRunPx,
) {
  const ctx = getMeasureCtx();
  const weight = bold ? 700 : 400;
  ctx.font = `${weight} ${fontSize}px "${MALAYALAM_FONT_FAMILY}"`;

  const safeText = truncateToWidth(ctx, text, maxRunPx - 4);
  const run = Math.max(
    1,
    Math.min(maxRunPx, Math.ceil(ctx.measureText(safeText).width) + 4),
  );
  const thickness = Math.ceil(fontSize * 1.4);

  const canvas = ctx.canvas;
  canvas.width = thickness * RASTER_SCALE;
  canvas.height = run * RASTER_SCALE;

  const rctx = canvas.getContext("2d");
  rctx.scale(RASTER_SCALE, RASTER_SCALE);
  rctx.fillStyle = `rgb(${(bgRgb ?? [255, 255, 255]).join(",")})`;
  rctx.fillRect(0, 0, thickness, run);
  rctx.translate(0, run);
  rctx.rotate(-Math.PI / 2);
  rctx.font = `${weight} ${fontSize}px "${MALAYALAM_FONT_FAMILY}"`;
  rctx.textBaseline = "top";
  rctx.fillStyle = `rgb(${colorRgb.join(",")})`;
  rctx.fillText(safeText, 2, thickness * 0.12);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", RASTER_JPEG_QUALITY),
    width: thickness,
    height: run,
  };
}

export function drawVerticalHeaderText(
  doc,
  text,
  cellX,
  cellY,
  cellWidth,
  cellHeight,
  { fontSize, bold = true, color = [23, 23, 23], bgColor, maxRun } = {},
) {
  if (!text) return;
  const cap = Math.max(20, Math.min(maxRun ?? cellHeight, cellHeight));
  const { dataUrl, width, height } = rasterizeVerticalLine(
    text,
    fontSize,
    bold,
    color,
    bgColor,
    cap,
  );
  const drawX = cellX + (cellWidth - width) / 2;
  const drawY = cellY + (cellHeight - height) / 2;
  doc.addImage(dataUrl, "JPEG", drawX, drawY, width, height);
}

export function drawTextLine(
  doc,
  text,
  x,
  y,
  { fontSize, bold = false, color = [23, 23, 23], align = "left", bgColor },
) {
  if (!text) return 0;

  if (!containsMalayalam(text)) {
    doc.setFont(PDF_FONT_NAME, bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.text(text, x, y, { align });
    return doc.getTextWidth(text);
  }

  const { dataUrl, width, height } = rasterizeLine(
    text,
    fontSize,
    bold,
    color,
    bgColor,
  );
  let imgX = x;
  if (align === "center") imgX = x - width / 2;
  else if (align === "right") imgX = x - width;
  doc.addImage(dataUrl, "JPEG", imgX, y - fontSize * 0.83, width, height);
  return width;
}

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
    bgColor,
  },
) {
  const lh = lineHeight ?? fontSize * 1.18;
  const lines = measureWrap(doc, text, maxWidth, fontSize, bold);
  lines.forEach((line) => {
    drawTextLine(doc, line, x, y, { fontSize, bold, color, align, bgColor });
    y += lh;
  });
  return y;
}
