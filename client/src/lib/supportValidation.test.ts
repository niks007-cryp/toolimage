import { describe, expect, it } from "vitest";
import { SUPPORT_ISSUE_TYPES, validateSupportSubmission } from "../../../shared/support";

const valid = { email: " Person@Example.com ", issueType: SUPPORT_ISSUE_TYPES[0], description: "The conversion result does not download after I select the format.", pageUrl: "https://toolimage.online/convert-image", browser: "Test browser" };

describe("support validation", () => {
  it("normalizes a complete valid report", () => expect(validateSupportSubmission(valid)).toMatchObject({ value: { email: "person@example.com" } }));
  it("rejects invalid contact and issue values", () => { expect(validateSupportSubmission({ ...valid, email: "invalid" }).error).toBe("Enter a valid email address."); expect(validateSupportSubmission({ ...valid, issueType: "Unknown" }).error).toBe("Choose a valid issue type."); });
  it("enforces report description bounds", () => { expect(validateSupportSubmission({ ...valid, description: "short" }).error).toBe("Please describe the issue in at least 20 characters."); expect(validateSupportSubmission({ ...valid, description: "x".repeat(5_001) }).error).toBe("Keep the description to 5,000 characters or fewer."); });
  it("rejects invalid page and browser metadata", () => { expect(validateSupportSubmission({ ...valid, pageUrl: "javascript:alert(1)" }).error).toBe("The page address is invalid."); expect(validateSupportSubmission({ ...valid, browser: "x".repeat(513) }).error).toBe("The browser information is invalid."); });
});
