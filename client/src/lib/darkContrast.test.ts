import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("shared dark-mode light-surface contrast contract", () => {
  const styles = source("client/src/index.css");
  const toolPage = source("client/src/pages/ToolPage.tsx");
  const home = source("client/src/pages/Home.tsx");

  it("marks the intentionally light shared tool hero with the reusable surface contract", () => {
    expect(toolPage).toContain('className="tool-hero surface-light"');
    expect(home).toContain('className="how-section surface-light"');
  });

  it("keeps retained light surfaces dark-foregrounded even when the document has the dark class", () => {
    expect(styles).toContain("--surface-light-foreground: #1f2823");
    expect(styles).toContain(".dark .surface-light");
    expect(styles).toContain(".dark .surface-light :is(h1, h2, h3, strong) { color: var(--surface-light-foreground);");
    expect(styles).toContain(".dark .surface-light h1 em { color: var(--surface-light-accent);");
  });

  it("does not flatten every section into a dark surface", () => {
    expect(styles).toContain("background-color: var(--surface-light-background)");
    expect(styles).not.toContain(".dark .surface-light { background-color: #101714");
  });
});
