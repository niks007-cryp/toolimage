/** ToolImage Pro workspace — Monochrome Instrument styling with bounded, browser-local sequential batch work and a compact session-preset rail. */
import JSZip from "jszip";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, Check, FileArchive, FileImage, LoaderCircle, Plus, RefreshCw, Settings2, Trash2, Upload } from "lucide-react";
import { ImageFormat, ImageJobResult, compressToTarget, convertImage, downloadResult, formatBytes, getImageDetails, getFormatLabel, resizeImage } from "@/lib/imageProcessing";
import { inspectBatchLimits, MAX_BATCH_FILES, MAX_BATCH_TOTAL_BYTES } from "@/lib/batchLimits";
import { BatchMode, getSessionPresets, saveSessionPresets, SessionPreset } from "@/lib/sessionPresets";
import { trackBatchProcessed } from "@/lib/analytics";

type JobStatus = "waiting" | "processing" | "complete" | "error";
interface BatchJob { id: string; file: File; status: JobStatus; message?: string; result?: ImageJobResult; }
const labels: Record<BatchMode, string> = { compress: "Compress", resize: "Resize", convert: "Convert" };
const extensionFor = (format: ImageFormat) => format === "image/jpeg" ? "jpg" : format.split("/")[1];
const validPixels = (value: string) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 8000;

