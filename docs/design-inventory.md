# Twirl v2 — Design inventory

**Purpose:** Map Cooper’s UI mocks → Expo Router routes → Supabase tables / edge functions.  
**Use this before bulk Expo work.** Filler copy in mocks is not canonical; layout and flows are.

**Status:** Draft for Cooper approval (2026-06-17).

---

## 1. Navigation model

### Proposed tab bar (matches mocks — **4 tabs**)

| Tab | Mock label | Route | v1 equivalent |
|-----|------------|-------|---------------|
| Browse | Home / grid | `(tabs)/index` | `(tabs)/index` |
| Closet | My closet | `(tabs)/closet` | `(tabs)/profile` + `(tabs)/list` split |
| Rentals | Active rentals | `(tabs)/rentals` | `(tabs)/rentals` |
| Messages | Inbox | `(tabs)/messages` | `(tabs)/messages` |

**Open decision:** Mocks show 4 tabs; v1 had 5 (Browse, List, Rentals, Messages, You). Recommendation: **4 tabs** — list/edit lives under Closet; profile/settings/earnings stack from Closet header or settings icon.

### Auth stack (not in mocks — required)

| Screen | Route | Section |
|--------|-------|---------|
| Login | `(auth)/login` | A1 |
| Signup step 1 | `(auth)/signup` | A1 |
| Signup step 2 (profile basics) | `(auth)/onboarding` | A1 |

### Modal / stack routes (outside tabs)

| Mock screen | Proposed route | v1 route | Notes |
|-------------|----------------|----------|-------|
| Search results | `search` | *(inline on index)* | Dedicated screen per mock |
| Filters sheet | `filters` (modal) | *(inline)* | `presentation: 'modal'` |
| Item detail | `item/[id]` | `item/[id]` | Date picker modal on same screen |
| Confirm & pay | `checkout/[id]` | `contract/[id]` | **Open:** keep `checkout` name (mock language) |
| Rental agreement | `agreement/[rentalId]` | part of contract | Can be step before checkout or combined |
| Conversation thread | `conversation/[id]` | `conversation/[id]` | |
| Public profile | `user/[id]` | *(missing in v1)* | From item card, messages, search |
| Edit listing | `listing/edit` or `listing/[id]` | `(tabs)/list` | Create = edit with no id |
| Photo tips | `listing/photo-tips` | *(missing)* | UI-only onboarding |
| Edit profile | `settings/profile` | *(missing)* | |
| Settings | `settings` | *(missing)* | Hub for legal, payout, notifications |
| Earnings / cash out | `settings/earnings` | *(missing)* | **Launch-critical** |
| Payout / Connect onboarding | `settings/payout` | *(missing)* | Stripe Connect web flow |
| Block user modal | inline on `conversation/[id]` | *(missing)* | |
| Mark returned modal | inline on `(tabs)/rentals` | partial in rentals | **Open:** renter can mark (mock) vs owner-only |

### Route tree (target)

```
app/
├── _layout.tsx                 # Auth gate, providers
├── (auth)/
│   ├── login.tsx
│   ├── signup.tsx
│   └── onboarding.tsx
├── (tabs)/
│   ├── _layout.tsx             # 4-tab bar
│   ├── index.tsx               # Browse
│   ├── closet.tsx              # My closet (Active / Rented / Drafts)
│   ├── rentals.tsx
│   └── messages.tsx
├── search.tsx
├── filters.tsx                 # modal
├── item/[id].tsx
├── checkout/[id].tsx           # Confirm & pay
├── agreement/[rentalId].tsx      # Legal scroll + agree
├── conversation/[id].tsx
├── user/[id].tsx               # Public profile
├── listing/
│   ├── [id].tsx                # Edit listing (id=new → create)
│   └── photo-tips.tsx
└── settings/
    ├── index.tsx
    ├── profile.tsx
    ├── earnings.tsx
    ├── payout.tsx
    ├── notifications.tsx
    └── legal.tsx
```

---

## 2. Screen inventory (mock → data contract)

