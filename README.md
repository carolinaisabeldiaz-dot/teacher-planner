# Carolina's Teacher Planner — V2

Updated pilot for August–September 2026.

## Changes in V2
- When a lesson is already planned, tapping the course opens a clean summary first.
- Simplified planning fields:
  - Objective
  - Inicio
  - Desarrollo
  - Cierre
  - Notes
  - Status
- A class can be marked as TEST / ASSESSMENT.
- Tests are shown with a red badge/border in Monthly, Weekly and Plan this week.
- Every weekday has a + Reminder button.
- Day reminders can be checked off or deleted.
- Monthly view shows how many active reminders each day has.
- Existing data from V1 is preserved where possible.

## Data storage in this version
This V2 still uses local browser storage.

So:
- You can open the published page from an iPad and edit directly there.
- The iPad will remember its own changes.
- Mac and iPad do NOT automatically synchronize yet.

Use Backup > Export / Import if you need to move the planner between devices temporarily.

## Next step: automatic Mac + iPad + phone sync
Connect Supabase:
1. Create a Supabase project.
2. Create an authenticated planner table with Row Level Security.
3. Add the project URL and public anon key to the web app.
4. Sign in with the same account on Mac / iPad / phone.

After that, the same planner data can follow the signed-in user across devices.

## Update GitHub Pages
Replace these three files in the existing `teacher-planner` repository:
- `index.html`
- `styles.css`
- `app.js`

You can leave README.md as-is or replace it too.

GitHub Pages will redeploy automatically after the commit.
