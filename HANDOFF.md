# Twirl v2 — Session Handoff

**Created:** 2026-06-17  
**Owner:** Cooper Porter  
**Goal:** Ship a publishable App Store app — P2P clothing rental for U of A sororities (Twirl).

---

## 1. Executive summary

Cooper restarted the project **greenfield** to avoid fixing dated v1 UI while risking a fragile v1 backend. The plan is:

- **New GitHub repo** + **new Supabase project** + **new UI** (from design mocks)
- Build **backend in auditable sections** (A = app data, B = payments)
- **Earnings / cash-out is launch-critical** (real Stripe money, not a fake DB counter)
- **Expo Go + sim** for most UI work; **dev build** only when testing Stripe
- **App Store** is the last step — after test-mode money flow works

**Current state:** Migrations + edge functions in repo. **Apply to Supabase with `db push`. No Expo app yet.**

---

## 2. Project references

| Resource | Value |
|----------|--------|
| **v2 GitHub repo** | https://github.com/Diamond9k/Twirl-Rentals |
| **Local path** | `~/Twirl-Hub/repo/Twirl-Rentals` |
| **v2 Supabase project** | `Twirl Rentals` |
| **v2 Supabase ref** | `lcbywlafowwfrtsakhlv` |
| **v2 Supabase URL** | `https://lcbywlafowwfrtsakhlv.supabase.co` |
| **v1 GitHub (archive)** | https://github.com/Diamond9k/Twirl |
| **v1 local path** | `~/Twirl-Hub/repo/Twirl` |
| **v1 Supabase (do not use)** | `qlulzatkhgblorbjndsz` |
| **Stripe** | Test mode first (`pk_test_` / `sk_test_`) |
| **Privacy policy target** | https://twirl.rentals/privacy (Hostinger Horizons) |
| **Launch target** | August 2026 rush (flex for correctness) |

**Abandoned:** Supabase ref `awofwyhdneorgdaortns` — do not use.

---

## 3. What exists in v2 repo today

```
Twirl-Rentals/
├── README.md
├── TWIRL.md                 ← short catch-up pointer
├── HANDOFF.md               ← this file
├── .env.example             ← v2 Supabase URL prefilled
├── .gitignore
├── docs/
│   ├── design-inventory.md  ← mock → route → tables (approve before Expo bulk)
│   ├── v2-build-map.md      ← section map A / B
│   └── v2-backend-audit.md  ← PASS/FAIL checklist
└── supabase/
    ├── config.toml
    ├── migrations/          # 7 SQL files (20260617*)
    └── functions/           # 7 edge fns + _shared
```

**Not in repo yet:** `app/`, `package.json`, Expo, components.

**Git status:** Backend SQL + edge functions ready to commit/push; run `supabase db push` after link.

---

## 4. What v1 was (reference only)

### v1 worked (UI / patterns to copy)
- 14 expo-router screens, auth, browse, list, item detail, contract, rentals, messages, profile
- Supabase tables: profiles, items, saved_items, conversations, messages, rentals, rental_contracts, reviews, reports, blocked_users
- Edge fns in git: create-payment-intent, release-deposit, create-connect-account, delete-account
- Realtime chat, unread via `unread_user1` / `unread_user2`

### v1 broken / do not replicate
- **Owners never paid via Stripe** — `total_earnings` is a Postgres counter only
- **Deposit hold** often not actually confirmed on renter card
- **Approve → pay mismatch** — `create-payment-intent` requires `pending`, owner sets `approved`
- **Client can update `rentals.status`** — no server-gated transitions
- **`create-payment-intent` trusts client amount** — not server-derived
- **No stripe-webhook**, no `payout_ledger`, no earnings/cash-out screen
- **saved_items, blocked_users, reports** — tables exist, app never wired
- **Repo ≠ live DB drift** — `handle_new_user` trigger, `stripe_account_id` not in schema.sql

Full audit: `~/Twirl-Hub/repo/Twirl/TWIRL_OVERHAUL_REPORT.md`

---

## 5. New UI mocks (design source of truth)

Cooper provided Claude Design mock screenshots. **Filler copy** (brands, dates) is not canonical; **layout and flows** are.

### Screens identified from mocks

