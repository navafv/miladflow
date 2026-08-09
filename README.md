# Milad Flow — Frontend

React 18 SPA built with Vite 6, styled with Tailwind CSS v4 (`@tailwindcss/vite`), routed with `react-router` / `react-router-dom` v7. See the [root README](../README.md) for the system-wide architecture picture.

No global state library — state is managed with small hand-rolled store modules under `src/lib/` built on `useSyncExternalStore`.

## Setup & Installation

### Prerequisites

- Node.js (LTS) + npm

### Install & run

```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_BASE_URL — see below
npm run dev                # http://localhost:5173
```

With the backend running on `:8000` and `CORS_ALLOWED_ORIGINS=http://localhost:5173` set there, the SPA can call the API directly.

### npm scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Local dev server, default `http://localhost:5173`. |
| `npm run build` | `vite build` | Production build to `dist/`. |
| `npm run build:staging` | `vite build --mode staging` | Build using a `.env.staging` mode file. |
| `npm run preview` | `vite preview --port 4173` | Serve the built `dist/` locally for a final check. |
| `npm run clean` | `rm -rf dist` | Remove the build output. |

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Full base URL of the API, including `/api/v1` — e.g. `http://localhost:8000/api/v1` locally, `https://miladnabi.onrender.com/api/v1` in production. |

See `.env.example` for a ready-to-copy template. A console error is logged if this is left unset.

## Folder Structure & Component Architecture

```
src/
  App.jsx              # Route table
  main.jsx             # Entry point
  pages/
    LandingPage.jsx      # Public marketing homepage
    LoginPage.jsx
    SignupPage.jsx
    PrivacyPage.jsx
    TermsPage.jsx
    MadrassaDashboard.jsx  # Public per-madrassa landing (/:slug)
    ResultsPage.jsx        # Public results (/:slug/results)
    SchedulePage.jsx       # Public schedule (/:slug/schedule)
    admin/
      AdminLayout.jsx        # Shell (sidebar + outlet) for all /admin/* routes
      AdminDashboard.jsx
      TeamsPage.jsx
      CategoriesPage.jsx
      EventsPage.jsx
      RulesPage.jsx
      VenuesPage.jsx
      StudentsPage.jsx           # Also drives the "Print ID Cards" flow
      RegistrationPage.jsx       # Bulk registration matrix + sub-groups
      RegistrationsViewPage.jsx  # Read-only registrations + audit log view
      AdminSchedulePage.jsx
      ResultsPage.jsx             # Placements, bonus points, leaderboard
      SettingsPage.jsx
  components/
    MadrassaNavbar.jsx / MadrassaFooter.jsx   # Public per-madrassa chrome
    PublicNavbar.jsx / PublicFooter.jsx       # Marketing-site chrome
    Hero.jsx / Features.jsx / Pricing.jsx / ContactSection.jsx
    SubscribedMadrassasMarquee.jsx
    OngoingEventBanner.jsx
    StatusBadge.jsx
    ThemeToggle.jsx
    SeoHead.jsx
    ProtectedRoute.jsx    # Redirects to /login when there's no refresh token
    ErrorBoundary.jsx
    PublicUnavailable.jsx # Shown when a public madrassa slug is inactive/not found
    Logo.jsx
    legal/LegalLayout.jsx
    admin/
      AdminSidebar.jsx
      TableShell.jsx
      Modal.jsx
      Toast.jsx
      FormFields.jsx
      Dropzone.jsx
      ExportButtons.jsx
      PosterModal.jsx / EventPoster.jsx / StudentPoster.jsx
      IdCardSetupModal.jsx / IdCardGenerator.jsx  # Printable, QR-coded student ID cards
  lib/
    apiClient.js           # fetch wrapper, token storage, refresh-on-401
    authStore.js            # login/logout, auth state
    themeStore.js            # light/dark mode, persisted to localStorage
    registrationStore.js      # bulk registration matrix state
    resultsStore.js            # placements/bonus-points/leaderboard state
    useApiResource.js            # generic authenticated-CRUD-resource hook
    usePublicResource.js          # generic public (unauthenticated) fetch hook
    formatTime.js / initials.js / mockData.js
```

### Routing (`App.jsx`)

