# Twirl v2 — Backend audit log

Mark each section **PASS** or **FAIL** before moving on. If something breaks later, use the section ID to find the migration / edge fn.

## A — App UI/UX functionality

### A1 Foundation & Auth
- [ ] **A1.1** Project bootstrap — `supabase link`, empty public schema
- [ ] **A1.2** Profiles table + `handle_new_user` trigger
- [ ] **A1.3** Auth RLS on `profiles`
- [ ] **A1.4** Signup metadata columns (`year`, `major`, `hometown`, `sizes`, etc.)
- [ ] **A1.5** Avatar storage bucket + policies

### A2 Profiles & Settings
- [ ] **A2.1** Own profile read
- [ ] **A2.2** Edit profile
- [ ] **A2.3** Public profile by id
- [ ] **A2.4** Settings / legal links
- [ ] **A2.5** Notification prefs
- [ ] **A2.6** Account deletion

### A3 Listings
- [ ] **A3.1** Items table
- [ ] **A3.2** Item images storage
- [ ] **A3.3** Create listing
- [ ] **A3.4** Edit listing
- [ ] **A3.5** Remove / unpublish
- [ ] **A3.6** My closet tabs (active / rented / drafts)
- [ ] **A3.7** Photo tips (UI only)

### A4 Browse & Discovery
- [ ] **A4.1** Browse feed
- [ ] **A4.2** Search
- [ ] **A4.3** Search results screen
- [ ] **A4.4** Filters: occasion + size
- [ ] **A4.5** Filters: price range
- [ ] **A4.6** Filters: chapter
- [ ] **A4.7** Filters: available dates
- [ ] **A4.8** Saved items

### A5 Rental request (non-payment)
- [ ] **A5.1** Item detail read
- [ ] **A5.2** Date validation
- [ ] **A5.3** Create rental request
- [ ] **A5.4** Auto-create conversation
- [ ] **A5.5** Contract preview data

### A6 Rentals ledger (non-payment)
- [ ] **A6.1** Rentals schema + status enum
- [ ] **A6.2** List renting
- [ ] **A6.3** List lending
- [ ] **A6.4** Owner approve/decline (server-gated)
- [ ] **A6.5** Renter mark returned
- [ ] **A6.6** Rental detail screen
- [ ] **A6.7** Status badges

### A7 Messaging
- [ ] **A7.1** Conversations list + unread
- [ ] **A7.2** Thread load
- [ ] **A7.3** Send message
- [ ] **A7.4** Realtime
- [ ] **A7.5** Item context card
- [ ] **A7.6** Read receipts (optional)

### A8 Trust & safety
- [ ] **A8.1** Reviews
- [ ] **A8.2** Rating aggregate
- [ ] **A8.3** Block user
- [ ] **A8.4** Block enforcement in RLS
- [ ] **A8.5** Reports

### A9 Legal
- [ ] **A9.1** Privacy policy URL
- [ ] **A9.2** Rental terms content
- [ ] **A9.3** Rental agreement version tracking

## B — Payment functions

### B1 Stripe foundation
- [ ] **B1.1** Secrets + test mode
- [ ] **B1.2** Webhook endpoint
- [ ] **B1.3** Idempotency

### B2 Connect onboarding
- [ ] **B2.1** Create Express account
- [ ] **B2.2** Store Connect id on profile
- [ ] **B2.3** Capability flags via webhook
- [ ] **B2.4** Bank last-4 for UI

### B3 Checkout
- [ ] **B3.1** Server-side pricing
- [ ] **B3.2** Rental charge intent
- [ ] **B3.3** Deposit authorization
- [ ] **B3.4** Payment sheet / Apple Pay (dev build)
- [ ] **B3.5** Record contract
- [ ] **B3.6** Saved payment method (optional)

### B4 Completion & owner payout
- [ ] **B4.1** Owner confirm return
- [ ] **B4.2** Capture rental charge
- [ ] **B4.3** Release deposit
- [ ] **B4.4** Transfer 85% to owner (real Stripe money)
- [ ] **B4.5** Platform 15%
- [ ] **B4.6** Complete rental status
- [ ] **B4.7** Payout ledger row

### B5 Earnings & cash out (launch-critical)
- [ ] **B5.1** Available balance (`get-earnings`)
- [ ] **B5.2** Payout history
- [ ] **B5.3** Cash out button (`request-payout`) — **manual only** (owner taps; no auto payout cron)
- [ ] **B5.4** Connected account display
- [ ] **B5.5** Webhook reconciliation

### B6 Edge cases
- [ ] **B6.1** Failed payment
- [ ] **B6.2** Disputes / damage (defer if post-launch)
- [ ] **B6.3** Refund on cancel
- [ ] **B6.4** Block delete with active rentals
