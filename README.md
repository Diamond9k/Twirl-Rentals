# Twirl Rentals (v2)

Peer-to-peer clothing rental for U of A sorority marketplace. Greenfield app + Supabase backend.

## Status

- **Repo:** Supabase migrations + edge functions scaffolded (Expo app not bootstrapped yet)
- **Supabase:** `Twirl Rentals` (`lcbywlafowwfrtsakhlv`) — apply migrations with `supabase db push`
- **v1 archive:** [Twirl](https://github.com/Diamond9k/Twirl) + Supabase `qlulzatkhgblorbjndsz`

## Quick start

```bash
git clone https://github.com/Diamond9k/Twirl-Rentals.git
cd Twirl-Rentals
cp .env.example .env   # fill keys from Supabase dashboard
supabase login
supabase link --project-ref lcbywlafowwfrtsakhlv
supabase db push
supabase functions deploy
```

Set edge function secrets in the Supabase dashboard (or CLI):

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_... \
  STRIPE_WEBHOOK_SECRET=whsec_...
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically for edge functions.

## Backend layout

### Migrations (`supabase/migrations/`)

| File | Covers |
|------|--------|
| `20260617000001_foundation.sql` | Extensions, profiles, `handle_new_user`, avatars bucket |
| `20260617000002_items_and_discovery.sql` | Items (`draft`/`active`/`rented`), saved_items, item-images |
| `20260617000003_rentals.sql` | Rentals + RPCs (request, approve/decline/cancel, activate, mark returned) |
| `20260617000004_messaging.sql` | Messages, unread triggers, `mark_conversation_read` |
| `20260617000005_trust_legal.sql` | Rental contracts, reviews, reports |
| `20260617000006_payments.sql` | `payout_ledger`, `stripe_webhook_events`, `delete_user_data` |
| `20260617000007_security_lockdown.sql` | Revoke dangerous RPCs, rental money column guard |

### Edge functions (`supabase/functions/`)

| Function | Purpose |
|----------|---------|
| `create-connect-account` | Express Connect onboarding, **manual** payout schedule |
| `create-payment-intent` | Server-derived pricing; accepts `pending` or `approved` |
| `complete-rental` | Capture rental, release deposit, ledger row, complete rental |
| `stripe-webhook` | Idempotent Stripe event handling |
| `get-earnings` | Balance + payout history (Stripe + ledger) |
| `request-payout` | Manual cash-out button |
| `delete-account` | Teardown + active-rental guard |
| `_shared/` | cors, supabase, stripe helpers |

## v2 vs v1 (money + security)

- No fake `total_earnings` — Stripe balance + `payout_ledger` are the audit trail
- Clients cannot mutate rental status or money fields (RPCs + trigger guard)
- Server-side pricing only (`calculate_rental_pricing` + rental row)
- Block users enforced in conversations/messages RLS
- Webhook idempotency via `stripe_webhook_events`
- Manual payouts only (owner taps Cash Out)

## Docs

| File | Purpose |
|------|---------|
| `HANDOFF.md` | Session handoff, decisions, next steps |
| `TWIRL.md` | Catch-up pointer |
| `docs/v2-build-map.md` | Section map A / B |
| `docs/v2-backend-audit.md` | PASS/FAIL checklist per section |
| `docs/design-inventory.md` | Mock → route → tables |

## Structure

```
app/                 # Expo Router — not bootstrapped yet
supabase/
  migrations/        # 7 ordered SQL files
  functions/         # 7 edge functions + _shared
components/
lib/
```