Legend: **R** read, **W** write, **—** UI-only until section ships.

### Auth & foundation

| Mock | Route | Section | Tables / storage | Operations | Edge fns | Mock until |
|------|-------|---------|------------------|------------|----------|------------|
| Login | `(auth)/login` | A1 | `auth.users`, `profiles` | W: signIn | — | A1.2 |
| Signup | `(auth)/signup`, `onboarding` | A1 | `profiles` | W: signUp, update profile | — | A1.2 |
| — | — | A1 | `avatars` bucket | W: upload avatar | — | A1.5 |

**Profile columns (v2):** extend v1 `profiles` — `full_name`, `email`, `school`, `sorority`, `sizes` (text[] for multi-size), `year`, `major`, `hometown`, `avatar_url`, `bio`, `rating`, `total_rentals`, `push_token`, **`stripe_account_id`**, **`stripe_payouts_enabled`**, **`bank_last4`** (B2). **Do not** use v1 `total_earnings` as money source — B5 uses Stripe + `payout_ledger`.

---

### Browse & discovery

| Mock | Route | Section | Tables | Operations | Edge fns | Mock until |
|------|-------|---------|--------|------------|----------|------------|
| Browse / home | `(tabs)/index` | A4 | `items`, `profiles`, `saved_items` | R: feed; W: toggle save | — | A4.1 |
| Filters sheet | `filters` | A4 | `items` | R: filtered query | — | A4.4–A4.7 |
| Search results | `search` | A4 | `items`, `profiles` | R: search + join owner | — | A4.2–A4.3 |

**Filter → query params (client state, applied to Supabase query):**

| Filter UI | Column / logic |
|-----------|----------------|
| Occasion | `items.occasion` |
| Size | `items.size` |
| Price range | `items.price_per_day` between min/max |
| Chapter | `profiles.sorority` via `items.owner_id` join |
| Available dates | `rentals` overlap check — exclude items with conflicting `active`/`paid` rentals |

**Browse card fields:** `items.images[0]`, `title`, `brand`, `price_per_day`, `size`, owner `avatar_url`, heart = `saved_items` row.

---

### Item detail & rental request

| Mock | Route | Section | Tables | Operations | Edge fns | Mock until |
|------|-------|---------|--------|------------|----------|------------|
| Item detail | `item/[id]` | A5 | `items`, `profiles`, `saved_items`, `rentals` | R: item + owner; R: date conflicts; W: save heart | — | A5.1 |
| Date picker modal | `item/[id]` (modal) | A5 | `rentals` | R: blocked dates | — | A5.2 |
| Request rental CTA | `item/[id]` | A5 | `rentals`, `conversations` | W: insert rental `pending`; W: conversation | — | A5.3–A5.4 |

**Detail fields:** image carousel, `brand`, `title`, `description`, `price_per_day`, `deposit`, `size`, `occasion`, `condition` *(v2 column — add in A3)*, lender card from `profiles`.

---

### Checkout & agreement (payments)

| Mock | Route | Section | Tables | Operations | Edge fns | Mock until |
|------|-------|---------|--------|------------|----------|------------|
| Rental agreement | `agreement/[rentalId]` | A9, B3 | `rentals`, `rental_contracts` | R: rental + item; W: `contract_agreed` | — | A9 + B3 |
| Confirm & pay | `checkout/[id]` | B3 | `rentals`, `rental_contracts` | R: server-priced breakdown; W: pay state | `create-payment-intent` | B3 + **dev build** |

**Checkout UI fields (server-derived, not client-trusted):** days × `price_per_day`, platform fee 15%, deposit hold, total due today, saved PM last4 *(optional B3.6)*.

**v1 mistakes to avoid:** amount from client; `approved` vs `pending` mismatch; deposit intent not confirmed.

---

### Rentals ledger

