# Practical Grammar 3

Student-facing interactive workbook for **Week 2 · Lesson 2**, divided into Part 1 and Part 2. The site contains all theory and exercises from **Workbook Exercise 10** onward in the supplied source document.

## What works now

- Separate **Week 2 · Part 1** / **Week 2 · Part 2** navigation with a reusable structure for adding Week 3 later.
- One full-name entry for Week 2, shared by both lesson parts.
- Immediate checking for fill-in-the-gap, matching and multiple-choice tasks.
- Automatically checked function-of-the-infinitive menus, including a mixed 20-sentence exercise, a shuffled additional bank and the two sides of every minimal pair.
- Saved open responses for translation, analysis and speaking work; these are not auto-checked.
- Per-student progress at the bottom of each week.
- Protected teacher dashboard with per-task success rate and per-student completion.
- Firebase Realtime Database persistence, with local browser fallback if Firebase is unavailable.

Answer keys are absent from `index.html`; objective answers live only in `answers.js`, which the checking code loads internally.

## Firebase status

- The web app is connected to project `grammar3-6f650`.
- Realtime Database is in `europe-west1` (Belgium).
- Anonymous and Email/Password Authentication are enabled.
- `database.rules.json` is deployed. Students can write only their own records; teacher statistics are restricted to `yukaimajo@gmail.com`.

The teacher account for `yukaimajo@gmail.com` has been created in Firebase Authentication.

After GitHub Pages is enabled, verify that `oletol.github.io` appears in Authentication → Settings → Authorized domains.

The teacher password belongs only in Firebase Authentication. Never commit it to this repository.

## Run locally

Serve the folder with any static web server, then open `index.html`. Opening the file directly may prevent Firebase modules from loading correctly.

## GitHub Pages

In the repository settings, choose Pages → Deploy from a branch → `main` / root. The site will then be published from the repository root.
