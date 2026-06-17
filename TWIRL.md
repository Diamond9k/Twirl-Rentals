# TWIRL v2 — Continue Here

> **New agent?** Read **`HANDOFF.md`** first — full context, decisions, next steps.

> Greenfield rebuild. App + Supabase v2. v1 (`Diamond9k/Twirl`) is reference only.

## Projects

| What | Where |
|------|--------|
| **This repo** | `Diamond9k/Twirl-Rentals` |
| **Supabase v2** | `Twirl Rentals` — ref `lcbywlafowwfrtsakhlv` |
| **Supabase v1 (archive)** | `Twirl` — ref `qlulzatkhgblorbjndsz` — do not use for new work |
| **v1 app reference** | `~/Twirl-Hub/repo/Twirl` |

## Current phase

**Repo scaffold** — structure + docs in place. **No migrations applied yet.**

## Next step

1. Open this repo in Cursor: `cd ~/Twirl-Hub/repo/Twirl-Rentals && cursor .`
2. Link Supabase: `supabase login && supabase link --project-ref lcbywlafowwfrtsakhlv`
3. Copy `.env.example` → `.env` and fill anon key from dashboard
4. Say **"start A1.1"** — first migration (`profiles` + auth trigger)

## Build map

See `docs/v2-build-map.md`. Audit checklist: `docs/v2-backend-audit.md`.

## Rules

- One section at a time → audit PASS → then next section
- Section A (app data) before Section B (payments)
- Stripe test mode until money flow is proven end-to-end
- Earnings / cash-out is launch-critical (Section B5)
