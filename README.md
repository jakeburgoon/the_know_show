# The Know Show

**Brains on. Game on.** An original, family-friendly multiplayer trivia show. Version 0.1.0 (pilot).

- 2–8 players or teams, using phones as controllers; one host runs the game on a second screen.
- 12 categories drafted by players one at a time: six for **The Opening Act** (200–1,000), six for **The Main Event** (400–2,000).
- A secret **Double Take** on each board is worth twice the tile's points.
- Fastest valid buzz wins. The youngest player(s) can get a configurable 5-second exclusive window; team ages use youngest teammate.
- 3 private hints per player plus 2 for the youngest by default; host-controlled judging, score changes, and steals after a wrong answer.
- **The Final Word:** random age-adjusted final category, private wagers and answers, host-reviewed scoring.
- 29 original draftable categories (145 questions) and 18 final questions, flexible answer suggestions, optional Web Speech dictation, adjustable timers, original procedurally generated soundscapes (muted by default).
- Original visual identity, not associated with the Jeopardy! franchise.

## Fast setup (Supabase + GitHub + Vercel)

### 1. Create the Supabase database

1. Create a new project at https://supabase.com/ (or use a project you already have).
2. Open its **SQL Editor**.
3. Paste and run the **entire** file [`supabase/schema.sql`](supabase/schema.sql), once.
4. Open **Project Settings → API** (wording varies by dashboard version). Copy the **Project URL** and the **service_role / secret API key**. This key MUST be kept private. **Do not use your public `anon` key here.**

The SQL creates `know_show_rooms` and `know_show_members`. Row Level Security is enabled with no public policies; only the Next.js backend uses the server's secret key to read/write game data. The browser never talks directly to Supabase.

### 2. Put the project on GitHub

1. Extract this ZIP. The folder named `the-know-show` is the repository root.
2. Create a new empty GitHub repository (for example, `the-know-show`).
3. On GitHub, select **Add file → Upload files**. Upload the **contents** of the `the-know-show` folder, maintaining subfolder structure, and commit. (Alternatively, use Git from your computer: `git init`, `git add .`, `git commit`, `git remote add`, `git push`.)
4. Do **not** upload `.env.local` or secret keys.

### 3. Deploy using Vercel

