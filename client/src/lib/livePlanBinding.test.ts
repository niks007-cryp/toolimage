import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("ToolImage Pro Live checkout binding", () => {
  it("keeps the confirmed INR Live plan server-only and accepts only India checkout requests", () => {
    const planBinding = projectFile("api/_lib/toolimageProPlan.ts");
    const checkout = projectFile("api/subscriptions/create.ts");
    const pricing = projectFile("client/src/pages/Pricing.tsx");
    expect(planBinding).toContain('TOOLIMAGE_PRO_PLAN_ID = "plan_TRGdfbe7eayNRL"');
    expect(planBinding).not.toContain("plan_TRGqIjKVkgj8aU");
    expect(checkout).toContain('body.region !== "india"');
    expect(checkout).toContain("planId !== TOOLIMAGE_PRO_PLAN_ID");
    expect(pricing).toContain('region: "india"');
    expect(pricing).not.toContain("PricingRegionSelector");
  });
});
