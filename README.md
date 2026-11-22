# The Know Show — v0.2.2 family playtest

This is a complete replacement for the v0.1.2 Next.js source, not just the Soundtrack Lab. It uses the same Supabase `know_show_rooms` and `know_show_members` tables and the same two server-side environment variables.

## Upgrade an existing deployment

1. Download and unzip `the-know-show-v0.2.2.zip`.
2. Upload **everything inside** the extracted project folder to the **root** of your existing `theknowshow` GitHub repository (matching files will be replaced). Do not upload the outer folder, the `.zip`, or `.engine-build`.
3. Commit changes; Vercel redeploys from the connected repository. If GitHub web uploads do not delete old files, remove the unneeded old assets manually. This package does not require changes to Supabase.
4. Open your Vercel site. **Existing v0.2 rooms remain compatible**; you can create a new room if you prefer. On the laptop that created the room, open the **Host Controls** tab and scan the **private host QR** onto your phone. Then open `/display/CODE` on the laptop and share that tab/window to the TV. The TV is a pure spectator display with no host controls.
5. On the TV, press **Play** on the embedded Suno jazz player once. The embedded audio is controlled by Suno, and browser autoplay may block automatic playback.
6. On your phone, choose **My Player View** and join using your name and age, even if you are the host. Your host permissions remain intact. Switch among **My Player View**, **Host Controls**, and **TV Preview** using the tabs at the top; unfinished typed answers stay intact when switching. Only devices with host credentials see the Host and TV Preview tabs. Everyone else joins through the public QR on the TV or `/room/CODE`.

The **public join QR** is for everyone; the **private host QR** is still necessary only when granting host privileges to a different device (for example, a phone when you created the room on a laptop). If you create the room on your phone and already have Host Controls, you do not need to scan it. Never put the private host QR on the TV.

The creator's browser holds a private host token in local storage. Starting in v0.2.1, the same device can separately store its host token and player token, allowing a host to compete without losing the ability to administer the game. An existing single v0.2 token is automatically identified and migrated when you open the room. If you close that browser before pairing another host device or copying the host QR/link, you may lose host access to the room. Never show the private host QR on the TV or post it publicly. Pairing currently **copies host access to another device**; it does not revoke the old host device. There is no account sign-in or formal host-transfer/revocation interface yet.

**Important:** Rooms created in v0.1.2 use a different stored game-state format; create a new room if upgrading directly from that release. Rooms created in v0.2.0 **do not need to be recreated**. Existing database tables and keys stay the same. If v0.2.0 already overwrote your host token with a player login, scan the private host QR from your original creator laptop again; v0.2.1 will keep both tokens.

## v0.2 rules

- **Individual / Everyone Answers (default):** Each player privately types an answer to every question. Correct submissions get base points, plus a speed bonus of up to 25% of the base value; wrong answers give zero. Points and correct responses are revealed together after all players answer or the overall time window ends.
- **Double Take:** Each individual gets two per round. Activate it **after seeing the question** but before submitting; correct answers earn twice the base points **plus the normal speed bonus**. Incorrect answers still cost one Double Take but lose no points. Double Take decisions are individual and hidden until results.
- **Team / Turn-Based:** Teams choose/answer in a fixed rotation, without buzzing. A wrong answer or pass offers the next team **one** steal attempt; a correct steal earns half the question value. The next question goes to the next team in the fixed rotation. No point deductions by default.
- **Round boards:** The Opening Act has five categories with four questions each (100/200/300/400). The Main Event has five different categories (200/400/600/800). The category draft displays **8/10/12 randomly selected options** for **2–3 / 4–5 / 6–8 players**, with a balance of classic and creative types. The pool refreshes between rounds and excludes previously chosen categories.
- **Question bank:** 45 categories, 453 curated **editorially reviewed candidates**, including 29 original creative category themes and 16 classic categories. Each category has at least two choices at each of four difficulty levels, including 93 retained original candidates. A random alternative is selected for each slot. Editorial revision and automated checks do **not** equal independent primary-source verification of every fact; review any disputed fact before public use.
- **Automatic judgment:** Tolerates reasonable misspellings of longer answers (e.g., “cilumbus” for Columbus) and exact aliases, but does not attempt broad semantic understanding. Players can dispute results; this holds the game for a host ruling. The host can adjust a score or skip a faulty question.
- **Accommodations:** Host-assigned extra written hints, extra thinking time, optional first-letter reveal, optional answer-length reveal. Players must tap to reveal their private assistance. Age does not automatically grant bonuses. In v0.2.2, the host can **pause the show** to edit these settings at any point; remaining hints are adjusted by the change in bonus rather than reset.
- **The Final Word:** Everyone privately wagers up to their nonnegative current score, then answers. Automatic judging applies win/loss of wager, with a host override available.

