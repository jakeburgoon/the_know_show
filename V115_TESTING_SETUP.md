# The Know Show v1.15.0 — preview test package

Base: v1.14.0 private-review release. For the `v1.15.0-testing` GitHub branch only. Do not merge to main yet.

## Installation
1. The separate testing Supabase project must already have all seven initialization SQL parts applied successfully (final verification: schemaVersion 1, watermark 0, revisions []). If completed, no additional SQL is needed for this preview.
2. In Vercel, keep the original production variables and the three testing branch variables separate: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEVELOPER_PASSWORD. The new sb_secret_ key is supported in the export script (API key header only); legacy JWT keys continue to use Authorization. No credentials are included.
3. Extract the change ZIP and copy its contents into the repository root of the testing branch, preserving directories and replacing matching files. Commit on the testing branch. If uploading through GitHub web, make sure .gitignore is included and src/, supabase/, tests/ and scripts/ go in their existing locations, not a new wrapper folder.
4. In Vercel Deployments, choose the latest Preview deployment for v1.15.0-testing. Do not promote to production. If the deployment is not triggered automatically, redeploy the testing branch after its commit. Check logs if it fails.
5. Open the preview URL, sign into the developer dashboard and confirm the ten super categories. Create a test room and join from another device. Verify gameplay before using Question Lab to save a draft, publish a test revision, add a question and review its history. Confirm the next show sees changes but an ongoing show retains its prior bank. Test flag resolution and Final Word. Verify the real game still works separately.

## Release safeguards
Keep test question revisions and test gameplay in the test database. The preview build currently checks the database revision watermark against the checked-in bank. After publishing test revisions, a subsequent preview build may reject an unsynchronized watermark: export test revisions only to a disposable test copy to exercise sync; do not merge that test bank into main. Before reusing the environment for subsequent releases, plan for independent revision-watermark handling/rebaselining after the production bank is synchronized. Do not reset the production revision log. Production migration and sync will be handled separately after playtesting; use the corrected upgrade_v1_15_0.sql only on approval and after backup.

## Verification in this environment
138 engine tests, 81 UI source-contract tests and game-specific TypeScript check passed. Secret-key and legacy-key export header behavior verified with mocked fetch. Full Next.js dependency build and live Supabase/API/browser tests remain pending. This is a preview candidate, not a production release. The existing JSON question banks are unchanged. No audio, TV layout or host curation changes are included.
