import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const imageStudio = readFileSync(resolve(process.cwd(), "client/src/components/ImageStudio.tsx"), "utf8");

describe("iOS result-preview intent", () => {
  it("keeps the native long-press save path and an explicit Download action without suppressing image interaction", () => {
    expect(imageStudio).toContain("Long-press the image there and choose");
    expect(imageStudio).toContain("Save to Photos");
    expect(imageStudio).toContain("Download");
    expect(imageStudio).not.toContain("onContextMenu");
    expect(imageStudio).not.toContain("-webkit-touch-callout");
  });
});
