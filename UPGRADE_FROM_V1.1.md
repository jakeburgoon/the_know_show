# Upgrade v1.1 → v1.2

Upload all files and folders **inside** the extracted `the-know-show` project directory to the root of your existing GitHub repository using **Add file → Upload files**, then commit. Vercel will deploy automatically if linked.

Do not upload the outer folder or the ZIP as a single file. You don't need to run new Supabase SQL or change Vercel environment variables. Existing v1.1 rooms are compatible. To use the new assistance, go to **Host Controls → Player accommodations**, select a player's Answer Format, and choose **Write answers**, **Four choices for all questions**, **Four choices for Medium & Hard**, or **Four choices for Hard only**. Pause first if already playing. Old first-letter and answer-length assignments no longer apply.

Before broadly distributing the app, audit the new distractors in `CHOICE_OPTIONS_QA.csv`. They currently pass automated structural checks but not an individual editorial quality check for all 540 questions.
