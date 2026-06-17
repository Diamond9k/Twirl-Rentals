# Twirl v2 build map

Two tracks. **A** = app data the UI needs. **B** = Stripe money. Build A through A6 before B.

## Dependency order

```
A1 Foundation → A3 Listings → A4 Browse → A5 Rental request → A6 Ledger
  → A7 Messaging → A8 Trust → B1–B3 Checkout → B4–B5 Payouts
```

## Symptom → section

| Symptom | Section |
|---------|---------|
| Signup / profile broken | A1 |
| Listing / photos | A3 |
| Browse / search / filters | A4 |
| Rent request | A5 |
| Approve / return status | A6 |
| Chat / unread | A7 |
| Block / review | A8 |
| Pay button | B3 |
| Owner not paid | B4 |
| Cash out / earnings | B5 |

Full audit checklist: `v2-backend-audit.md`.

## v1 reference

Copy patterns from `~/Twirl-Hub/repo/Twirl` — do not copy DDL blindly. v1 had repo/live drift and fake `total_earnings`.
