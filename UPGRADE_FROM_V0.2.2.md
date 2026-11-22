# Direct upgrade: v0.2.2 → v0.2.5

**You can skip v0.2.3 and v0.2.4 entirely.** This ZIP is a full replacement project built on the **audited v0.2.4 package**, with its question corrections and category descriptions, plus all v0.2.5 changes.

1. Download and **extract** `the-know-show-v0.2.5-direct-from-v0.2.2.zip`.
2. Open the **inner** `the-know-show` folder. You should see `src`, `public`, `supabase`, `tests`, `package.json`, `README.md`, etc.
3. In your existing GitHub `theknowshow` repository, make sure you are at the **repository root**. Choose **Add file → Upload files**.
4. Drag the files and folders **inside** `the-know-show` into GitHub, not the ZIP or the outer `the-know-show` folder. Matching paths should be replaced. Commit as `Upgrade The Know Show v0.2.2 to v0.2.5`.
5. Vercel should redeploy from the commit. When deployment finishes, reload the site. Open **Host Controls → Where everyone plays → Phones Only** if you want to try the new display option. The default stays TV + Phones.
6. For the full experience of the new question pools, **create a fresh room**. No Supabase changes or new Vercel variables are necessary.

**Important about leftover files:** The older v0.2.2 ZIP included `.validation-shims.d.ts` and `tsconfig.validation.json`. Because GitHub's browser uploader doesn't delete existing files, these might remain in your repository. They are development-only and not part of v0.2.5. The updated `tsconfig.json` excludes `.validation-shims.d.ts`, so the leftovers need not be deleted for the normal build. You can remove them from GitHub later if you'd like.

**Security:** Do not upload `.env` containing secrets. Keep `SUPABASE_SERVICE_ROLE_KEY` only in Vercel environment variables. Keep private host QR/link away from players; give players the **public** QR instead.

**If GitHub reports upload conflicts:** Use GitHub Desktop to copy all files into a local clone, overwriting matching files, then commit and push. Do not delete or recreate your Supabase project or repository.

## Phones Only quick test

1. Create a room **on your phone**. In Host Controls select **Phones Only**.
2. Show the Join QR on that phone or use **Share invite** to send the link.
3. Join at least two players (the host can use **My Player View** to join too).
4. Begin the category draft and play normally: categories, board, question, answer form, results and **live scores** appear on every phone.
5. For music, open the **host phone music player** (Cool Jazz default) and tap **Play**. Switch between Player and Host tabs to test that it stays loaded.
6. Switch the display arrangement back to **TV + Phones** if you later connect a TV or laptop.