| Path | Page | Auth |
|---|---|---|
| `/` | `LandingPage` | Public |
| `/login` | `LoginPage` | Public |
| `/signup` | `SignupPage` | Public |
| `/privacy` | `PrivacyPage` | Public |
| `/terms` | `TermsPage` | Public |
| `/admin` (+ children) | `AdminLayout` → dashboard, teams, categories, events, rules, venues, students, registration, registrations/view, schedule, results, settings | `ProtectedRoute` (requires a stored refresh token) |
| `/:slug` | `MadrassaDashboard` | Public |
| `/:slug/results` | `ResultsPage` | Public |
| `/:slug/schedule` | `SchedulePage` | Public |

Every admin route is wrapped in an `ErrorBoundary` keyed on the current pathname, so a crash in one admin page doesn't take down the sidebar/shell or other pages.

## State Management & API Integration

- **No Redux/Zustand/etc.** — each concern gets a small module under `src/lib/` exposing state via `useSyncExternalStore` (`authStore.js`, `themeStore.js`, `registrationStore.js`, `resultsStore.js`).
- **Generic data hooks**: `useApiResource.js` wraps authenticated CRUD against a resource endpoint; `usePublicResource.js` wraps unauthenticated public-page fetches. Most admin pages compose these rather than hand-rolling fetch logic per page.
- **`apiClient.js`** is the single fetch wrapper all API calls go through:
  - Base URL comes from `VITE_API_BASE_URL`.
  - The **access token lives in memory only** (a module-level variable) — never written to `localStorage`/`sessionStorage`, so it doesn't survive a hard reload.
  - The **refresh token persists in `localStorage`** (key `mm_refresh_token`), so a page reload can silently re-authenticate.
  - On a `401`, the client transparently attempts `/auth/refresh/` and retries the original request once before giving up.
  - Every failure is thrown as an `ApiError` (`{message, status, data}`), where `data` is the backend's `{error: {...}}` envelope — see `backend/README.md`.

## Design System

Public and admin surfaces intentionally use two different palettes.

**Public site** (`src/index.css`, Tailwind v4 CSS-first `@theme` tokens, no `tailwind.config.js`): emerald-and-gold on warm ivory (`--color-canvas`, `--color-emerald-*`, `--color-gold-*`), `Cormorant Garamond` (display) / `Manrope` (body) fonts, dark mode via a `.dark` class re-pointed from `prefers-color-scheme`.

**Admin dashboard** (`components/admin/*`, `pages/admin/*`): applies its accent colors directly as Tailwind arbitrary-value utilities rather than theme tokens —

- **`#21F1A8`** (Mint Green) — primary accent: buttons, active nav state, focus rings, toggles, ID card accent bar.
- **`#171717`** (Dark Gray) — dark-mode surface/background color.

When touching admin UI, match existing components' `text-[#21F1A8]` / `bg-[#21F1A8]` / `dark:bg-[#171717]` usage rather than introducing new hex values or the public-site theme tokens.

## Notable Dependencies

- `react-router` / `react-router-dom` v7 — routing.
- `xlsx` — client-side Excel/CSV parsing for student bulk-import and table exports.
- `jspdf` + `jspdf-autotable` and `html-to-image` — client-side generation of shareable student/event posters.
- `qrcode.react` — renders per-student QR codes on printable ID cards.
- `react-helmet-async` — per-page `<head>` management (`SeoHead.jsx`).

## Build Output Splitting (`vite.config.js`)

Vendor code is manually chunked so cache lifetime tracks how often each dependency changes, and heavy export/print tooling never bloats the public/landing bundle:

| Chunk | Packages |
|---|---|
| `vendor-react` | `react`, `react-dom` |
| `vendor-router` | `react-router`, `react-router-dom` |
| `vendor-export-pdf` | `jspdf`, `jspdf-autotable` |
| `vendor-export-image` | `html-to-image` |
| `vendor-export-xlsx` | `xlsx` |
| `vendor` | everything else (including `qrcode.react`) |

Build target is `es2020`; source maps are emitted for non-`production` mode builds and omitted from the default production build. A single chunk exceeding 600 KB fails the build.

## Deployment

Deploys to Vercel (`vercel.json`) — build command `npm run build`, output directory `dist/`. `vercel.json` also rewrites all non-`/assets/*` paths to `/index.html` (SPA client-side routing), sets a 1-year immutable cache on `/assets/*`, and applies baseline security headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`) to every response.
