import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const tools = readFileSync(resolve(process.cwd(), "client/src/pages/Tools.tsx"), "utf8");

describe("shared tool-card CTA flow", () => {
  it("uses a shared flex column for the Tool index cards instead of absolute CTA placement", () => {
    expect(styles).toContain(".info-tool-card { display: flex; flex-direction: column; }");
    expect(styles).toContain(".info-tool-card .text-link { align-self: flex-start; color: #0d786d; flex: 0 0 auto; margin-top: auto; position: static;");
  });

  it("keeps the Home tool-card arrow in normal flex flow", () => {
    expect(styles).toContain(".tool-arrow { align-self: flex-end; color: #0d786d; flex: 0 0 auto; margin-top: auto; position: static;");
  });

  it("covers the shared Home and Tool-index card consumers", () => {
    expect(home).toContain('className="tool-card tool-card--compress"');
    expect(tools).toContain('className="info-tool-card"');
    expect(tools).toContain("Open tool");
  });
});
