# v0.2.2 — Phone usability and in-game accommodations

- Removed TV Preview tab and footer link from ordinary players. Paired host devices keep Player / Host / TV Preview navigation.
- Compact mobile category board appears at the top when it is time to select a question; Player View scrolls to the top when a board/question loads.
- iPhone text fields use a minimum 16px font to avoid automatic Safari zoom; answer textboxes no longer force focus; keyboard dismisses on answer submission.
- Player questions and Final Word questions now use a distinctive, high-contrast presentation with a category/value badge and separate countdown.
- Hosts can pause the show and adjust individual accommodations, including extra hints, first-letter reveal, answer-length reveal and bonus time. Used written hints are preserved when bonus allowance changes.
- Clarified: the private host QR is only for securely pairing another host device; it is not necessary when already using the device with Host Controls.
- Existing v0.2 game rooms continue to work; no Supabase schema or environment variable changes are needed.
- 17 gameplay/regression tests passed, plus shim-based TypeScript validation. Full Next.js production build not verified in this environment.

---

# The Know Show v0.2.1 — Host can play update

## Fixes and additions

- Host and player identity can coexist on **one phone/browser**. Host and player credentials use separate saved tokens, so joining a game no longer takes host permissions away.
- Three persistent device tabs: **My Player View**, **Host Controls**, **TV Preview**. The TV preview has a visible Back button and does not start a second Suno player. The actual full-screen `/display/ROOMCODE` remains available for casting to the TV.
- In the Green Room, hosts see a **Join as a player** button, which opens the normal name/age form while preserving host control.
- Drafted but unsubmitted answers survive switching to Host Controls and back.
- The answer key and written hint are no longer sent to the host during a live question; the Final Word key is also hidden until results are revealed. This prevents spoilers for someone hosting and competing at the same time.
- Existing v0.2 rooms and Supabase tables remain compatible. Existing single-token v0.2 browsers attempt automatic migration to host or player credentials.
- Sixteenth engine regression test added (16 passing), covering the dual-role flow, authorization-token selection, and answer-key privacy. Full Next.js build not verified in this environment due to unavailable dependencies.

## Deployment

Extract `the-know-show-v0.2.1.zip`. Upload the **contents** of its outer `the-know-show` folder to the repository root, replacing files. Commit and allow Vercel to redeploy. No new Supabase SQL or environment variables are required.

If you already lost host access in v0.2.0 by joining as a player, open the room on the laptop that originally created it, expand its private host QR/link, and scan it again on your phone; v0.2.1 preserves both credentials.
