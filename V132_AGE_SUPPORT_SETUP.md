# v1.13.2 — Age-based answer support

- Optional individual Green Room age selector: Under 10 and 10–12 → all regular questions; 13–15 → Medium and Hard; 16–17 → Hard only; 18–29, 30–49, 50+ → written. Not specified leaves existing support unchanged. The host can override the slider. Final Word stays written for everyone. Age does not affect category or question selection or scoring rules.
- Adult age bands are stored in the private active room state, retained for a rematch, and used for per-show/question aggregate counts, not attached to individual response rows or persistent exposure histories. Under-18 age bands are used to recommend support but are not saved; the host's local selection can reset on refresh or rematch, while the resulting support setting persists. Team seats do not collect age. No exact ages or dates of birth are requested. Child age-group analytics are deferred pending privacy review.
- In Developer → Show & Question Statistics → Question statistics, adult age-group accuracy appears only when at least 10 answers across 5 shows are available for a question/band, with the same threshold for each displayed answer format. These are attempts, not unique individuals. Overall performance collection remains active for all participants. Historical questions have no age breakdown until qualifying data accumulate. No age summaries appear in recent-show responses or on the public player/TV views.
- Run `supabase/upgrade_v1_13_2.sql` after the v1.13.0 migration, before uploading. The migration adds a service-role-only report function and no new tables. No new environment variables. Existing question bank, exposure selector and game rules are unchanged. Production integration is not tested locally.

## Deployment

1. If you are still on v1.12.1, first run `supabase/upgrade_v1_13_0.sql` and then `supabase/verify_v1_13_0.sql` (recommended). If already on v1.13.0 or v1.13.1, do not need to rerun these.
2. In Supabase SQL Editor run `supabase/upgrade_v1_13_2.sql`. This is safe to rerun. Verify with `select public.ks_age_question_report();` in the SQL editor: an empty JSON array is expected before enough eligible responses.
3. Extract the update-only ZIP. Upload the contents of the `the-know-show` folder to the existing repository root, preserving paths. No files need to be deleted. The cumulative update-only bundle is relative to v1.12.1; it is safe to use on v1.13.0 or v1.13.1 too. The full application ZIP is a backup.
4. After Vercel deploys, open a new individual show; join with two players, pick 10–12 and 30–49, verify support automatically changes to All and Never respectively. Override the sliders, change to Not specified (the support setting should remain), test a rematch. Check that guest/TV views do not show age controls. Confirm team mode has no age selector.
5. Play a question, confirm normal show/question statistics in the developer dashboard. Adult age breakdowns will remain hidden until qualifying sample sizes are reached.

## Validation

Engine tests: 89/90 passed, including all 4 new age tests. The existing Famous Landmarks/Machu Picchu overlap remains unchanged. UI contract tests: 57/57 passed. The live Supabase migration, browser interactions, and complete Vercel build still need verification.
