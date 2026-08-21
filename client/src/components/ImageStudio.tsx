/**
 * ToolImage workbench — Monochrome Instrument: direct local processing with only the controls needed now.
 */
import { ChangeEvent, DragEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownToLine, ArrowLeft, Check, ChevronDown, FileImage, ImageDown, LoaderCircle, LockKeyhole, RefreshCw, SlidersHorizontal, Upload, WandSparkles } from "lucide-react";
import { ImageFormat, ImageJobResult, compressToTarget, convertImage, downloadResult, formatBytes, getFormatLabel, getImageDetails, ImageDetails, resizeImage } from "@/lib/imageProcessing";
import { trackToolCompleted } from "@/lib/analytics";

export type StudioMode = "compress" | "resize" | "convert";

const targetOptions = [
  { label: "20 KB", value: 20 * 1024 }, { label: "50 KB", value: 50 * 1024 }, { label: "100 KB", value: 100 * 1024 },
  { label: "200 KB", value: 200 * 1024 }, { label: "500 KB", value: 500 * 1024 }, { label: "1 MB", value: 1024 * 1024 }, { label: "2 MB", value: 2 * 1024 * 1024 },
];

const resizePresets = [
  { label: "Instagram post", width: 1080, height: 1080 }, { label: "Instagram story", width: 1080, height: 1920 },
  { label: "YouTube thumbnail", width: 1280, height: 720 }, { label: "LinkedIn post", width: 1200, height: 627 },
];

const MAX_RESIZE_DIMENSION = 8000;

function dimensionError(value: string, label: "Width" | "Height") {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (!/^\d+$/.test(trimmed)) return `${label} must be a whole number of pixels.`;
  const pixels = Number(trimmed);
  if (!Number.isSafeInteger(pixels) || pixels < 1) return `${label} must be at least 1 px.`;
  if (pixels > MAX_RESIZE_DIMENSION) return `${label} must be ${MAX_RESIZE_DIMENSION.toLocaleString()} px or less.`;
  return null;
}

const modeCopy = {
  compress: { action: "Compress", title: "Compress to a precise size.", helper: "Choose a target. We’ll preserve as much quality as possible." },
  resize: { action: "Resize image", title: "Resize without the guesswork.", helper: "Set the dimensions or start with a useful preset." },
  convert: { action: "Convert image", title: "Change the format. Keep the image.", helper: "Make the file work where you need it." },
} as const;

function formatReduction(original: number, current: number) {
  if (current >= original) return "0%";
  return `${(((original - current) / original) * 100).toFixed(1)}%`;
}

