# v1.12.0 Question Lab

The new developer Question Lab is available at `/developer` after signing in with the same developer password already used for the feedback dashboard.

## Main capabilities
1. **Question browser** – browse the full bank with filters
2. **Live preview** – inspect how a question appears, reveal hints, and test an answer
3. **Playtest set builder** – assemble a manual set of categories for targeted review

## Intended use
- Audit difficulty
- Test acceptable answers and spelling tolerance
- Review image-based categories without waiting for random category selection
- Prepare specific categories for family and friend playtests

## Security and scope
The question bank is returned by `/api/developer/questions` only after validation of the existing developer session; the response is private and no-store. The preview is a developer-only approximation of the gameplay screen using the shared image renderer and the same answer matcher. It does not run a timed live game, change player history, or create a multiplayer room. The playtest set builder groups categories for preview only. Actual multiplayer Test Show and exact timed gameplay previews remain future work.

## Validation
50 UI contract tests passed; focused TypeScript engine compilation passed using installed Node type definitions. 74 of 75 engine tests passed. The remaining test identifies the pre-existing v1.11.1 duplicate answer Machu Picchu in Picture This Place and Famous Landmarks Final Word. This content is unchanged in this release. Full Next.js production build and live sign-in/preview testing remain unverified. No new SQL or environment variables.
