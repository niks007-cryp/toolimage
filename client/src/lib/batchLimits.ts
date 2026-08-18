/** ToolImage Pro batch limits — fixed browser-local guardrails used before any image decoding or processing begins. */
export const MAX_BATCH_FILES = 50;
export const MAX_BATCH_TOTAL_BYTES = 750 * 1024 * 1024;

export type SizedBatchInput = { size: number };

export function inspectBatchLimits(files: SizedBatchInput[]) {
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  return {
    fileCount: files.length,
    totalBytes,
    fileCountExceeded: files.length > MAX_BATCH_FILES,
    totalBytesExceeded: totalBytes > MAX_BATCH_TOTAL_BYTES,
  };
}
