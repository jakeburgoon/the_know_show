# The Know Show v1.0.0 — Family Game Night Edition

**Complete, direct replacement for v0.2.5. No Supabase migration required. Create a new room after deployment.**

### Shipped features

- Exactly four categories per round and three Easy/Medium/Hard questions per category (24 regular questions, plus Final Word).
- The Opening Act: 100/300/500. The Main Event: 200/600/1000.
- One Double Take per individual player per round; no carryover.
- One Standard Trivia question bank: 540 QA5 editorial candidates across 45 categories; four alternatives per category/difficulty.
- Explicit acceptable answers and cautious spelling matching that protects numbers and ordinals.
- Automatically shown first-letter accommodations, with optional written hints and answer-length hints.
- Automatic Final Word question reveal once all wagers are locked.
- Dispute banner and direct jump to Host Controls for hosts who are also playing.
- Avoid previously played questions when possible using host-device local history, with an in-room history backup.
- Exact approved main logo integrated as PNG in the home, host, and TV UI, plus derived app icons; streamlined teal/gold styling.
- Retained Phone Only, TV + Phones, private host QR, public join QR, team turns and single steal, host-controlled accommodations, and all 12 Suno arrangements with Cool Jazz default.

### Checks

- 14 v1.0 engine/regression tests passed, including a full two-round game and Final Word.
- TypeScript compilation of the game library passed; TSX syntax checks passed.
- 540 question records audited for required fields and four-per-tier coverage.
- Full Next.js production build and browser-on-device testing have **not** been completed here.

### Known limitations

- QA5 content remains partly editorial rather than individually externally verified (66 direct source checks / 540 questions).
- Recent-question history persists per host browser, not across all devices and accounts.
- Suno embeds require a local Play tap and cannot be reliably controlled for volume or playback from a second device.
- Existing v0.2.x rooms are intentionally incompatible with the v1.0 game schema; create a fresh room.
