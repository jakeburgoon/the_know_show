# Direct upgrade: v0.2.5 → v1.0.0

You do **not** need to install any intermediate release.

1. Unzip the v1.0 package.
2. Open the inner `the-know-show` folder.
3. Drag **all its contents** into GitHub's **Add file → Upload files** page at the *repository root*. Do not upload the ZIP or the outer folder itself.
4. Commit the changes. Vercel should start a new deployment.
5. Keep your existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optional `ROOM_CREATION_PASSCODE` in Vercel. **No SQL changes.**
6. Refresh the site and **create a fresh v1.0 game room**. Old v0.2.5 rooms won't work with the new three-level question structure.

**Note:** GitHub's browser uploader overwrites matching files but won't delete obsolete files from earlier releases. An old `public/icon.svg` or older release documentation in your repository can be deleted later; v1.0 doesn't reference them.

If Vercel fails, look in **Vercel → Deployments → latest deployment → Build Logs**, and share the error text so the exact issue can be corrected.
