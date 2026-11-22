# The Know Show — v1.0 (Family Game Night Edition)

This is a complete GitHub replacement package. **You can upgrade directly from v0.2.5**; no intermediate versions are required. The new game rules and question IDs require **creating a new room** after deployment. Existing room snapshots created with v0.2.x do not work in v1.0. No changes to the existing Supabase SQL tables or Vercel environment variables are needed.

## Upgrade from v0.2.5

1. Extract `the-know-show-v1.0.0-direct-from-v0.2.5.zip` on your computer.
2. Open the **inner** `the-know-show` folder.
3. In GitHub, open your existing repository at its top level. Choose **Add file → Upload files**.
4. Drag everything *inside* the inner `the-know-show` folder (including `src`, `public`, `supabase`, and other files) into the upload area. GitHub replaces matching paths, but doesn't automatically remove old paths.
5. Commit the changes. Your connected Vercel deployment should redeploy automatically.
6. Refresh the website and create a **new v1.0 room**.

An obsolete `public/icon.svg` file or older review documents left in GitHub are no longer referenced by the app. They can be removed later; they don't prevent this version from running.

## Game rules

- **One question set:** Standard Trivia only (no Family/Advanced selector).
- **Two rounds:** The Opening Act and The Main Event.
- **Four categories per round**, selected in a rotating draft from a randomized mix of classic and themed categories with readable descriptions.
- **Three questions per category:** Easy, Medium, Hard. Round 1: **100 / 300 / 500**; Round 2: **200 / 600 / 1,000**.
- **24 regular questions total**, plus The Final Word.
- **Individual mode (default):** Everyone answers each question from their own phone, gets base points if correct, plus a speed bonus up to 25%. Wrong answers earn 0. Each player can use **one Double Take per round** after seeing the question and before submitting their answer.
- **Team mode:** Teams answer in turn; after a wrong answer, the next team can attempt a single steal for half the question's points.
- **Private accommodations:** The host can pause and adjust hints, first-letter support, answer-length support, and extra time. Enabled first letters display **automatically below the question**, with no taps or hint cost.
- **Answer judging:** A question-specific set of accepted aliases plus conservative spelling tolerance. Small numeric/ordinal changes aren't treated as typos. The host can review disputes and adjust scores.
- **The Final Word:** The question appears automatically after every player locks a wager. Wagers and answers are private until reveal.
- **Display:** TV + Phones or Phones Only. Host may also join as a regular player and switch between Player and Host controls. The player view notifies an authenticated host of an active dispute.
- **Music:** Cool Jazz is the default of six genres with two Suno-hosted arrangements each. Start the embedded music player on the TV or on the host phone (Phones Only). Suno controls its own play/pause and volume.

## Question library

- 45 categories × 3 difficulties × 4 candidate questions = **540 Standard Trivia questions**.
- Question IDs, prompts, aliases, and hints are preserved from the latest **QA5 editorial review**. The extra source URL/status fields are retained for future question corrections.
- **Important quality limitation:** 66 questions have recorded direct source verification (36 QA5, 30 QA4). 65 more have inherited source links that need rechecking; 409 are editorially screened but not individually externally verified. The library is intended for family playtesting, not a claim of comprehensive fact checking.
- The app preferentially chooses questions the host device hasn't played recently. This history is saved locally in the host's browser and also carries forward when you start a new show in the same room. It won't synchronize across unrelated phones or cleared browser data.
- Players can dispute an answer when an unlisted but reasonable alternative is entered.

## Setup and deployment

The app requires Node 20+, Next.js, Supabase, and Vercel (or another Next.js host). Existing environment variables continue to work:

```sh
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVER-SIDE-KEY
# optional
ROOM_CREATION_PASSCODE=
```

Do **not** commit a real Supabase secret key to GitHub. The server key is used only in server-side route handlers. The existing `supabase/schema.sql` is included as reference for brand-new installations; don't run it again over an existing database.

For a local development environment with npm access:

```sh
npm install
npm run dev
npm run build
npm run test:engine
```

## Testing status

The v1.0 engine passed 14 automated gameplay/regression tests, including a full 24-question match through automatic Final Word progression. TypeScript library compilation and TypeScript/JSX syntax checks passed. **A full `next build` could not be run in the packaging environment** because the project dependencies were unavailable. Check the Vercel build logs after upload, and share an error log if the deployment fails.

## Branding

`public/know-show-logo.png` is the **exact approved main logo**, byte-for-byte unchanged. The app icon sizes are simple square placements of that same approved artwork on a solid deep-teal field; they are not alternate or redesigned logos. Player and TV screens use streamlined teal, cream, and gold styling consistent with the logo.
