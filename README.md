# The Know Show — v0.2 family playtest

This is a complete replacement for the v0.1.2 Next.js source, not just the Soundtrack Lab. It uses the same Supabase `know_show_rooms` and `know_show_members` tables and the same two server-side environment variables.

## Upgrade an existing deployment

1. Download and unzip `the-know-show-v0.2.0.zip`.
2. Upload **everything inside** the extracted project folder to the **root** of your existing `theknowshow` GitHub repository (matching files will be replaced). Do not upload the outer folder, the `.zip`, or `.engine-build`.
3. Commit changes; Vercel redeploys from the connected repository. If GitHub web uploads do not delete old files, remove the unneeded old assets manually. This package does not require changes to Supabase.
4. Open your Vercel site, create a **new room**, and scan the **private host QR** from the creator's private `/room/CODE` screen onto your phone **before** sharing the laptop display. Then open `/display/CODE` on your laptop and share that tab/window to the TV. The TV is a pure spectator display with no host controls.
5. On the TV, press **Play** on the embedded Suno jazz player once. The embedded audio is controlled by Suno, and browser autoplay may block automatic playback.
6. Everyone else joins using the public QR code on the TV or visits `/room/CODE`. Host/players get individual phone views.

The creator's browser holds a private host token in local storage. If you close that browser before pairing another host device or copying the host QR/link, you may lose host access to the room. Never show the private host QR on the TV or post it publicly. Pairing currently **copies host access to another device**; it does not revoke the old host device. There is no account sign-in or formal host-transfer/revocation interface yet.

**Important:** Old rooms created in v0.1.2 use a different stored game-state format; make a new room after deploying v0.2. Existing database tables and keys stay the same.

## v0.2 rules

- **Individual / Everyone Answers (default):** Each player privately types an answer to every question. Correct submissions get base points, plus a speed bonus of up to 25% of the base value; wrong answers give zero. Points and correct responses are revealed together after all players answer or the overall time window ends.
- **Double Take:** Each individual gets two per round. Activate it **after seeing the question** but before submitting; correct answers earn twice the base points **plus the normal speed bonus**. Incorrect answers still cost one Double Take but lose no points. Double Take decisions are individual and hidden until results.
- **Team / Turn-Based:** Teams choose/answer in a fixed rotation, without buzzing. A wrong answer or pass offers the next team **one** steal attempt; a correct steal earns half the question value. The next question goes to the next team in the fixed rotation. No point deductions by default.
- **Round boards:** The Opening Act has five categories with four questions each (100/200/300/400). The Main Event has five different categories (200/400/600/800). The category draft displays **8/10/12 randomly selected options** for **2–3 / 4–5 / 6–8 players**, with a balance of classic and creative types. The pool refreshes between rounds and excludes previously chosen categories.
- **Question bank:** 45 categories, 453 curated **editorially reviewed candidates**, including 29 original creative category themes and 16 classic categories. Each category has at least two choices at each of four difficulty levels, including 93 retained original candidates. A random alternative is selected for each slot. Editorial revision and automated checks do **not** equal independent primary-source verification of every fact; review any disputed fact before public use.
- **Automatic judgment:** Tolerates reasonable misspellings of longer answers (e.g., “cilumbus” for Columbus) and exact aliases, but does not attempt broad semantic understanding. Players can dispute results; this holds the game for a host ruling. The host can adjust a score or skip a faulty question.
- **Accommodations:** Host-assigned extra written hints, extra thinking time, optional first-letter reveal, optional answer-length reveal. Players must tap to reveal their private assistance. Age does not automatically grant bonuses.
- **The Final Word:** Everyone privately wagers up to their nonnegative current score, then answers. Automatic judging applies win/loss of wager, with a host override available.

## TV, phones, and soundtrack

- `/room/CODE`: host controls or personal contestant phone interface.
- `/display/CODE`: spectator screen for the shared laptop/TV, with full-size categories/question, question intro, answer reveals, always-visible scoreboard, public QR code during the lobby, and the Suno player.
- The 12 linked Suno tracks are grouped into six styles (two versions each). **Cool Jazz, Arrangement 1 is the default**. Host can switch style or arrangement during a show. The TV reacts when it refreshes; switching tracks reloads the Suno iframe and typically requires clicking Play again. The **Suno embed owns audio playback and volume**, which cannot currently be controlled reliably from the host phone. It may not loop or rotate tracks automatically. Music requires network connectivity. There are no embedded/downloaded commercial music recordings in this ZIP.
- `/music-test`: standalone 12-song Soundtrack Lab remains available.

## Supabase setup (new install only)

Run `supabase/schema.sql` in Supabase SQL Editor. If you selected **Grant API access to new tables automatically OFF**, the earlier backend grants may also be needed; if the existing v0.1.2 game works, no SQL action is required. All database operations are performed server-side using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (which can be a compatible Supabase `sb_secret_...` key). Never expose secret keys in GitHub, browser code, or `NEXT_PUBLIC_*` variables.

## Technical notes

This app polls Supabase through Next.js API routes. It uses optimistic updates for concurrent answer submission. Client timestamps are not trusted for scoring; the server receives and timestamps submitted answers. Timed progression occurs when a client polls the room, including the TV. If all clients disconnect, the game waits until one reconnects and requests the current state.

The Suno music is used via its public embeddable player for a noncommercial personal/family experiment. Please review Suno's applicable terms before distributing or monetizing the game; the ZIP intentionally contains only links, not recordings.

## Validation

`npm install` then `npm run build` in an environment with package-registry access. Run `npm run test:engine` for engine tests. The package was checked with TypeScript source transpilation and isolated engine tests here, but the production Next.js build could not be executed in this environment because npm registry access failed. Treat v0.2 as a substantial playtest build and use a **fresh room** for your first test.

## Not yet included in this pilot

- Downloaded music tracks, remote Suno volume/play/pause, crossfades, or guaranteed automatic looping/shuffling (the embedded player does not expose reliable remote controls).
- Classical and Modern Pop soundtracks: the supplied catalog contains six styles only. Additional tracks can be added later.
- Polished game-show sound effects: music is available now; the old repeating browser-synth soundtrack has been removed.
- Competitive buzzer mode (intentionally paused after the family playtest).