## TV, phones, and soundtrack

- `/room/CODE`: ordinary player phones show a streamlined **Player View** with no redundant TV Preview tab. Paired host devices get **My Player View**, **Host Controls**, and **TV Preview** tabs. The host can join as a contestant, answer normally, and switch back to host duties at any time. Player drafts survive tab changes. The preview has an explicit Back button and omits the Suno player to avoid accidental sound on phones. The mobile question board appears near the top of the screen, and question displays use a distinct, high-contrast panel.
- `/display/CODE`: spectator screen for the shared laptop/TV, with full-size categories/question, question intro, answer reveals, always-visible scoreboard, public QR code during the lobby, and the Suno player.
- The 12 linked Suno tracks are grouped into six styles (two versions each). **Cool Jazz, Arrangement 1 is the default**. Host can switch style or arrangement during a show. The TV reacts when it refreshes; switching tracks reloads the Suno iframe and typically requires clicking Play again. The **Suno embed owns audio playback and volume**, which cannot currently be controlled reliably from the host phone. It may not loop or rotate tracks automatically. Music requires network connectivity. There are no embedded/downloaded commercial music recordings in this ZIP.
- `/music-test`: standalone 12-song Soundtrack Lab remains available.

## Supabase setup (new install only)

Run `supabase/schema.sql` in Supabase SQL Editor. If you selected **Grant API access to new tables automatically OFF**, the earlier backend grants may also be needed; if the existing v0.1.2 game works, no SQL action is required. All database operations are performed server-side using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (which can be a compatible Supabase `sb_secret_...` key). Never expose secret keys in GitHub, browser code, or `NEXT_PUBLIC_*` variables.

## Technical notes

Hosting/playing uses two independently saved room tokens on the same device. Players never receive the host token in their action requests, and host controls never submit player answers. The answer key is hidden from *all* roles during live questions, including host devices, so someone who hosts and plays does not accidentally see it.

This app polls Supabase through Next.js API routes. It uses optimistic updates for concurrent answer submission. Client timestamps are not trusted for scoring; the server receives and timestamps submitted answers. Timed progression occurs when a client polls the room, including the TV. If all clients disconnect, the game waits until one reconnects and requests the current state.

The Suno music is used via its public embeddable player for a noncommercial personal/family experiment. Please review Suno's applicable terms before distributing or monetizing the game; the ZIP intentionally contains only links, not recordings.

## v0.2.2 mobile improvements

- Players without host privileges do not see a TV Preview button or navigation tab.
- When a new question board or question appears, the player view scrolls to the top; the mobile board fits much higher on screen and needs less scrolling.
- Mobile answer fields use 16px input text to prevent automatic iOS Safari zoom. Answer inputs no longer force keyboard focus when the question first loads, and submitting an answer dismisses the keyboard.
- Questions have a contrasting teal/blue panel, brighter category/value label, larger question text, and clearly separated countdown.
- Pause → Host Controls → Player accommodations lets a host adjust any player’s extra hints, time, first-letter reveal, and answer-length reveal, then resume.

## Validation

`npm install` then `npm run build` in an environment with package-registry access. Run `npm run test:engine` for engine tests. The package passed 17 isolated engine tests and TypeScript validation with lightweight dependency shims here, but the production Next.js build could not be executed in this environment because npm registry access failed. Treat v0.2 as a substantial playtest build and use a **fresh room** for your first test.

## Not yet included in this pilot

- Downloaded music tracks, remote Suno volume/play/pause, crossfades, or guaranteed automatic looping/shuffling (the embedded player does not expose reliable remote controls).
- Classical and Modern Pop soundtracks: the supplied catalog contains six styles only. Additional tracks can be added later.
- Polished game-show sound effects: music is available now; the old repeating browser-synth soundtrack has been removed.
- Competitive buzzer mode (intentionally paused after the family playtest).
