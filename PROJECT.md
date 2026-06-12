# Rent Splitter — Project Context

## What it is
A React web app for splitting rent and shared expenses among roommates. Users create expense splits, save them, share public read-only links, and organize roommate presets into groups.

**Live site:** https://zhenlin-cyber.github.io/rent-splitter/
**Repo:** https://github.com/zhenlin-cyber/rent-splitter

---

## Tech Stack
- **React 18 + Vite** — frontend
- **Tailwind CSS v4** — styling with Material You design tokens (`bg-surface`, `text-primary`, `font-headline`, etc.)
- **Firebase Auth** — email/password, session persistence (`browserSessionPersistence`)
- **Firestore** — cloud storage for splits, groups, profiles
- **GitHub Actions → GitHub Pages** — CI/CD deploy on push to `main`
- **React Router v6** — with `basename={import.meta.env.BASE_URL}` for GitHub Pages subfolder

---

## Key Files
```
src/
  App.jsx              — all state, business logic, routing between views
  firebase.js          — Firebase init (guards against missing API key)
  AuthProvider.jsx     — auth context
  pages/
    Dashboard.jsx      — overview: recent splits + groups sidebar
    Groups.jsx         — group CRUD with GroupModal (create + edit)
    Login.jsx / Signup.jsx
    SharedSplit.jsx    — public read-only split view (/shared/:shareId)
  utils/
    calculateSplit.js  — split calculation logic (used by App + SharedSplit)
  components/
    SideNav.jsx

firestore.rules        — security rules (deploy with: firebase deploy --only firestore:rules)
firebase.json          — { "firestore": { "rules": "firestore.rules" } }
.firebaserc            — { "projects": { "default": "rent-splitter-8a7ea" } }
.env.local             — Firebase config (local only, not committed)
```

---

## Firestore Data Model
```
/users/{uid}/splits/{splitId}     — saved splits
/users/{uid}/groups/{groupId}     — roommate group presets
/users/{uid}/profiles/{profileId} — saved roommate profiles
/shared/{shareId}                 — public read-only shared splits
```

**Security rules:** authenticated users can read/write only their own `/users/{uid}/` subtree. `/shared/{shareId}` is public read, authenticated create/delete (ownerUid must match).

---

## Firebase Setup
- Project ID: `rent-splitter-8a7ea`
- Auth domain: `rent-splitter-8a7ea.firebaseapp.com`
- GitHub Secrets set (all 6 `VITE_FIREBASE_*` vars) — required for deployed builds
- Firebase CLI tools installed at `/usr/local/bin/firebase` (or via npx)
- To redeploy Firestore rules: `firebase deploy --only firestore:rules`

---

## Architecture Patterns

**Local-first writes:** State is updated immediately with a temp `local_${Date.now()}` ID, then Firestore syncs in background and swaps in the real ID on success. Failures show a warning toast but don't lose local data.

**`fsWrite` timeout wrapper:** All Firestore writes are wrapped in a 10s race:
```js
const fsWrite = (promise, ms = 10000) =>
  Promise.race([promise, new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Save timed out — check your connection')), ms)
  )]);
```

**Debounced profile saves:** Profile field edits auto-save after 600ms using `useRef` timers (`profileSaveTimers`, `pendingProfileUpdates`).

**Loaded split tracking:** When a saved split is loaded into the calculator, `editingSplitId` + `editingSplitName` are set, revealing Update + Share buttons in the calculator header.

---

## Current Feature State
- [x] Expense calculator with sq ft / percentage / equal split methods
- [x] Save splits, load splits, update in place, delete
- [x] Share splits via public link (`/shared/:shareId`)
- [x] Dashboard with stats, recent splits (clickable to load), groups sidebar
- [x] Groups: create, edit, delete, load into calculator
- [x] Profiles: inline edit with debounced auto-save
- [x] Firestore sync for splits, groups, profiles
- [x] Auth: sign up, sign in, sign out (session persistence)
- [x] GitHub Pages deploy with CI/CD

---

## Known Quirks
- Auth uses `browserSessionPersistence` — users are logged out when they close the tab/browser
- `gh` CLI installed at `~/.local/bin/gh` (not on system PATH by default; run `export PATH="$HOME/.local/bin:$PATH"`)
- Homebrew is not installed on this machine
- `fsWrite` is defined in `App.jsx` — must stay **after** all `import` statements or Vite build breaks
- All Firestore writes (splits, groups, share) use local-first pattern: state updates immediately, Firestore syncs in background
