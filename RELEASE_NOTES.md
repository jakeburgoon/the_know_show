# The Know Show v1.1.0 — Visual Refresh

**Release:** Visual-only feature update based on v1.0.0. Compatible with existing rooms and database.

## Design changes
- **Exact approved main logo** displayed prominently on the landing-page hero, along with a smaller logo in the navigation. The source PNG is unchanged, and the existing app icons are preserved.
- **Landing page rebuilt:** navy spotlight-inspired hero, warm-gold accents, clearer game-night message, high-contrast Create/Join cards and buttons, short at-a-glance features, responsive phone layout.
- **Green Room refreshed:** an on-brand logo/header area with the current room code, distinctive host-ready messaging, streamlined cards, clearer tab states, buttons, form controls, and QR panels.
- **Cohesive interface palette:** deep navy, warm gold/yellow, cream and restrained teal/blue-green across category drafting, 4×3 game boards, question/introduction cards, live scores, host controls, and TV display.
- **Readability preserved:** compact player question and answer form still appear together, numerical points are high-contrast, category and question phases are visually distinct, focus styles and reduced-motion preference are respected.
- Browser theme and PWA background colors aligned to navy and cream.

## Not changed
- Gameplay engine, scores, modes, 24-question two-round structure, Final Word, accepted-answer matching, disputes and accommodations.
- The 540-question candidate bank and source verification status; this update does not claim additional fact verification.
- Approved main logo image, soundtracks and Cool Jazz default.
- Supabase schema and environment variables.

## Validation
- All 14 v1.0 game engine regression tests passed after the visual-only change.
- The updated TSX pages passed TypeScript compatibility and syntax checks.
- The combined CSS parsed without stylesheet errors.
- The approved `public/know-show-logo.png` was checked byte-for-byte against the user's approved original.
- A full `next build` was **not** performed because Next.js/npm packages were unavailable in this execution environment. Vercel will run the real production build when the code is deployed.