| Mock | Route | Section | Tables | Operations | Edge fns | Mock until |
|------|-------|---------|--------|------------|----------|------------|
| Rentals list | `(tabs)/rentals` | A6 | `rentals`, `items`, `profiles` | R: as renter + as owner | — | A6.2–A6.3 |
| Active rental detail | `(tabs)/rentals` → expand / `rental/[id]` *(optional)* | A6 | `rentals` | R: status timeline | — | A6.6 |
| Mark returned modal | `(tabs)/rentals` | A6, B4 | `rentals` | W: `return_requested_at` or status via **RPC** | `release-deposit` (B4) | A6.5 |

**Status enum (v2, server-gated transitions):** `pending` → `approved` → `paid` → `active` → `return_pending` → `completed` | `cancelled` | `disputed`. Owner approve/decline via RPC, not raw client UPDATE (v1 bug).

**“What’s next” copy:** driven by `rentals.status` + role (renter vs owner).

---

### Messages & trust

| Mock | Route | Section | Tables | Operations | Edge fns | Mock until |
|------|-------|---------|--------|------------|----------|------------|
| Messages inbox | `(tabs)/messages` | A7 | `conversations`, `profiles`, `items` | R: list + unread | — | A7.1 |
| Thread | `conversation/[id]` | A7 | `messages`, `conversations` | R/W: messages; W: mark read | — | A7.2–A7.4 |
| Item context card | `conversation/[id]` | A7 | `items` | R: item thumb + title | — | A7.5 |
| Block user modal | `conversation/[id]` | A8 | `blocked_users` | W: block | — | A8.3 |

**Unread:** `unread_user1` / `unread_user2` on `conversations` (v1 pattern works).

---

### Profiles & closet

| Mock | Route | Section | Tables | Operations | Edge fns | Mock until |
|------|-------|---------|--------|------------|----------|------------|
| Public profile | `user/[id]` | A2 | `profiles`, `items`, `reviews` | R: profile + listings; W: message CTA → conversation | — | A2.3 |
| My closet | `(tabs)/closet` | A3 | `items`, `rentals` | R: by tab filter | — | A3.6 |
| Edit listing | `listing/[id]` | A3 | `items`, storage | R/W: item; W: images | — | A3.3–A3.4 |
| Photo tips | `listing/photo-tips` | A3 | — | — | — | **Ship UI anytime** |
| Edit profile | `settings/profile` | A2 | `profiles`, `avatars` | R/W: profile | — | A2.2 |
| Settings hub | `settings` | A2, A9 | `profiles` | R: prefs; links | — | A2.4 |

**Closet tabs:**

| Tab | Query |
|-----|-------|
| Active | `items` where `owner_id = me` and `available = true` and not draft |
| Rented | `items` joined to `rentals` where `status in ('active','paid')` and item out |
| Drafts | `items` where `is_draft = true` *(v2 column)* |

---

### Earnings & payouts (launch-critical)

| Mock | Route | Section | Tables | Operations | Edge fns | Mock until |
|------|-------|---------|--------|------------|----------|------------|
| Earnings | `settings/earnings` | B5 | `payout_ledger`, `profiles` | R: balance + history | `get-earnings` | B5.1–B5.2 |
| Cash out button | `settings/earnings` | B5 | `payout_ledger` | W: request payout | `request-payout` | B5.3 |
| Bank •••• display | `settings/earnings` | B2, B5 | `profiles` | R: `bank_last4` | Connect webhook | B2.4 |
| Payout setup | `settings/payout` | B2 | `profiles` | W: start onboarding | `create-connect-account` | B2 + **dev build** |

**Locked decision:** **Manual cash out** — owner taps “Cash Out”; no auto daily sweep.

**v2 new table `payout_ledger` (B4/B5):** `id`, `owner_id`, `rental_id`, `stripe_transfer_id`, `amount_cents`, `status` (`pending`|`paid`|`failed`), `created_at`. Balance = sum eligible rows minus completed payouts — **Stripe is source of truth**, ledger for UI + audit.

---

## 3. Supabase schema map (v2 target)

Tables inherited from v1 (with fixes), plus v2 additions.

