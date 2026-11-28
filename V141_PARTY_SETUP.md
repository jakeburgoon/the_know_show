# The Know Show v1.14.1 — Holiday party patch

## Install

- Based on the saved full v1.14.0 production package, not the v1.15.0 preview. The update ZIP contains changed files only, at repository-root-relative paths. Upload all files to `main` preserving their paths. Do not remove files absent from this ZIP.
- Commit while no one is playing; wait for the Vercel production deployment to become Ready. Keep the existing production environment variables and Supabase project. No SQL, new assets, dependencies or environment variables are needed.
- Open a new room after deployment; confirm v1.14.1 in the landing footer. If the build fails or the smoke test fails, revert the commit or use Vercel's production rollback to the prior successful deployment. Check the production game again after rollback.
- Do not upload this patch directly over v1.15.0-testing: that branch already has overlapping source edits. Merge main into the testing branch and reconcile the overlapping files while keeping the preview question-library functionality, then retest.

## Host controls

Complete the normal host setup. In Green Room, expand **It's Your Show** just above Start the Show. Search category names/descriptions and click up to four; click a selected name to remove it or use Clear all. Each click is saved to the room. With four picks, picks 1 and 3 appear in Round 1; picks 2 and 4 in Round 2. With fewer, the same alternating rule spreads the picks. Only eligible, enabled categories can be featured. Features override normal freshness weighting for their own offer, not question selection. Seasonal choice reservation applies to the remaining eligible pool; Round 2 host picks are reserved from Round 1. The draft still offers eight choices and players select four per round; a host-featured category is not automatically played. The badge is visible on phone and shared TV draft views. Rematches clear featured categories so the host can choose anew.

Individuals: 2–16 seats, including a host who joins as a player. Teams: 2–8 team seats. Switching from individual to team mode with more than eight joined seats is rejected. Regular question selection rotation for larger groups begins Round 2 after the first twelve question turns so all participants get a question-selection turn in a complete game; only eight category-selection turns exist.

## Validation and limitations

- Engine: 132 tests passed, including a simulated full 16-player show (24 regular questions, all answers and wagers, Final Word, standings, chooser rotation), limits and category curation tests.
- UI source-contract suite: 79 passed. Strict game TypeScript test passed. Changed TS/TSX files passed TypeScript transpile syntax checks. Full Next.js build not performed because dependencies including Next are absent in the build environment; Vercel must build the production patch.
- Live concurrent HTTP requests, Supabase/Vercel load, and browser/TV rendering remain untested. Retry budgets for optimistic room commits and joins are increased; this is not a load-test result. For the party, use the actual intended number of devices (or multiple independent browser profiles), join together, draft, answer a question around the same time, verify every result, and check Final Word if time permits. The 16-seat UI uses compact score/result rows, with two-column reveal and standings on wider shared displays. Full large-screen redesign remains planned for later.
- Host picks use a searchable flat category list rather than the later super-category wizard. No question content changes or SQL migrations. Existing private-review image rights restrictions remain.
