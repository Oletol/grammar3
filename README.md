# Practical Grammar 3

Student-facing interactive workbook for Week 2 and Week 3. The site contains all theory and exercises from **Workbook Exercise 10** onward in the supplied `Practical_Grammar_3_Lesson_3.html`.

## What works now

- Separate Week 2 / Week 3 navigation with a reusable week-panel structure.
- Full-name entry at the start of each week.
- Immediate checking for fill-in-the-gap, matching and multiple-choice tasks.
- Saved open responses for translation, analysis and speaking work; these are not auto-checked.
- Per-student progress at the bottom of each week.
- Protected teacher dashboard with per-task success rate and per-student completion.
- Local browser persistence before Firebase is configured.

Answer keys are absent from `index.html`; objective answers live only in `answers.js`, which the checking code loads internally.

## Firebase information still needed

The Firebase Console project URL is not the web-app configuration. No configuration values have been guessed. To turn on shared persistence and teacher statistics:

1. In Firebase Console → Project settings → General, add or select a **Web app** and copy its complete `firebaseConfig` object.
2. Paste those exact fields into `firebase-config.js`: `apiKey`, `authDomain`, `databaseURL`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId` (plus `measurementId` only if Firebase provides one).
3. In Build → Authentication → Sign-in method, enable **Anonymous** and **Email/Password**.
4. In Authentication → Users, create one teacher user and provide the exact teacher email address.
5. Replace `REPLACE_WITH_TEACHER_EMAIL` in `database.rules.json` with that same email.
6. Create a **Realtime Database**, choose its region, and deploy `database.rules.json`. Do not leave the database in public test mode.
7. Add the final GitHub Pages domain (normally `oletol.github.io`) to Authentication → Settings → Authorized domains if it is not already present.

The teacher password belongs only in Firebase Authentication. Never commit it to this repository.

## Run locally

Serve the folder with any static web server, then open `index.html`. Opening the file directly may prevent Firebase modules from loading correctly.

## GitHub Pages

In the repository settings, choose Pages → Deploy from a branch → `main` / root. The site will then be published from the repository root.
