# Google OAuth Implementation Checklist

- [x] Reconcile the concurrent checkpoint while retaining the approved email magic-link fallback.
- [x] Confirm the current Supabase context and sign-in panel match the Phase 1 audit.
- [x] Add a Supabase Google OAuth action that returns to `/pricing` on the current application origin.
- [x] Add the Google-first sign-in UI while retaining the existing email magic-link fallback.
- [x] Run `pnpm check` and `pnpm build`, fixing only implementation-caused issues.
- [x] Inspect the updated authentication interface at desktop and mobile widths.
- [ ] Save a checkpoint and provide the implementation/testing report.