| Table | Screens using it | Section | v2 changes vs v1 |
|-------|------------------|---------|------------------|
| `profiles` | All social, settings, earnings | A1, A2, B2 | Add Stripe fields; drop fake earnings reliance |
| `items` | Browse, detail, closet, listing | A3, A4 | Add `condition`, `is_draft`; chapter via owner join |
| `saved_items` | Browse hearts, public profile save | A4 | Wire UI (v1 table unused) |
| `rentals` | Detail, checkout, rentals tab | A5, A6, B3, B4 | Status transitions via RPC only |
| `rental_contracts` | Agreement, checkout | A9, B3 | Version tracking |
| `conversations` | Messages | A7 | Same pattern |
| `messages` | Thread | A7 | Same pattern |
| `reviews` | Public profile | A8 | Post-complete rental |
| `blocked_users` | Block modal | A8 | Wire UI + RLS enforcement |
| `reports` | Settings / item report | A8 | Wire UI |
| **`payout_ledger`** | Earnings | B4, B5 | **New** — real money audit trail |

**Storage buckets:** `item-images`, `avatars` (A1.5, A3.2).

**Edge functions (port from v1, rewrite as needed):**

| Function | Screens | Section |
|----------|---------|---------|
| `create-payment-intent` | `checkout/[id]` | B3 |
| `release-deposit` | Rentals return flow | B4 |
| `create-connect-account` | `settings/payout` | B2 |
| `get-earnings` | `settings/earnings` | B5 |
| `request-payout` | `settings/earnings` | B5 |
| `stripe-webhook` | — (server) | B1 |
| `delete-account` | Settings | A2.6 |

---

## 4. Build order vs screens

Use this to decide what can ship with **mock data** in Expo Go vs what needs Supabase / dev build.

| Phase | Screens (static UI OK) | Needs real backend |
|-------|------------------------|-------------------|
| **1 — Shell** | Tab bar, browse grid layout, closet tabs, settings layout, photo tips | — |
| **2 — A1** | Login, signup, onboarding | Auth + `profiles` |
| **3 — A3–A4** | Item cards, filters UI, search UI, edit listing form | `items`, storage, saved |
| **4 — A5–A6** | Item detail, date picker, rentals list, mark returned modal | `rentals`, RPCs |
| **5 — A7–A8** | Messages, thread, block modal, public profile | conversations, block |
| **6 — B*** | Agreement, checkout, earnings | Stripe + edge fns + **dev build** |

---

## 5. v1 route diff summary

| v1 only | v2 action |
|---------|-----------|
| `(tabs)/list` | Merge into `(tabs)/closet` + `listing/[id]` |
| `(tabs)/profile` | Split: closet tab + `settings/*` |
| `contract/[id]` | Rename/split → `agreement/[rentalId]` + `checkout/[id]` |
| No `user/[id]` | Add public profile |
| No earnings | Add `settings/earnings` |
| 5 tabs | **Prefer 4** per mocks (decision open) |

---

## 6. Open decisions (Cooper sign-off)

| # | Question | Recommendation | Blocks |
|---|----------|----------------|--------|
| 1 | Tab count: 4 (mocks) or 5 (v1)? | **4 tabs** — Closet absorbs List + Profile entry | `(tabs)/_layout` |
| 2 | Checkout route name | **`checkout/[id]`** — matches mock copy | B3 file scaffold |
| 3 | Renter “mark returned”? | **Yes** — mock shows renter action; owner confirms in B4 | A6.5 RPC design |
| 4 | Agreement separate screen? | **Yes** — `agreement` then `checkout` (two-step) | Navigation |
| 5 | Dedicated `rental/[id]` detail? | Optional — rentals tab may be enough for MVP | A6.6 scope |

**Locked:** Manual cash-out button (HANDOFF §14).

---

## 7. Approval

- [ ] Cooper approves route tree (§1)
- [ ] Cooper approves 4-tab vs 5-tab
- [ ] Cooper approves open decisions (§6)
- [ ] Then: bootstrap Expo + A1.1 migration

---

*Generated for Twirl-Rentals greenfield. v1 reference: `~/Twirl-Hub/repo/Twirl/app/` (14 routes). Do not copy v1 payment bugs.*