1. Go to https://vercel.com/ and choose **Add New → Project → Import Git Repository**.
2. Choose your GitHub repository. Vercel should detect **Next.js** and use `npm run build`.
3. Add these **Environment Variables** for Production (and Preview if desired):

   | Variable | Value |
   | --- | --- |
   | `SUPABASE_URL` | Your Supabase project URL, e.g. `https://xyz.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your server-side Supabase service role / secret key |
   | `ROOM_CREATION_PASSCODE` | Optional password to restrict who can create a new room. Leave unset to allow anyone. |

4. Click **Deploy**. You do not need to configure a separate API server, because Next.js includes all the API endpoints.
5. Open your Vercel URL on the host device and tap **Create a show**. Other players open the same Vercel URL on phones and type the six-character code.

**Security:** Never prefix the service key with `NEXT_PUBLIC_`; that would expose it to browser users. The actual secret belongs only in Vercel's server-side environment variables.

### 4. Test locally (optional)

Install Node.js 20+ and from this folder:

```bash
cp .env.example .env.local
# Edit .env.local with your project's SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
npm install
npm run dev
```

Open http://localhost:3000 in your computer browser. To test a player without overriding the host's session, use a separate browser/private window at the same URL. For real mobile devices on the same Wi-Fi, deploy to Vercel or expose your local server over your LAN.

### 5. Start playing

1. **Host:** Create the room on a computer or tablet and share the room code.
2. **Players:** Join from individual phones, each entering a name and age. For team play, choose Teams in lobby settings first, then enter a team name and its youngest age, with one phone per team.
3. **Host:** Adjust settings before starting the category draft.
4. **Draft:** Players take turns picking categories until 12 are chosen. The selection order continues between rounds (it does not reset at round two).
5. **Board:** The starting chooser picks any unopened clue. After an answer is awarded, that contestant chooses next. The host can always pick for someone.
6. **Clue:** The first eligible buzzer enters an answer (or uses optional dictation) and may use a private hint. The host decides whether the answer counts; an incorrect answer loses the clue's points and reopens buzzing for other players. Hints don't subtract points.
7. **Final:** Host chooses **Go to The Final Word** when the second round is done. Players privately wager (up to their nonnegative score), then type final answers. Host scores each response and shows results.

**Tip:** You can advance rounds early; you don't need to finish all 30 clues if players have had enough.

## Question-bank customization

Edit `src/lib/questions.ts`. Each `CATEGORIES` entry has a unique `id`, a display name, an explainer shown on screen, and **exactly five** questions, from easiest to hardest. Each question has a prompt, answer, optional alternative answer spellings, and a hint.

Use `Q('Question?', 'Answer', 'Private hint', 'Alternate answer')` when adding a new question. Maintain at least 12 categories for a full game. Final questions live in `FINALS` with a `tier` (`family`, `teen`, or `adult`). The youngest age in the lobby determines which tier is randomly drawn for The Final Word: 12 or under = family, 13–16 = teen, 17+ = adult.

**Host discretion:** The comparison engine displays a suggestion based on normalized answer text, alternative answers, and close spellings. It *never automatically scores* a written answer. The host's decision is authoritative.

## Architecture & privacy

```
Phone/browser   →  Next.js UI on Vercel
                     ↓ HTTP GET ~1.6s, POST actions
                   Next.js API routes (server-side only)
                     ↓ service role key
                   Supabase Postgres (room snapshot + members)
```

- Players authenticate with a random, locally stored bearer token per device. The token is hashed in Postgres, and no secret token is returned by public room reads.
- The host has a separate random secret token stored in their original browser. Keep that browser open or use its normal tab history; the secret will persist unless browser storage is cleared.
- Raw question answers, unplayed prompts, hidden bonus tiles, private hints and final answers are *not* included in unauthenticated player API reads. The host receives an answer key for rulings.
- Every update uses a revision condition to avoid losing simultaneous buzzer requests. The first successful database update wins, and other buzzes re-check the state.
- Public scoreboard displays names, ages, scores, and remaining hints. **Don't enter sensitive personal data as names.** There is no login and no birthdate collection.
- This is a *small-group pilot*. The game polls every ~1.6 seconds, not WebSockets. Very large audiences would benefit from Realtime plus rate limiting. Only eight player seats are supported in this release.

## Known pilot limitations

- No admin user accounts, saved host library, external AI question creation, or player reconnect across devices; each player's token is tied to the browser that joined.
- The host can adjudicate an expired response using **Time expired / no answer**; the host must also close an expired buzz window. The app displays clocks but does not run an always-on server scheduler.
- The host can reset only after a completed final round. New questions/categories can repeat between separate games.
- There is one phone per team seat; individual teammates do not independently buzz for a team.
- A guess close to the answer is a **host suggestion**, not an automatic acceptance.
- Original music is synthesized in the browser. Browsers require a tap on **Music off** before audio begins.

## Troubleshooting

- **Room creation failed:** Check `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and that SQL ran successfully. Then redeploy after changing Vercel environment variables.
- **Room does not exist:** The code must be six characters and from the current game; the host must have created the room on that same deployment.
- **Host sees viewer mode:** You opened the room in another browser or cleared its local storage. The host's token isn't shared with guests.
- **A phone cannot join:** Make sure the host has not already started the draft; add new players while the room is in the lobby.
- **No music:** Sound is off by default. Choose a soundtrack in lobby settings, then tap **Music off** on the device where you want audio.

For questions about deployment, share the exact error from Vercel's build or function logs (but never share API secrets).