| Screen | Key features |
|--------|----------------|
| Browse / home | Search, filter icon, item grid, hearts |
| Filters sheet | Occasion, size, price range, chapter, available dates |
| Search results | Dedicated results grid with lender avatar |
| Item detail | Carousel, brand, price, size, lender card, date picker modal |
| Confirm & pay | Rental breakdown, deposit, terms checkbox, payment method |
| Rental agreement | Legal sections, agree & continue |
| Rentals / active | Status, “what’s next”, mark returned modal |
| Messages | Item context card, block user modal |
| Public profile | Abby’s closet, message, save |
| My closet | Active / Rented / Drafts tabs, edit pencil |
| Edit listing | Photos, occasion chips, size, condition sheet |
| Photo tips | Onboarding before upload |
| Edit profile | Avatar, sorority, bio, multi-size |
| Settings | Edit profile, payment methods, payout, notifications, legal |
| Earnings | Available balance, cash out, payout history, bank •••• |

### Open product decisions (not locked)

| Decision | Options | Blocks |
|----------|---------|--------|
| Cash-out model | **A) manual button** ✅ locked | B5.3 |
| Tab bar layout | 4 tabs (mocks) vs 5 tabs (v1) | `(tabs)/_layout` |
| Renter mark returned | Yes (mocks) vs owner-only (v1) | A6.5 |
| Checkout route name | `checkout/[id]` vs `contract/[id]` | B3 |

**Created:** `docs/design-inventory.md` — mock → route → tables per screen (draft for Cooper approval).

---

## 6. Build strategy

### Top-level split

```
A. APP UI/UX FUNCTIONALITY  — Supabase tables, RLS, reads/writes for screens
B. PAYMENT FUNCTIONS      — Stripe, Connect, webhooks, earnings, cash-out
```

### Rules
1. **One section at a time** → audit PASS → commit → next
2. **Section A through A6** before Section B payments
3. **Stripe test mode** until end-to-end money proven
4. **No TestFlight** until B3+ tested on dev build
5. **GitHub** saves work; does **not** block running Expo locally

### Phase order (App Store path)

| Phase | Work | Tool |
|-------|------|------|
| 0 | Repo + empty Supabase | ✅ done |
| 1 | Expo bootstrap + A1 auth + first UI slice | Expo Go |
| 2 | Listings, browse, rental request (A3–A6) | Expo Go |
| 3 | Messages, reviews, block (A7–A8) | Expo Go |
| 4 | Payments + earnings (B1–B5) | **Dev build** |
| 5 | TestFlight → App Store | EAS |

### First vertical slice (proves Expo ↔ Supabase)

1. Bootstrap Expo in `Twirl-Rentals`
2. Apply **A1.1** migration (`profiles` + auth trigger)
3. Login/signup screen (new UI style)
4. **Audit:** sign up → row in `profiles` in Supabase dashboard

---

## 7. Backend section map (abbreviated)

Full checklist: `docs/v2-backend-audit.md`  
Full map: `docs/v2-build-map.md`

### A — App (build before payments)

| Section | Delivers |
|---------|----------|
| A1 | Foundation, profiles, auth, avatar storage |
| A2 | Edit profile, settings, public profile |
| A3 | Items, images, create/edit listing, closet tabs |
| A4 | Browse, search, filters, saved items |
| A5 | Item detail, rental request (no charge) |
| A6 | Rentals ledger, approve/decline, mark returned |
| A7 | Messages, realtime, unread |
| A8 | Reviews, block, reports |
| A9 | Legal hooks |

### B — Payments (launch-critical earnings)

| Section | Delivers |
|---------|----------|
| B1 | Stripe secrets, webhook, idempotency |
| B2 | Connect onboarding |
| B3 | Checkout — server pricing, rental + deposit intents |
| B4 | Return flow — capture, release deposit, **transfer 85% to owner** |
| B5 | **Earnings screen, balance, payout history, cash out** |
| B6 | Edge cases — failed pay, cancel refund, delete guard |

**v1 mistake to avoid:** incrementing `profiles.total_earnings` without Stripe transfer. v2 needs `payout_ledger` + Stripe as source of truth.

---

## 8. Tooling

| Tool | Role |
|------|------|
| **Cursor** | Primary builder — Expo, Supabase migrations, sim, MCP |
| **Claude Code** | Optional — speckit, spec, section reviews; open from Twirl dir for skills |
| **Supabase MCP** | Connected — `list_tables`, `apply_migration`, `execute_sql`, advisors |
| **Expo Go** | UI iteration (no real Stripe) |
| **EAS dev build** | Required for Stripe / Apple Pay testing |
| **v1 repo** | Read-only reference for patterns and edge fn logic |

