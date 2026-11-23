# Upgrade the existing The Know Show app to v1.3.0

This release starts from the supplied v1.2.0 baseline and can replace the files in your deployed GitHub repository. Unzip, open the inner `the-know-show` folder, upload its **contents** (not the outer folder) to the repository root, overwrite changed files, and commit. Vercel redeploys if linked. Confirm the build succeeds.

No Supabase migration, environment variable updates, or room reset is required when upgrading from v1.1/v1.2. The v1.2 four-choice settings remain supported for normal questions. **Final Word is now written-only.** The 540-question answer choices have been reviewed and the finished screen has a new celebration and one standings table.

For older v1.1 settings, the first-letter and answer-length accommodations are no longer used; assign the new per-player Answer Format before playing. See `README.md`, `RELEASE_NOTES.md`, and `CHOICE_OPTIONS_QA.csv`.
