# The Know Show v0.2.0 — Family playtest update

## Included

- Cool Jazz (Arrangement 1) is the default soundtrack; all 12 free Suno embeds available in six styles, selectable from host controls, also in `/music-test`.
- Main TV display at `/display/ROOMCODE`, with live board, score display, category introduction, question, reveal, and Suno player. Host-only controls stay on the host phone; public QR stays on the TV.
- Private host pairing link/QR available to the room creator and paired host devices. Not an authenticated account system or revocable transfer.
- Individual Everyone Answers as the default, speed bonus capped at 25%, two player-activated Double Takes per round (after the question appears), automatic judgments, host-reviewed disputes.
- Team Turn-Based mode with rotating turns and one steal chance for the next team.
- Two rounds of 5 categories × 4 questions, shorter 100–400 / 200–800 boards; 8/10/12 choices in each randomized category draft, classic and themed categories mixed.
- 45 categories and 453 editorially reviewed question candidates, at least two options at every difficulty level; duplicate and answer-giveaway checks completed, but independent verification of every factual answer remains incomplete.
- Host-assigned written hints, first-letter and answer-length reveal, extra answer time, host pause/skip/manual score adjustment.
- The Final Word with individual wagers and automatic judgment.

## Testing and known limitations

13 engine tests pass. All TypeScript/TSX source syntax was transpiled successfully, and the modified engine/API/UI source passed a type-shape check using local validation shims. The full production Next.js build could not be performed because the npm registry was unreachable in this environment. These checks do not guarantee Vercel deployment success. This is an experimental family playtest build.

The Suno embedded player must generally be started directly on the TV; host-phone genre selection changes the embedded song but cannot reliably change volume/play/pause, and track changes can require pressing Play again. Sound effects, Classical/Modern Pop audio, and Buzzer Mode are not included in this update.

Create a **fresh room** after deployment; previous v0.1.2 rooms are not compatible with the new state format. No database migration is needed for existing working v0.1.2 installations.
