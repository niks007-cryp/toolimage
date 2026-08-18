/**
 * ToolImage workbench — Monochrome Instrument: direct local processing with only the controls needed now.
 */
import { ChangeEvent, DragEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDownToLine, ArrowLeft, Check, ChevronDown, FileImage, ImageDown, LoaderCircle, LockKeyhole, RefreshCw, SlidersHorizontal, Upload, WandSparkles } from "lucide-react";
import { ImageFormat, ImageJobResult, compressToTarget, convertImage, downloadResult, formatBytes, getFormatLabel, getImageDetails, ImageDetails, isAcceptedImage, resizeImage } from "@/lib/imageProcessing";

export type StudioMode = "compress" | "resize" | "convert";

const targetOptions = [
  { label: "20 KB", value: 20 * 1024 }, { label: "50 KB", value: 50 * 1024 }, { label: "100 KB", value: 100 * 1024 },
  { label: "200 KB", value: 200 * 1024 }, { label: "500 KB", value: 500 * 1024 }, { label: "1 MB", value: 1024 * 1024 }, { label: "2 MB", value: 2 * 1024 * 1024 },
];

const resizePresets = [
  { label: "Instagram post", width: 1080, height: 1080 }, { label: "Instagram story", width: 1080, height: 1920 },
  { label: "YouTube thumbnail", width: 1280, height: 720 }, { label: "LinkedIn post", width: 1200, height: 627 },
];

const modeCopy = {
  compress: { action: "Compress", title: "Compress to a precise size.", helper: "Choose a target. We’ll preserve as much quality as possible." },
  resize: { action: "Resize image", title: "Resize without the guesswork.", helper: "Set the dimensions or start with a useful preset." },
  convert: { action: "Convert image", title: "Change the format. Keep the image.", helper: "Make the file work where you need it." },
} as const;

function formatReduction(original: number, current: number) {
  if (current >= original) return "0%";
  return `${(((original - current) / original) * 100).toFixed(1)}%`;
}

