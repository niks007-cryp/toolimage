import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { toggleFaqIndex } from "./faqAccordion";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("shared FAQ accordion", () => {
  it("toggles an open FAQ closed and closed FAQ open through the same shared state rule", () => {
    expect(toggleFaqIndex([0], 0)).toEqual([]);
    expect(toggleFaqIndex([], 0)).toEqual([0]);
    expect(toggleFaqIndex([0], 0)).toEqual([]);
  });

  it("preserves the existing multiple-open behavior when another FAQ is selected", () => {
    expect(toggleFaqIndex([0], 2)).toEqual([0, 2]);
    expect(toggleFaqIndex([0, 2], 0)).toEqual([2]);
  });

  it("renders one accessible button trigger with accurate expanded state and an animated answer region", () => {
    const home = source("client/src/pages/Home.tsx");
    const styles = source("client/src/index.css");
    expect(home).toContain('data-accordion-mode="multiple"');
    expect(home).toContain("aria-expanded={isOpen}");
    expect(home).toContain("aria-controls={answerId}");
    expect(home).toContain("role=\"region\"");
    expect(home).toContain("toggleFaqIndex(current, index)");
    expect(styles).toContain(".faq-item.is-open .faq-answer { grid-template-rows: 1fr; }");
    expect(styles).toContain(".faq-answer > div { min-height: 0; overflow: hidden; }");
  });

  it("owns Common Questions Dark Mode foregrounds through scoped semantic FAQ variables", () => {
    const styles = source("client/src/index.css");
    expect(styles).toContain(".dark .faq-section { --faq-foreground: #edf4ee; --faq-muted-foreground: #b7c3ba; --faq-divider: #39473e; --faq-focus: #62c3b4; }");
    expect(styles).toContain(".dark .faq-section .section-rail, .dark .faq-section .faq-list p { color: var(--faq-muted-foreground); }");
    expect(styles).toContain(".dark .faq-section .faq-layout h2, .dark .faq-section .faq-trigger { color: var(--faq-foreground); }");
    expect(styles).toContain(".dark .faq-section .faq-list, .dark .faq-section .faq-item { border-color: var(--faq-divider); }");
    expect(styles).toContain(".dark .faq-section .faq-trigger:focus-visible { outline-color: var(--faq-focus); }");
  });
});
