# The Know Show v1.13.5 — Paid hints & Final Word clue review

## Deploy
1. Finish any in-progress shows before replacing the app. New hints use a new action format, so reload all player/host tabs after deployment.
2. If not already applied, run the v1.13.0 exposure and v1.13.2 age-statistics SQL migrations (and earlier required migrations).
3. Run `supabase/upgrade_v1_13_5.sql` in Supabase SQL Editor. This replaces the developer report function only; it does not change existing rows, tables or identifiers. It enables all-time per-question breakdowns for paid hints. The app stores the new fields in the existing JSON stats column, even without the report upgrade.
4. Upload the cumulative update-only package preserving paths relative to your repository root. The baseline is v1.12.1. Do not delete existing files. No new environment variables.

## Regular gameplay
- Written players may spend 25% of the question's original base points to reveal four answer options. Players who see choices may spend the same amount to remove two incorrect options. A written player can buy both sequentially. Each purchase is irreversible, requires sufficient points and an active unanswered question, and is valid only for that player's turn. Timers continue. Purchase price does not change with Double Take. Choices are stable across polling and 50/50 keeps a separately deterministic distractor. The server validates purchases and submissions; choice-format speed bonus applies once options are shown. Paid options clear a saved written draft so it cannot auto-submit accidentally.
- Round 1: 25 / 75 / 125 points. Round 2: 50 / 150 / 250 points. No host free-hint settings or free regular written hints. Legacy balance fields remain for compatibility only.
- Final Word: unchanged price (500 each), two written hints maximum, purchased before wager; revealed with question. Regular written hints retained as archival material in Question Lab.
- 76 category-linked Final Word pairs reviewed for editorial usefulness; 29 pairs revised, all IDs, prompts, answers and aliases unchanged. `V135_FINAL_HINT_REVIEW.csv` includes old/new pairs. This is an editorial pass, not an independently sourced fact-check of every statement. Voyager fact check: https://science.nasa.gov/mission/voyager/voyager-1/ ; Krampus proposed etymology: https://blogs.loc.gov/folklife/2025/12/krampus-origins-and-development-of-a-winter-devil/ ; silage: https://forages.oregonstate.edu/oregon/topics/harvest/silage .
- Statistics distinguish unaided written, provided choices, purchased choices and 50/50; purchase counts include nonresponders for resolved questions. Data is journaled with the result, not at each purchase, so abandoned questions without a result do not have final assistance statistics. Older shows are not reclassified. No new identifiers or child age collection.

## Testing
- Run `npm run test:engine` and `npm run test:ui`.
- 104/105 engine tests passed (existing disabled Famous Landmarks Machu Picchu duplicate remains); 58/58 UI tests passed; all four new paid-hint engine tests passed. Changed TSX files parsed with TypeScript, not a full Next production build.
- Live verification: host a written game; earn points, purchase options then 50/50; check another device cannot see the purchased choices, reject duplicate purchases, and confirm the score deduction; repeat with Everyone chooses, teams, round 2 and insufficient funds. Check the developer report and CSV after results. Confirm Final Word still has two 500-point hints.
- First-show recommendation / returning host personalization remains a separate planned update. No changes to exposure prioritization or answer-format defaults.