export function BatchStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<BatchMode>("compress");
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [targetKb, setTargetKb] = useState("500");
  const [width, setWidth] = useState("1080");
  const [height, setHeight] = useState("1080");
  const [format, setFormat] = useState<ImageFormat>("image/webp");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<SessionPreset[]>(getSessionPresets);
  const [presetName, setPresetName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const completeJobs = useMemo(() => jobs.filter((job) => job.status === "complete" && job.result), [jobs]);
  const totalInputBytes = useMemo(() => jobs.reduce((sum, job) => sum + job.file.size, 0), [jobs]);

  const updateJobs = (id: string, patch: Partial<BatchJob>) => setJobs((current) => current.map((job) => job.id === id ? { ...job, ...patch } : job));
  const limitError = (files: File[]) => {
    const limits = inspectBatchLimits(files);
    const messages = [];
    if (limits.fileCountExceeded) messages.push(`This batch has ${limits.fileCount} files. ToolImage Pro supports up to ${MAX_BATCH_FILES} files per batch.`);
    if (limits.totalBytesExceeded) messages.push(`This batch totals ${formatBytes(limits.totalBytes)}. ToolImage Pro supports up to 750 MB of input per batch.`);
    return messages.join(" ") || null;
  };
  const chooseFiles = (event: ChangeEvent<HTMLInputElement>) => { addFiles(Array.from(event.target.files || [])); event.currentTarget.value = ""; };
  const addFiles = (files: File[]) => {
    setError(null);
    if (!files.length) return;
    const exceeded = limitError(files);
    if (exceeded) { setError(exceeded); return; }
    setJobs(files.map((file, index) => ({ id: `${Date.now()}-${index}-${file.name}`, file, status: "waiting" })));
  };
  const validateSettings = () => {
    if (mode === "compress" && (!/^\d+(\.\d+)?$/.test(targetKb) || Number(targetKb) < 8 || Number(targetKb) > 10240)) return "Use a target between 8 KB and 10 MB.";
    if (mode === "resize" && (!validPixels(width) || !validPixels(height))) return "Use whole width and height values between 1 and 8,000 pixels.";
    return null;
  };
  const processAll = async () => {
    const settingsError = validateSettings();
    if (settingsError) { setError(settingsError); return; }
    if (!jobs.length) { setError("Choose one or more images before processing."); return; }
    const exceeded = limitError(jobs.map((job) => job.file));
    if (exceeded) { setError(exceeded); return; }
    setError(null); setProcessing(true);
    let successfulCount = 0;
    for (const job of jobs) {
      updateJobs(job.id, { status: "processing", message: "Processing locally…", result: undefined });
      try {
        const details = await getImageDetails(job.file);
        const result = mode === "compress" ? await compressToTarget(job.file, Number(targetKb) * 1024, details.type) : mode === "resize" ? await resizeImage(job.file, Number(width), Number(height), details.type) : await convertImage(job.file, format);
        URL.revokeObjectURL(result.previewUrl);
        updateJobs(job.id, { status: "complete", message: "Complete", result });
        successfulCount += 1;
      } catch (issue) { updateJobs(job.id, { status: "error", message: issue instanceof Error ? issue.message : "Couldn’t process this image." }); }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    setProcessing(false);
    trackBatchProcessed(mode, successfulCount, mode === "convert" ? format : undefined);
  };
  const downloadZip = async () => {
    if (!completeJobs.length) return;
    const zip = new JSZip();
    completeJobs.forEach((job, index) => {
      const result = job.result!;
      const stem = job.file.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").slice(0, 70) || `image-${index + 1}`;
      zip.file(`${String(index + 1).padStart(2, "0")}-${stem}-toolimage.${extensionFor(result.format)}`, result.blob);
    });
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "toolimage-batch.zip"; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const savePreset = () => {
    const name = presetName.trim();
    if (!name) { setError("Name your preset before saving it for this session."); return; }
    const settingsError = validateSettings(); if (settingsError) { setError(settingsError); return; }
    const preset: SessionPreset = { id: editingPresetId || `${Date.now()}-${Math.random().toString(16).slice(2)}`, name, mode, targetKb: Number(targetKb), width, height, format };
    const next = editingPresetId ? presets.map((item) => item.id === editingPresetId ? preset : item) : [...presets, preset];
    setPresets(next); saveSessionPresets(next); setPresetName(""); setEditingPresetId(null); setError(null);
  };
  const usePreset = (preset: SessionPreset) => { setMode(preset.mode); setTargetKb(String(preset.targetKb)); setWidth(preset.width); setHeight(preset.height); setFormat(preset.format); };
  const editPreset = (preset: SessionPreset) => { usePreset(preset); setPresetName(preset.name); setEditingPresetId(preset.id); };
  const deletePreset = (id: string) => { const next = presets.filter((preset) => preset.id !== id); setPresets(next); saveSessionPresets(next); if (editingPresetId === id) { setEditingPresetId(null); setPresetName(""); } };

  return <section className="batch-studio" aria-label="Batch image processing workspace"><div className="batch-studio__top"><div><p className="eyebrow">TOOLIMAGE PRO / LOCAL PREVIEW</p><h2>Process more.<br /><em>Do less.</em></h2><p>Apply one setting to a bounded batch. Files stay in this browser while one result is prepared at a time.</p></div><span className="batch-local-chip">No payment flow active</span></div><div className="batch-studio__grid"><div className="batch-main"><div className="batch-mode-tabs" role="tablist" aria-label="Batch operation">{(["compress", "resize", "convert"] as BatchMode[]).map((item) => <button type="button" key={item} role="tab" aria-selected={mode === item} className={mode === item ? "is-active" : ""} onClick={() => setMode(item)}>{labels[item]}</button>)}</div><input ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseFiles} /><button type="button" className="batch-upload" onClick={() => inputRef.current?.click()}><Upload size={19} /><span><strong>{jobs.length ? `${jobs.length} images selected` : "Choose images for a batch"}</strong><small>JPG, PNG & WebP · sequential local processing</small><span className="batch-limit-counter" aria-live="polite"><b>{jobs.length} / {MAX_BATCH_FILES} files</b><b>{formatBytes(totalInputBytes)} / 750 MB</b></span></span><span className="text-link">Select files</span></button><div className="batch-settings">{mode === "compress" && <label><span>Target size</span><div><input value={targetKb} inputMode="decimal" onChange={(event) => setTargetKb(event.target.value.replace(/[^0-9.]/g, ""))} /><em>KB</em></div></label>}{mode === "resize" && <><label><span>Width</span><div><input value={width} inputMode="numeric" onChange={(event) => setWidth(event.target.value.replace(/\D/g, ""))} /><em>px</em></div></label><label><span>Height</span><div><input value={height} inputMode="numeric" onChange={(event) => setHeight(event.target.value.replace(/\D/g, ""))} /><em>px</em></div></label></>}{mode === "convert" && <label><span>Format</span><select value={format} onChange={(event) => setFormat(event.target.value as ImageFormat)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></label>}<button type="button" className="primary-button" disabled={processing || !jobs.length} onClick={processAll}>{processing ? <><LoaderCircle className="spin" size={17} /> Processing</> : <><Settings2 size={17} /> Process all</>}</button></div>{error && <div className="form-error" role="alert">{error}</div>}{jobs.length > 0 && <div className="batch-jobs"><div className="batch-jobs__head"><span>{jobs.length} images selected · {formatBytes(totalInputBytes)} input</span><button type="button" className="text-button" disabled={processing} onClick={() => setJobs([])}><RefreshCw size={14} /> Clear</button></div>{jobs.map((job) => <div className={`batch-job batch-job--${job.status}`} key={job.id}><FileImage size={16} /><span title={job.file.name}>{job.file.name}</span><small>{job.status === "complete" ? `${formatBytes(job.result!.blob.size)} · ${getFormatLabel(job.result!.format)}` : job.message || "Waiting"}</small>{job.status === "complete" ? <button type="button" aria-label={`Download ${job.file.name}`} onClick={() => downloadResult(job.result!.blob, job.file.name, job.result!.format)}><ArrowDownToLine size={15} /></button> : job.status === "processing" ? <LoaderCircle className="spin" size={16} /> : job.status === "error" ? <span className="batch-error">Error</span> : <span className="batch-waiting">Waiting</span>}</div>)}</div>}{completeJobs.length > 0 && <div className="batch-summary"><div><span className="success-mark"><Check size={15} /></span><strong>{completeJobs.length} images processed</strong><small>Download individual files or package the successful results.</small></div><button type="button" className="secondary-button" onClick={downloadZip}><FileArchive size={16} /> Download ZIP</button></div>}</div><aside className="preset-rail"><p className="eyebrow">CUSTOM PRESETS</p><h3>Keep this setup close.</h3><p className="preset-rail__note">Saved only for this browser session. Accounts can add persistent presets later.</p><div className="preset-create"><input value={presetName} placeholder="Preset name" onChange={(event) => setPresetName(event.target.value)} /><button type="button" className="secondary-button" onClick={savePreset}><Plus size={15} /> {editingPresetId ? "Update" : "Save"}</button></div>{presets.length ? <div className="preset-list">{presets.map((preset) => <article key={preset.id}><strong>{preset.name}</strong><small>{labels[preset.mode]} · {preset.mode === "compress" ? `${preset.targetKb} KB` : preset.mode === "resize" ? `${preset.width} × ${preset.height} px` : getFormatLabel(preset.format)}</small><div><button type="button" onClick={() => usePreset(preset)}>Use</button><button type="button" onClick={() => editPreset(preset)}>Edit</button><button type="button" aria-label={`Delete ${preset.name}`} onClick={() => deletePreset(preset.id)}><Trash2 size={14} /></button></div></article>)}</div> : <div className="preset-empty">No session presets yet.</div>}</aside></div></section>;
}
