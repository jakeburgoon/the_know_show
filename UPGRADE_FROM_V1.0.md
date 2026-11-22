# Upgrade The Know Show v1.0 → v1.1

This is a complete replacement project that can be installed **directly over v1.0** in the same GitHub repository. No intermediate version is needed.

1. Download and unzip `the-know-show-v1.1.0-direct-from-v1.0.zip`.
2. Open the inner `the-know-show` folder.
3. In GitHub, open your existing **theknowshow** repository at its root, then choose **Add file → Upload files**.
4. Drag **everything inside** the extracted `the-know-show` folder (not the outer folder, and not the ZIP itself) into the GitHub uploader. Commit the changes.
5. Let Vercel deploy. If your device still displays the old design, close/reopen the installed web app or hard-refresh the webpage because PWA/browser resources may be cached.

No changes to Supabase SQL, credentials, environment variables, or existing game rooms are required. A new room is optional; all existing v1.0 room gameplay remains compatible.

**Files that matter:** `src/app/page.tsx` (home), `src/app/globals.css` (brand styling), `src/components/ShowRoom.tsx` (Green Room banner), `public/know-show-logo.png` (approved image, unchanged), `public/manifest.webmanifest` and `src/app/layout.tsx` (browser theme), and `package.json` (version only).

**What stayed the same:** game engine and scoring, the balanced 540-question Standard Trivia bank, 4×3 board, one Double Take per round, private hints, automatic Final Word, guest/host controls, QR joining, and Suno music catalog (Cool Jazz default).

This release passed 14 engine tests and a local TypeScript compatibility check. The dependency-free environment did not support a full Next.js production build, which should be checked by Vercel during deployment.
