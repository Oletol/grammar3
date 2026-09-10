# Practical Grammar 3

Student-facing interactive workbook for Week 2 and Week 3. The site contains all theory and exercises from **Workbook Exercise 10** onward in the supplied `Practical_Grammar_3_Lesson_3.html`.

## What works now

- Separate Week 2 / Week 3 navigation with a reusable week-panel structure.
- Full-name entry at the start of each week.
- Immediate checking for fill-in-the-gap, matching and multiple-choice tasks.
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

One manual step remains: in Firebase Console → Authentication → Users, create the teacher account for `yukaimajo@gmail.com`. Choose the password privately in Firebase; never commit it to this repository.

After GitHub Pages is enabled, verify that `oletol.github.io` appears in Authentication → Settings → Authorized domains.

The teacher password belongs only in Firebase Authentication. Never commit it to this repository.

## Run locally

Serve the folder with any static web server, then open `index.html`. Opening the file directly may prevent Firebase modules from loading correctly.

## GitHub Pages

In the repository settings, choose Pages → Deploy from a branch → `main` / root. The site will then be published from the repository root.
