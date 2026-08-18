import { describe, expect, it } from "vitest";
import { inspectBatchLimits, MAX_BATCH_FILES, MAX_BATCH_TOTAL_BYTES } from "./batchLimits";

const files = (count: number, size: number) => Array.from({ length: count }, () => ({ size }));

describe("ToolImage Pro batch limits", () => {
  it("allows 50 files below 750 MB", () => {
    const result = inspectBatchLimits(files(MAX_BATCH_FILES, 1024));
    expect(result.fileCountExceeded).toBe(false);
    expect(result.totalBytesExceeded).toBe(false);
  });

  it("rejects 51 files", () => {
    expect(inspectBatchLimits(files(MAX_BATCH_FILES + 1, 1)).fileCountExceeded).toBe(true);
  });

  it("allows input below 750 MB and rejects input above it", () => {
    expect(inspectBatchLimits([{ size: MAX_BATCH_TOTAL_BYTES - 1 }]).totalBytesExceeded).toBe(false);
    expect(inspectBatchLimits([{ size: MAX_BATCH_TOTAL_BYTES + 1 }]).totalBytesExceeded).toBe(true);
  });

  it("allows exactly 750 MB", () => {
    expect(inspectBatchLimits([{ size: MAX_BATCH_TOTAL_BYTES }]).totalBytesExceeded).toBe(false);
  });
});
