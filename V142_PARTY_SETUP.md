# Install v1.14.2 (cumulative from v1.14.0 or v1.14.1)

1. Extract this ZIP. Its files are relative to the repository root.
2. In GitHub select `main` (not `v1.15.0-testing`). Upload/replace all included files, preserving folders. Commit.
3. Wait for Vercel Production to report Ready. Verify the landing page says v1.14.2, then create a new room. Do not use an already-open party room for the first test.
4. No SQL or environment-variable changes. No new question bank or asset files. Existing developer data stays intact.

## Quick verification
- In Green Room expand It's Your Show; browse Topics, select a category, tap All Topics, find it via another topic or global search, and verify the same selection appears. Choose up to four.
- With up to eight individuals (or teams), verify normal turn-by-turn category draft and host-featured label.
- With nine or more individual seats, open the draft, vote on player devices, and verify ballot progress but no public totals until all submit. Verify the four winning categories appear on the board and results banner. Host Controls can close voting early with confirmation if someone cannot submit. If ties or empty places occur, they are resolved randomly.
- Play through into Round 2 and check that ballots reset and the second set of featured categories is offered.
- If necessary, Vercel rollback to last known-good deployment; create a fresh room after rollback.

## Verification limits
Local engine tests: 137 passed. UI source contract tests: 81 passed. Strict game TypeScript check and TSX transpile syntax check passed. Full Next.js build, deployed multi-device concurrency and actual mobile/TV visual testing not performed locally. Confirm production build and do a brief live smoke test.

## Development branch
The v1.15.0 testing branch is separate. Port the voting and topic picker behavior into it without overwriting its question-management code. This archive is for production, not a merge-ready v1.15.0 patch.
