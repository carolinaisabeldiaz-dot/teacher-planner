# Carolina's Teacher Planner — Pilot

Pilot web planner for August–September 2026.

## Included
- Monthly calendar view
- Weekly view
- "Plan this week" workflow
- Fixed school timetable
- Editable lesson planning
- Status: Planned / Ready / Done / Continue / Assessment
- Copy previous lesson
- iPad / phone responsive layout
- Export / import backup JSON

## Important: where data is saved
This first pilot uses the browser's local storage.

That means:
- It works immediately on GitHub Pages.
- Changes made on one device do **not** automatically appear on another.
- Use Backup > Export on one device and Backup > Import on the other as a temporary transfer method.

## Next step: cloud sync
To make Mac / iPad / phone stay automatically synchronized, connect the app to Firebase Firestore or Supabase.

That requires creating a free cloud project and adding its project credentials to the code. The interface itself is already structured for this upgrade.

## Publish on GitHub Pages
1. Create a new GitHub repository, e.g. `teacher-planner`.
2. Upload `index.html`, `styles.css`, and `app.js`.
3. In repository Settings > Pages, choose the main branch as the source.
4. Open the Pages URL from your iPad / phone.
5. On iPad/iPhone Safari: Share > Add to Home Screen.

## Files
- `index.html` — page structure
- `styles.css` — responsive design
- `app.js` — timetable, calendar, editing, storage