export function ImageStudio({ mode, compact = false, initialTargetBytes }: { mode: StudioMode; compact?: boolean; initialTargetBytes?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const originalPreviewRef = useRef<string | null>(null);
  const resultPreviewRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState<ImageDetails | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ImageJobResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState(initialTargetBytes ?? 200 * 1024);
  const [customTarget, setCustomTarget] = useState("");
  const [width, setWidth] = useState("1200");
  const [height, setHeight] = useState("800");
  const [keepRatio, setKeepRatio] = useState(true);
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [resizeSuccess, setResizeSuccess] = useState<{ width: number; height: number; blob: Blob; format: ImageFormat; name: string } | null>(null);

  useEffect(() => () => {
    if (originalPreviewRef.current) URL.revokeObjectURL(originalPreviewRef.current);
    if (resultPreviewRef.current) URL.revokeObjectURL(resultPreviewRef.current);
  }, []);

  useEffect(() => {
    if (initialTargetBytes) { setTarget(initialTargetBytes); setCustomTarget(""); }
  }, [initialTargetBytes]);

  const reset = () => {
    if (originalPreviewRef.current) URL.revokeObjectURL(originalPreviewRef.current);
    if (resultPreviewRef.current) URL.revokeObjectURL(resultPreviewRef.current);
    originalPreviewRef.current = null;
    resultPreviewRef.current = null;
    setFile(null); setDetails(null); setOriginalPreview(null); setResult(null); setResizeSuccess(null); setError(null); setProcessing(false);
  };

  const applyFile = async (candidate?: File) => {
    if (!candidate) return;
    reset();
    try {
      const imageDetails = await getImageDetails(candidate);
      const previewUrl = URL.createObjectURL(candidate);
      originalPreviewRef.current = previewUrl;
      setFile(candidate); setDetails(imageDetails); setOriginalPreview(previewUrl);
      setWidth(String(imageDetails.width)); setHeight(String(imageDetails.height));
      setFormat(imageDetails.type === "image/png" ? "image/webp" : imageDetails.type);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "We couldn’t open that image.");
    }
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => applyFile(event.target.files?.[0]);
  const dragOver = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(true); };
  const dragLeave = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); };
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); applyFile(event.dataTransfer.files?.[0]); };
  const activateDropZone = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } };

  const updateWidth = (next: string) => {
    setWidth(next);
    if (keepRatio && details && /^\d+$/.test(next) && Number(next) > 0) setHeight(String(Math.max(1, Math.round(Number(next) * details.height / details.width))));
  };
  const updateHeight = (next: string) => {
    setHeight(next);
    if (keepRatio && details && /^\d+$/.test(next) && Number(next) > 0) setWidth(String(Math.max(1, Math.round(Number(next) * details.width / details.height))));
  };

  const toggleRatio = () => {
    if (!keepRatio && details && /^\d+$/.test(width) && Number(width) > 0) setHeight(String(Math.max(1, Math.round(Number(width) * details.height / details.width))));
    setKeepRatio((state) => !state);
  };

  const processImage = async () => {
    if (!file || !details) return;
    const customBytes = Number(customTarget) * 1024;
    const activeTarget = customTarget ? customBytes : target;
    if (mode === "compress" && (!Number.isFinite(activeTarget) || activeTarget < 8 * 1024 || activeTarget > 10 * 1024 * 1024)) {
      setError("Enter a target between 8 KB and 10 MB."); return;
    }
    const widthIssue = mode === "resize" ? dimensionError(width, "Width") : null;
    const heightIssue = mode === "resize" ? dimensionError(height, "Height") : null;
    if (widthIssue || heightIssue) {
      setError(widthIssue || heightIssue); return;
    }
    const requestedWidth = Number(width);
    const requestedHeight = Number(height);
    setError(null); setProcessing(true); setResult(null); setResizeSuccess(null);
    try {
      const processed = mode === "compress"
        ? await compressToTarget(file, activeTarget, details.type)
        : mode === "resize"
          ? await resizeImage(file, requestedWidth, requestedHeight, details.type)
          : await convertImage(file, format);
      if (mode === "resize") {
        const extension = processed.format === "image/jpeg" ? "jpg" : processed.format.split("/")[1];
        const verified = await getImageDetails(new File([processed.blob], `verified-resize.${extension}`, { type: processed.format }));
        if (verified.width !== requestedWidth || verified.height !== requestedHeight) {
          URL.revokeObjectURL(processed.previewUrl);
          throw new Error("We couldn’t verify the requested output dimensions. Please try again.");
        }
        processed.width = verified.width;
        processed.height = verified.height;
        setResizeSuccess({ width: verified.width, height: verified.height, blob: processed.blob, format: processed.format, name: details.name });
      }
      resultPreviewRef.current = processed.previewUrl;
      setResult(processed);
      trackToolCompleted(mode, details.type, processed.format, mode === "compress" ? activeTarget : undefined);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "We couldn’t finish that image. Please try again.");
    } finally { setProcessing(false); }
  };

  const applyPreset = (preset: typeof resizePresets[number]) => { setWidth(String(preset.width)); setHeight(String(preset.height)); setKeepRatio(false); };
  const comparisonPosition = result && details ? Math.max(20, Math.min(80, 50 + ((details.size - result.blob.size) / details.size) * 20)) : 50;
  const copy = modeCopy[mode];

  if (!file || !details || !originalPreview) {
    return (
      <section className={compact ? "image-studio image-studio--compact" : "image-studio"} aria-label={`${copy.action} tool`}>
        {!compact && <div className="studio-heading"><span className="eyebrow">{mode === "compress" ? "TARGET-SIZE COMPRESSOR" : mode === "resize" ? "IMAGE RESIZER" : "IMAGE CONVERTER"}</span><h2>{copy.title}</h2><p>{copy.helper}</p></div>}
        <div
          className={isDragging ? "dropzone is-dragging" : "dropzone"}
          role="button" tabIndex={0} aria-label="Upload an image" onClick={() => inputRef.current?.click()} onKeyDown={activateDropZone}
          onDragOver={dragOver} onDragLeave={dragLeave} onDrop={drop}
        >
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectFile} className="sr-only" />
          <div className="dropzone__status"><span><i /> INPUT READY</span><span>LOCAL WORKSPACE / 30 MB MAX</span></div>
          <div className="dropzone__ticks" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          <span className="dropzone__icon"><Upload size={23} strokeWidth={1.7} /></span>
          <div><strong>{isDragging ? "Drop it to begin" : "Drop an image here"}</strong><span>or browse your device</span></div>
          <span className="dropzone__formats">JPG, PNG &amp; WebP · up to 30 MB</span>
        </div>
        <div className="privacy-chip"><LockKeyhole size={13} /> Processed locally. Never uploaded.</div>
        {error && <div className="form-error" role="alert">{error}</div>}
      </section>
    );
  }

  return (
    <section className="workspace" aria-label={`${copy.action} workspace`}>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectFile} className="sr-only" />
      <div className="workspace__topline"><button type="button" className="text-button" onClick={reset}><ArrowLeft size={15} /> New image</button><span className="local-indicator"><LockKeyhole size={13} /> Local only</span></div>
      <div className="workspace__grid">
        <div className="preview-pane">
          <div className={result ? "image-comparison" : "image-stage"}>
            <img src={originalPreview} alt={`Original ${details.name}`} className="original-image" />
            {result && <><div className="comparison-result" style={{ width: `${comparisonPosition}%` }}><img src={result.previewUrl} alt={`Processed ${details.name}`} className="result-image" /></div><span className="comparison-line" style={{ left: `${comparisonPosition}%` }} aria-hidden="true" /></>}
            <div className="stage-labels"><span>{result ? "Original" : getFormatLabel(details.type)}</span>{result && <span>Processed</span>}</div>
          </div>
          {result ? (
            <><div className="result-callout"><div><span className="success-mark"><Check size={15} /></span><div><strong>{result.alreadyWithinTarget ? "Your image already fits the target" : result.hitTarget === false ? "Smallest practical version created" : "Your image is ready"}</strong><p>{result.alreadyWithinTarget ? "The original file was already smaller than your selected size." : result.hitTarget === false ? "The requested target would substantially reduce quality." : "Check the result, then download it."}</p></div></div><button type="button" className="secondary-button" onClick={() => downloadResult(result.blob, details.name, result.format)}><ArrowDownToLine size={16} /> Download</button></div><p className="download-help">On iPhone or iPad, the result may open in a new tab. Long-press the image there and choose <strong>Save to Photos</strong>.</p></>
          ) : <div className="preview-caption"><FileImage size={15} /><span>Preview at original dimensions</span></div>}
        </div>
        <aside className="control-pane">
          <div className="file-readout"><div><span className="eyebrow">ORIGINAL</span><strong title={details.name}>{details.name}</strong></div><button type="button" aria-label="Choose another image" className="icon-button" onClick={() => inputRef.current?.click()}><RefreshCw size={16} /></button></div>
          <dl className="file-specs"><div><dt>File size</dt><dd>{formatBytes(details.size)}</dd></div><div><dt>Dimensions</dt><dd>{details.width.toLocaleString()} × {details.height.toLocaleString()}</dd></div><div><dt>Format</dt><dd>{getFormatLabel(details.type)}</dd></div></dl>
          {mode === "compress" && <div className="control-block"><div className="control-label"><span>Target size</span><small>Closest practical result</small></div><div className="target-grid">{targetOptions.map((option) => <button type="button" key={option.value} className={!customTarget && target === option.value ? "target-button is-selected" : "target-button"} onClick={() => { setTarget(option.value); setCustomTarget(""); }}>{option.label}</button>)}</div><label className="custom-target"><span>Custom</span><input aria-label="Custom target size in kilobytes" value={customTarget} onChange={(event) => setCustomTarget(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="e.g. 350" inputMode="decimal" /><em>KB</em></label>{details.type === "image/png" && <p className="format-note">PNG has no browser quality setting. For a target size, ToolImage creates a compact WebP locally and keeps transparent areas where supported.</p>}</div>}
          {mode === "resize" && <div className="control-block"><div className="control-label"><span>Exact dimensions</span><small>Whole pixels</small></div><div className="dimension-inputs"><label><span>Width</span><div className="pixel-field"><input aria-label="Width in pixels" type="text" inputMode="numeric" pattern="[0-9]*" value={width} onChange={(event) => updateWidth(event.target.value)} /><em>px</em></div>{dimensionError(width, "Width") && <small className="dimension-error">{dimensionError(width, "Width")}</small>}</label><span className="dimension-times">×</span><label><span>Height</span><div className="pixel-field"><input aria-label="Height in pixels" type="text" inputMode="numeric" pattern="[0-9]*" value={height} onChange={(event) => updateHeight(event.target.value)} /><em>px</em></div>{dimensionError(height, "Height") && <small className="dimension-error">{dimensionError(height, "Height")}</small>}</label></div><button type="button" className={keepRatio ? "ratio-toggle is-active" : "ratio-toggle"} aria-pressed={keepRatio} onClick={toggleRatio}><span className="ratio-dot" /> Maintain aspect ratio</button>{!keepRatio && <p className="dimension-warning">Aspect ratio is off. ToolImage will resize to these exact dimensions, which may stretch or crop the visual proportions.</p>}<div className="preset-row">{resizePresets.map((preset) => <button key={preset.label} type="button" onClick={() => applyPreset(preset)}>{preset.label}</button>)}</div></div>}
          {mode === "convert" && <div className="control-block"><div className="control-label"><span>Convert to</span><small>Your image remains local</small></div><div className="format-list">{(["image/jpeg", "image/png", "image/webp"] as ImageFormat[]).map((candidate) => <button type="button" key={candidate} className={format === candidate ? "format-option is-selected" : "format-option"} onClick={() => setFormat(candidate)}><span className="format-glyph">{getFormatLabel(candidate)}</span><span>{candidate === "image/jpeg" ? "Best for photos" : candidate === "image/png" ? "Keeps transparency" : "Small, modern format"}</span><Check size={16} /></button>)}</div></div>}
          {error && <div className="form-error" role="alert">{error}</div>}
          <button type="button" className="primary-button" disabled={processing} onClick={processImage}>{processing ? <><LoaderCircle className="spin" size={17} /> Processing locally</> : <>{mode === "compress" ? <WandSparkles size={17} /> : mode === "resize" ? <SlidersHorizontal size={17} /> : <ImageDown size={17} />}{copy.action}</>}</button>
          {result && <div className="result-stats"><span className="eyebrow">RESULT</span><div><span>File size</span><strong>{formatBytes(result.blob.size)}</strong></div>{mode === "compress" && <div><span>Saved</span><strong>{formatReduction(details.size, result.blob.size)}</strong></div>}<div><span>Output</span><strong>{result.width.toLocaleString()} × {result.height.toLocaleString()} · {getFormatLabel(result.format)}</strong></div></div>}
          <p className="control-note"><LockKeyhole size={13} /> The image never leaves this browser.</p>
        </aside>
      </div>
      <AnimatePresence>
        {mode === "resize" && resizeSuccess && <motion.div className="resize-success-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><motion.div className="resize-success-dialog" role="dialog" aria-modal="true" aria-labelledby="resize-success-title" initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 6 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}><span className="resize-success-mark"><Check size={18} /></span><p className="eyebrow">LOCAL RESIZE COMPLETE</p><h3 id="resize-success-title">Image resized successfully</h3><p className="resize-success-dimensions">{resizeSuccess.width.toLocaleString()} × {resizeSuccess.height.toLocaleString()} px</p><p>Your image was checked after processing to confirm the exact pixel dimensions.</p><div className="resize-success-actions"><button type="button" className="primary-button" onClick={() => downloadResult(resizeSuccess.blob, resizeSuccess.name, resizeSuccess.format)}><ArrowDownToLine size={16} /> Download Image</button><button type="button" className="text-button" onClick={reset}>Resize another</button></div></motion.div></motion.div>}
      </AnimatePresence>
    </section>
  );
}