### Supabase MCP verified projects
- `qlulzatkhgblorbjndsz` — Twirl (v1)
- `lcbywlafowwfrtsakhlv` — Twirl Rentals (v2) — **public schema: 0 tables**

---

## 9. Environment setup (for next session)

```bash
cd ~/Twirl-Hub/repo/Twirl-Rentals
cursor .

cp .env.example .env
# Fill EXPO_PUBLIC_SUPABASE_ANON_KEY from:
# Dashboard → Twirl Rentals → Settings → API

supabase login
supabase link --project-ref lcbywlafowwfrtsakhlv
```

**Never commit:** `.env`, service role key, Stripe secret key.

---

## 10. Dependency cheat sheet

```
GitHub repo     ── does NOT block ──► Expo app runs locally
Expo app shell  ── can use mock data ──► UI polish
Supabase A1     ── required for ──► real login
Supabase A3     ── required for ──► real listings
Supabase A5–A6  ── required for ──► rental flow (no money)
Supabase B3     ── required for ──► real payments
Dev build       ── required for ──► Stripe in app
Supabase B5     ── required for ──► earnings / cash out UI
TestFlight      ── requires ──► B tested + legal + delete account
App Store       ── requires ──► TestFlight QA pass
```

---

## 11. App Store checklist (not started)

- [ ] Apple Developer account
- [ ] Privacy policy live at twirl.rentals/privacy
- [ ] Terms of service
- [ ] In-app account deletion (v1 has edge fn — port to v2)
- [ ] Test-mode payments end-to-end
- [ ] LLC filed (Cooper action)
- [ ] EAS build → TestFlight
- [ ] App Store metadata + screenshots

---

## 12. Symptom → where to look

| Symptom | Go to |
|---------|--------|
| Signup / profile | A1, `profiles`, auth trigger |
| Listing / photos | A3, `items`, `item-images` bucket |
| Browse / search | A4 |
| Rent request | A5, `rentals` insert |
| Approve / status stuck | A6, transition RPCs |
| Chat / unread | A7, `conversations`, `messages` |
| Block / review | A8 |
| Pay button fails | B3, `create-payment-intent` |
| Owner not paid | B4, Stripe transfer |
| Cash out wrong | B5, `payout_ledger`, `get-earnings` |
| Expo won’t connect | `.env`, `lib/supabase.ts`, RLS |

---

## 13. Next steps (pick up here)

**Immediate (recommended order):**

1. [ ] Open `Twirl-Rentals` in Cursor (not old `Twirl`)
2. [ ] Commit + push repo scaffold if not already on GitHub
3. [ ] `supabase link --project-ref lcbywlafowwfrtsakhlv`
4. [x] Create `docs/design-inventory.md` — mock → route → tables (**review + approve §6–§7**)
5. [ ] Bootstrap Expo app in repo
6. [ ] Apply **A1.1** migration (profiles + signup trigger) via MCP or CLI
7. [ ] Wire login/signup → audit PASS on A1
8. [x] Lock cash-out model → **manual button** (owner taps Cash Out; `request-payout` edge fn)

**Say to resume:** *"Read HANDOFF.md in Twirl-Rentals and continue at step [N]"*

---

## 14. Key decisions log

| Date | Decision |
|------|----------|
| 2026-06-16 | Greenfield Supabase (not fix v1) |
| 2026-06-16 | Earnings/cash-out launch-critical |
| 2026-06-16 | New repo `Twirl-Rentals` separate from v1 `Twirl` |
| 2026-06-16 | Supabase v2 = `lcbywlafowwfrtsakhlv` |
| 2026-06-16 | Repo scaffold before backend migrations |
| 2026-06-16 | Cursor = primary builder; Claude Code optional for spec |
| 2026-06-16 | No TestFlight until payments work in test mode |
| 2026-06-16 | Cash-out model | **Manual button** — owner-initiated via earnings screen; no auto daily sweep |

---

## 15. Files to read first (new agent)

1. `HANDOFF.md` (this file)
2. `docs/v2-backend-audit.md`
3. `docs/v2-build-map.md`
4. v1 reference: `~/Twirl-Hub/repo/Twirl/TWIRL_OVERHAUL_REPORT.md` (money/security findings only)

**Do not** apply v1 migrations to v2 wholesale. **Do not** point v2 app at v1 Supabase.

---

*End of handoff.*
