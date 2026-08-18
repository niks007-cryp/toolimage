import { ImageFormat } from "./imageProcessing";

export type BatchMode = "compress" | "resize" | "convert";

export interface SessionPreset {
  id: string;
  name: string;
  mode: BatchMode;
  targetKb: number;
  width: string;
  height: string;
  format: ImageFormat;
}

const PRESET_KEY = "toolimage-session-presets";

export function getSessionPresets(): SessionPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(PRESET_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((preset): preset is SessionPreset => Boolean(preset && typeof preset.name === "string")) : [];
  } catch { return []; }
}

export function saveSessionPresets(presets: SessionPreset[]) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(PRESET_KEY, JSON.stringify(presets));
}
