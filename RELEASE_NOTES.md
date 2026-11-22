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