export function ImageStudio({ mode, compact = false }: { mode: StudioMode; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const originalPreviewRef = useRef<string | null>(null);
  const resultPreviewRef = useRef<string | null>(null);
  const reducedMotion = useReducedMotion();
  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState<ImageDetails | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ImageJobResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState(200 * 1024);
  const [customTarget, setCustomTarget] = useState("");
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [keepRatio, setKeepRatio] = useState(true);
  const [format, setFormat] = useState<ImageFormat>("image/webp");

  useEffect(() => () => {
    if (originalPreviewRef.current) URL.revokeObjectURL(originalPreviewRef.current);
    if (resultPreviewRef.current) URL.revokeObjectURL(resultPreviewRef.current);
  }, []);

  const reset = () => {
    if (originalPreviewRef.current) URL.revokeObjectURL(originalPreviewRef.current);
    if (resultPreviewRef.current) URL.revokeObjectURL(resultPreviewRef.current);
    originalPreviewRef.current = null;
    resultPreviewRef.current = null;
    setFile(null); setDetails(null); setOriginalPreview(null); setResult(null); setError(null); setProcessing(false);
  };

  const applyFile = async (candidate?: File) => {
    if (!candidate) return;
    reset();
    if (!isAcceptedImage(candidate)) {
      setError("That file type isn’t supported yet. Try JPG, PNG or WebP.");
      return;
    }
    try {
      const imageDetails = await getImageDetails(candidate);
      const previewUrl = URL.createObjectURL(candidate);
      originalPreviewRef.current = previewUrl;
      setFile(candidate); setDetails(imageDetails); setOriginalPreview(previewUrl);
      setWidth(imageDetails.width); setHeight(imageDetails.height);
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

  const updateWidth = (next: number) => {
    setWidth(next);
    if (keepRatio && details && next > 0) setHeight(Math.max(1, Math.round(next * details.height / details.width)));
  };
  const updateHeight = (next: number) => {
    setHeight(next);
    if (keepRatio && details && next > 0) setWidth(Math.max(1, Math.round(next * details.width / details.height)));
  };

  const processImage = async () => {
    if (!file || !details) return;
    const customBytes = Number(customTarget) * 1024;
    const activeTarget = customTarget ? customBytes : target;
    if (mode === "compress" && (!Number.isFinite(activeTarget) || activeTarget < 8 * 1024 || activeTarget > 10 * 1024 * 1024)) {
      setError("Enter a target between 8 KB and 10 MB."); return;
    }
    if (mode === "resize" && (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width > 8000 || height > 8000)) {
      setError("Use dimensions between 1 and 8,000 pixels."); return;
    }
    setError(null); setProcessing(true); setResult(null);
    try {
      const processed = mode === "compress"
        ? await compressToTarget(file, activeTarget)
        : mode === "resize"
          ? await resizeImage(file, width, height)
          : await convertImage(file, format);
      resultPreviewRef.current = processed.previewUrl;
      setResult(processed);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "We couldn’t finish that image. Please try again.");
    } finally { setProcessing(false); }
  };

  const applyPreset = (preset: typeof resizePresets[number]) => { setWidth(preset.width); setHeight(preset.height); setKeepRatio(false); };
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
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} className="sr-only" />
          <div className="dropzone__status"><span><i /> INPUT READY</span><span>LOCAL WORKSPACE / 30 MB MAX</span></div>
          <div className="dropzone__ticks" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          <motion.span className="dropzone__icon" animate={isDragging && !reducedMotion ? { y: -4 } : { y: 0 }}><Upload size={23} strokeWidth={1.7} /></motion.span>
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
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} className="sr-only" />
      <div className="workspace__topline"><button type="button" className="text-button" onClick={reset}><ArrowLeft size={15} /> New image</button><span className="local-indicator"><LockKeyhole size={13} /> Local only</span></div>
      <div className="workspace__grid">
        <div className="preview-pane">
          <div className={result ? "image-comparison" : "image-stage"}>
            <img src={originalPreview} alt={`Original ${details.name}`} className="original-image" />
            {result && <><div className="comparison-result" style={{ width: `${comparisonPosition}%` }}><img src={result.previewUrl} alt={`Processed ${details.name}`} className="result-image" /></div><span className="comparison-line" style={{ left: `${comparisonPosition}%` }} aria-hidden="true" /></>}
            <div className="stage-labels"><span>{result ? "Original" : getFormatLabel(details.type)}</span>{result && <span>Processed</span>}</div>
          </div>
          {result ? (
            <div className="result-callout"><div><span className="success-mark"><Check size={15} /></span><div><strong>{result.hitTarget === false ? "Smallest practical version created" : "Your image is ready"}</strong><p>{result.hitTarget === false ? "The requested target would substantially reduce quality." : "Check the result, then download it."}</p></div></div><button type="button" className="secondary-button" onClick={() => downloadResult(result.blob, details.name, result.format)}><ArrowDownToLine size={16} /> Download</button></div>
          ) : <div className="preview-caption"><FileImage size={15} /><span>Preview at original dimensions</span></div>}
        </div>
        <aside className="control-pane">
          <div className="file-readout"><div><span className="eyebrow">ORIGINAL</span><strong title={details.name}>{details.name}</strong></div><button type="button" aria-label="Choose another image" className="icon-button" onClick={() => inputRef.current?.click()}><RefreshCw size={16} /></button></div>
          <dl className="file-specs"><div><dt>File size</dt><dd>{formatBytes(details.size)}</dd></div><div><dt>Dimensions</dt><dd>{details.width.toLocaleString()} × {details.height.toLocaleString()}</dd></div><div><dt>Format</dt><dd>{getFormatLabel(details.type)}</dd></div></dl>
          {mode === "compress" && <div className="control-block"><div className="control-label"><span>Target size</span><small>Closest practical result</small></div><div className="target-grid">{targetOptions.map((option) => <button type="button" key={option.value} className={!customTarget && target === option.value ? "target-button is-selected" : "target-button"} onClick={() => { setTarget(option.value); setCustomTarget(""); }}>{option.label}</button>)}</div><label className="custom-target"><span>Custom</span><input aria-label="Custom target size in kilobytes" value={customTarget} onChange={(event) => setCustomTarget(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="e.g. 350" inputMode="decimal" /><em>KB</em></label></div>}
          {mode === "resize" && <div className="control-block"><div className="control-label"><span>Dimensions</span><small>Pixels</small></div><div className="dimension-inputs"><label><span>Width</span><input aria-label="Width in pixels" type="number" value={width} min={1} max={8000} onChange={(event) => updateWidth(Number(event.target.value))} /></label><span className="dimension-times">×</span><label><span>Height</span><input aria-label="Height in pixels" type="number" value={height} min={1} max={8000} onChange={(event) => updateHeight(Number(event.target.value))} /></label></div><button type="button" className={keepRatio ? "ratio-toggle is-active" : "ratio-toggle"} onClick={() => setKeepRatio((state) => !state)}><span className="ratio-dot" /> Keep aspect ratio</button><div className="preset-row">{resizePresets.map((preset) => <button key={preset.label} type="button" onClick={() => applyPreset(preset)}>{preset.label}</button>)}</div></div>}
          {mode === "convert" && <div className="control-block"><div className="control-label"><span>Convert to</span><small>Your image remains local</small></div><div className="format-list">{(["image/jpeg", "image/png", "image/webp"] as ImageFormat[]).map((candidate) => <button type="button" key={candidate} className={format === candidate ? "format-option is-selected" : "format-option"} onClick={() => setFormat(candidate)}><span className="format-glyph">{getFormatLabel(candidate)}</span><span>{candidate === "image/jpeg" ? "Best for photos" : candidate === "image/png" ? "Keeps transparency" : "Small, modern format"}</span><Check size={16} /></button>)}</div></div>}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="form-error" role="alert">{error}</motion.div>}</AnimatePresence>
          <button type="button" className="primary-button" disabled={processing} onClick={processImage}>{processing ? <><LoaderCircle className="spin" size={17} /> Processing locally</> : <>{mode === "compress" ? <WandSparkles size={17} /> : mode === "resize" ? <SlidersHorizontal size={17} /> : <ImageDown size={17} />}{copy.action}</>}</button>
          {result && <div className="result-stats"><span className="eyebrow">RESULT</span><div><span>File size</span><strong>{formatBytes(result.blob.size)}</strong></div>{mode === "compress" && <div><span>Saved</span><strong>{formatReduction(details.size, result.blob.size)}</strong></div>}<div><span>Output</span><strong>{result.width.toLocaleString()} × {result.height.toLocaleString()} · {getFormatLabel(result.format)}</strong></div></div>}
          <p className="control-note"><LockKeyhole size={13} /> The image never leaves this browser.</p>
        </aside>
      </div>
    </section>
  );
}
