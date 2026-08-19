export const SUPPORT_ISSUE_TYPES = [
  "Bug / Something isn't working",
  "File processing problem",
  "Download problem",
  "Account / Pro problem",
  "Payment problem",
  "Refund request",
  "Privacy question",
  "Security vulnerability / unauthorized access",
  "Feature request",
  "Other",
] as const;

export type SupportIssueType = (typeof SUPPORT_ISSUE_TYPES)[number];

export type SupportSubmission = {
  email: string;
  issueType: SupportIssueType;
  description: string;
  pageUrl: string;
  browser: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSupportSubmission(value: Partial<Record<keyof SupportSubmission, unknown>>) {
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  const description = typeof value.description === "string" ? value.description.trim() : "";
  const issueType = typeof value.issueType === "string" ? value.issueType : "";
  const pageUrl = typeof value.pageUrl === "string" ? value.pageUrl.trim() : "";
  const browser = typeof value.browser === "string" ? value.browser.trim() : "";

  if (!EMAIL_PATTERN.test(email) || email.length > 320) return { error: "Enter a valid email address." } as const;
  if (!SUPPORT_ISSUE_TYPES.includes(issueType as SupportIssueType)) return { error: "Choose a valid issue type." } as const;
  if (description.length < 20) return { error: "Please describe the issue in at least 20 characters." } as const;
  if (description.length > 5_000) return { error: "Keep the description to 5,000 characters or fewer." } as const;
  if (pageUrl.length > 2_048 || (pageUrl && !/^https?:\/\//i.test(pageUrl))) return { error: "The page address is invalid." } as const;
  if (browser.length > 512) return { error: "The browser information is invalid." } as const;

  return { value: { email, issueType: issueType as SupportIssueType, description, pageUrl, browser } } as const;
}
