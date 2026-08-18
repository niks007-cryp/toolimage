/**
 * ToolImage processing core — local, browser-only transforms for the Monochrome Instrument interface.
 * No image bytes are sent to a server: all raster work happens through the user’s Canvas implementation.
 */
export type ImageFormat = "image/jpeg" | "image/png" | "image/webp";

export interface ImageDetails {
  name: string;
  type: ImageFormat;
  width: number;
  height: number;
  size: number;
}

export interface ImageJobResult {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  format: ImageFormat;
  hitTarget?: boolean;
}

const ACCEPTED_TYPES: ImageFormat[] = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 30 * 1024 * 1024;
const MAX_PIXELS = 36_000_000;

export function isAcceptedImage(file: File) {
  return ACCEPTED_TYPES.includes(file.type as ImageFormat);
}

export function getFormatLabel(type: string) {
  if (type === "image/jpeg") return "JPG";
  if (type === "image/png") return "PNG";
  if (type === "image/webp") return "WebP";
  return "Image";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 100 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function getImageDetails(file: File): Promise<ImageDetails> {
  return new Promise((resolve, reject) => {
    if (!isAcceptedImage(file)) {
      reject(new Error("That file type isn’t supported yet. Try JPG, PNG or WebP."));
      return;
    }
    if (file.size === 0) {
      reject(new Error("This file is empty. Choose a JPG, PNG, or WebP image instead."));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error("This image is too large for your browser to process comfortably. Try resizing it first."));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      if (image.naturalWidth * image.naturalHeight > MAX_PIXELS) {
        reject(new Error("This image has very large dimensions for local processing. Try resizing it first."));
        return;
      }
      resolve({
        name: file.name,
        type: file.type as ImageFormat,
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: file.size,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("We couldn’t read that image. It may be corrupted or incomplete."));
    };
    image.src = url;
  });
}

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("We couldn’t read that image. It may be corrupted or incomplete."));
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: ImageFormat, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Your browser could not create this image format."));
    }, type, quality);
  });
}

function drawToCanvas(image: HTMLImageElement, width: number, height: number, fillWhite = false) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { alpha: !fillWhite });
  if (!context) throw new Error("Your browser could not prepare the image workspace.");
  if (fillWhite) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function compressToTarget(file: File, targetBytes: number): Promise<ImageJobResult> {
  const image = await loadImage(file);
  const outputType: ImageFormat = file.type === "image/png" ? "image/webp" : "image/jpeg";
  const fillWhite = outputType === "image/jpeg";
  const initialWidth = image.naturalWidth;
  const initialHeight = image.naturalHeight;
  let scale = 1;
  let bestBlob: Blob | null = null;
  let bestWidth = initialWidth;
  let bestHeight = initialHeight;

  // Each pass searches quality first, then makes only modest dimension reductions if required.
  for (let pass = 0; pass < 7; pass += 1) {
    const width = Math.max(160, Math.round(initialWidth * scale));
    const height = Math.max(160, Math.round(initialHeight * scale));
    const canvas = drawToCanvas(image, width, height, fillWhite);
    let low = 0.08;
    let high = 0.96;
    let candidate: Blob | null = null;

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const quality = (low + high) / 2;
      const blob = await canvasToBlob(canvas, outputType, quality);
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
        bestWidth = width;
        bestHeight = height;
      }
      if (blob.size <= targetBytes) {
        candidate = blob;
        low = quality;
      } else {
        high = quality;
      }
    }
    if (candidate) {
      return {
        blob: candidate,
        previewUrl: URL.createObjectURL(candidate),
        width,
        height,
        format: outputType,
        hitTarget: true,
      };
    }
    scale *= 0.82;
  }
  if (!bestBlob) throw new Error("We couldn’t create a compressed version of this image.");
  return {
    blob: bestBlob,
    previewUrl: URL.createObjectURL(bestBlob),
    width: bestWidth,
    height: bestHeight,
    format: outputType,
    hitTarget: bestBlob.size <= targetBytes,
  };
}

export async function resizeImage(file: File, width: number, height: number): Promise<ImageJobResult> {
  const image = await loadImage(file);
  const canvas = drawToCanvas(image, width, height, file.type === "image/jpeg");
  const blob = await canvasToBlob(canvas, file.type as ImageFormat, file.type === "image/png" ? undefined : 0.92);
  return { blob, previewUrl: URL.createObjectURL(blob), width: canvas.width, height: canvas.height, format: file.type as ImageFormat };
}

export async function convertImage(file: File, format: ImageFormat): Promise<ImageJobResult> {
  const image = await loadImage(file);
  const canvas = drawToCanvas(image, image.naturalWidth, image.naturalHeight, format === "image/jpeg");
  const blob = await canvasToBlob(canvas, format, format === "image/png" ? undefined : 0.92);
  return { blob, previewUrl: URL.createObjectURL(blob), width: canvas.width, height: canvas.height, format };
}

export function downloadResult(blob: Blob, originalName: string, format: ImageFormat) {
  const extension = format === "image/jpeg" ? "jpg" : format.split("/")[1];
  const stem = originalName.replace(/\.[^/.]+$/, "") || "toolimage";
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${stem}-toolimage.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 300);
}
