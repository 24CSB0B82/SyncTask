# SyncTask: Comprehensive System Documentation & Architecture Reference

SyncTask is a calm, fast, offline-first personal to-do and deadline planner. Designed with a local-first philosophy, all user operations execute immediately against a client-side IndexedDB database (via Dexie.js) and synchronize asynchronously to a MongoDB cloud database.

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser Context                        │
│                                                              │
│  React 18 UI  ◄── live queries ──► Dexie.js (IndexedDB)      │
│      │                                    │                  │
│      ▼                                    ▼                  │
│  User Interaction                  Outbox Queue              │
│                                           │                  │
│                                           ▼                  │
│  ReminderScheduler (Web Locks)      Sync Engine              │
│                                    (Compaction)              │
│                                           │                  │
└───────────────────────────────────────────┼──────────────────┘
                    HTTPS Push / Pull (REST)│▲ SSE Real-time Ping
┌───────────────────────────────────────────▼┼─────────────────┐
│                      Express API Backend                     │
│                                                              │
│  /api/auth       /api/sync/push      /api/sync/stream        │
│  (Argon2id/JWT)  (Atomic rev cursor) (Server-Sent Events)    │
│  /api/sync/pull  /api/auth/profile   /api/auth/export        │
│                                                              │
│                         Mongoose                             │
│                             │                                │
│                             ▼                                │
│                     MongoDB Database                         │
│  users, tasks, subtasks, lists, notifications, settings      │
└──────────────────────────────────────────────────────────────┘
```

### 1.1 Core Architectural Principles

1. **Local-First Zero-Latency UI:** The user interface reads and writes solely to IndexedDB. Network calls never block interactive user operations.
2. **Deterministic Entity IDs:** Every entity (Task, Subtask, List, Notification) is generated client-side via `crypto.randomUUID()` or deterministic composite keys (`<taskId>:<type>:<dueDate>T<dueTime>`).
3. **Atomic Revision Tracking:** Every user document maintains an incrementing atomic `rev` counter on the server (`findOneAndUpdate({ _id: userId }, { $inc: { cursor: 1 } })`). Pull operations fetch changes with `rev > since`.
4. **Outbox Compaction:** Redundant mutations (consecutive field updates or temporary create-then-delete sequences) are compacted locally before network transmission.
5. **Real-time Live Sync:** Tabs and multi-device sessions receive near-instant updates through Server-Sent Events (`/api/sync/stream`) with exponential fallback polling.

---

## 2. Monorepo Structure

```
SyncTask/
├── apps/
│   ├── api/                   # Node.js + Express + Mongoose API
│   │   ├── src/
│   │   │   ├── db/            # MongoDB connection
│   │   │   ├── lib/           # Passwords (Argon2id), JWT tokens
│   │   │   ├── middleware/    # Auth, Rate limiting, Error handlers
│   │   │   ├── models/        # Mongoose schemas (User, Task, Subtask, List, etc.)
│   │   │   └── routes/        # auth.ts (OAuth, reset, export, profile), sync.ts
│   │   └── test/              # Vitest integration tests (auth, sync, health)
│   │
│   └── web/                   # Vite + React 18 + Tailwind SPA + PWA
│       ├── public/            # Favicon, PWA manifest icons
│       └── src/
│           ├── components/    # Reusable Radix UI wrappers (Dialog, Popover, Toast, etc.)
│           │   ├── layout/    # Header, Sidebar, RightPanel, BottomNav
│           │   └── ui/        # Button, Badge, Chip, Checkbox, ErrorBoundary
│           ├── db/            # Dexie.js schema, live queries, repositories
│           ├── features/
│           │   ├── auth/      # AuthModal, useSession (OAuth, profile, reset)
│           │   ├── calendar/  # CalendarGrid, DayCell, DayPreview, mini calendar
│           │   ├── lists/     # ListDialog, color selectors
│           │   ├── notifications/# ReminderScheduler, rules engine, BellDropdown
│           │   ├── subtasks/  # SubtaskTree (|__ CSS lines), ProgressSegments
│           │   ├── sync/      # engine.ts, compaction.ts, SyncPill
│           │   └── tasks/     # TaskCard, TaskDialog, urgency sorting, filters
│           ├── pages/         # TasksPage, CalendarPage, SyncCenterPage, SettingsPage, ResetPasswordPage, NotFoundPage
│           └── styles/        # tokens.css, globals.css (Morning mist / Deep tide)
│
└── packages/
    └── shared/                # Cross-tier TypeScript definitions and Zod schemas
        └── src/
            ├── constants.ts   # Priorities, 8-color subtask palette, defaults
            ├── schemas.ts     # Zod runtime validators
            └── types.ts       # Inferred TypeScript interfaces
```

---

## 3. Design System & Theme Engine

SyncTask adheres to a **calm, low-stress, peaceful visual design** with zero harsh contrast.

### 3.1 Design Tokens

| Token          | Morning Mist (Light) | Deep Tide (Dark) | Purpose                                                    |
| -------------- | -------------------- | ---------------- | ---------------------------------------------------------- |
| `--bg`         | `#EEF4F7`            | `#0E1A24`        | Primary viewport background with soft radial teal gradient |
| `--surface`    | `#FFFFFF`            | `#14232F`        | Card and modal surface                                     |
| `--surface-2`  | `#F4F8FA`            | `#1A2D3B`        | Interactive input and secondary panel surfaces             |
| `--border`     | `#D5E1E8`            | `#25394A`        | Low-contrast calming dividers                              |
| `--text`       | `#1E2F3B`            | `#E4EEF3`        | Primary typography                                         |
| `--text-muted` | `#5B7080`            | `#8DA4B3`        | Secondary labels, monospace timestamps                     |
| `--primary`    | `#3F7FB8`            | `#7FB6E8`        | Calm blue accent                                           |
| `--accent`     | `#2E9C8F`            | `#6FD0C0`        | Teal sync status and completion indicator                  |
| `--prio-high`  | `#C75B52`            | `#E8837A`        | High priority / overdue badge                              |
| `--prio-med`   | `#B7791F`            | `#E5B567`        | Medium priority badge                                      |
| `--prio-low`   | `#2F8F6B`            | `#7CC9A5`        | Low priority badge                                         |

### 3.2 Accessibility (A11y) & Motion

- **WCAG AA Compliance:** Strict contrast ratios maintained across both themes.
- **Flash Prevention:** Inline script in `index.html` inspects `localStorage['st-theme']` and sets `<html data-theme="...">` prior to first DOM paint.
- **Reduced Motion:** Global media query `@media (prefers-reduced-motion: reduce)` dampens animations to 0.01ms.
- **Global Keyboard Navigation:**
  - `C`: Quick-create task from anywhere.
  - `Ctrl+K` / `Cmd+K`: Focus search bar.
  - `Esc`: Close open dialogs, previews, and popovers.

---

## 4. Functional Modules Breakdown

### 4.1 Task Management & Urgency Sorting

- **Smart Views:**
  - **Focus Stream:** Complete active task stream sorted by urgency.
  - **Today:** Tasks due today with time breakdown.
  - **Upcoming:** Next 7 days of scheduled tasks.
  - **Overdue:** Active tasks past due date with danger accent.
  - **Completed:** Paginated history (50 items per batch).
- **Urgency Algorithm (`urgency.ts`):**
  $$\text{Overdue active (oldest due first)} \to \text{Due today (by time)} \to \text{Future tasks (soonest first)} \to \text{Undated (by priority, newest first)}$$
- **Due Chip Formats:** `Today 18:00`, `Tomorrow`, `Oct 24`, and `Overdue · Oct 21`.

### 4.2 Subtask Tree & 8-Color Palette Rotation

- **CSS Connector Lines (`|__`):** Hierarchical visual tree rendered using pure CSS borders without heavy icon libraries.
- **8-Color Palette Rotation:**
  `emerald` $\to$ `lavender` $\to$ `sky` $\to$ `coral` $\to$ `amber` $\to$ `rose` $\to$ `teal` $\to$ `slate`.
- **Segmented Progress Bar:** Custom progress tracker showing segmented blocks matching each subtask's assigned color.
- **Auto-completion Prompt:** Automatically suggests marking the parent task complete once all subtasks are checked.

### 4.3 Calendar Page & Day Preview Drawer

- **Month Grid (`CalendarGrid.tsx`):**
  - Displays adjacent priority dots (max 4, then `+N`), hollow rings for completed tasks, and filled circles for today.
  - Configurable Monday or Sunday week start.
- **Animated Day Preview:**
  - Clicking any day smoothly compacts the grid and drops down an agenda drawer with chronological timestamps and an inline `+ Add task on this day` action.
- **Mini Calendar Widget:** Compact month view residing inside desktop's RightPanel, linking directly to `/calendar?date=YYYY-MM-DD`.

### 4.4 Deterministic Notification Engine

- **Web Locks Tab Leader (`ReminderScheduler.ts`):** Uses `navigator.locks.request('synctask-scheduler')` so only one browser tab executes the background timer, preventing duplicate toasts across tabs.
- **Deterministic IDs:** ID format `${taskId}:${type}:${dueDate}T${dueTime}` guarantees deduplication across client restarts and devices.
- **Quiet Hours:** Automatically suppresses audible/visual toasts during user-defined intervals (e.g. 22:00 to 07:00, including midnight crossover support).
- **Snooze Engine:** Snooze for 10 minutes, 1 hour, or tomorrow at 09:00.
- **Grouped Missed Alerts:** Reopening the app after inactivity clusters missed reminders into a single friendly summary toast.

### 4.5 Authentication, Social OAuth & Profile

- **Security & Password Hashing:** User passwords hashed using **Argon2id**. Sessions maintained with HTTP-only, SameSite=Lax JWT cookies.
- **Profile Customization (FR-AUTH-4):**
  - Display name and password updates.
  - Profile picture upload with client-side canvas resizing to $256 \times 256$ WebP with a hard limit of 100 KB.
- **Social OAuth (FR-AUTH-5):**
  - Google and GitHub one-click login buttons with verified-email account linking.
- **Password Recovery (FR-AUTH-6):**
  - SHA-256 hashed 1-hour reset tokens. Development links logged to console; production ready for SMTP.
  - Dedicated `/reset-password?token=...` UI page.
- **Data Portability & Account Deletion (FR-GAP-6):**
  - **Export JSON:** Complete structured backup download.
  - **Account Deletion:** Permanent cascade deletion from MongoDB and local IndexedDB with email confirmation check.

### 4.6 Offline Sync & Compaction Protocol

- **Outbox Compaction (`compaction.ts`):**
  - Merges consecutive updates to the same entity into a unified patch.
  - Cancels out local `create` followed by `delete` before hitting network.
  - Ensures `delete` operations supersede prior updates.
- **Session Preservation on 401:** If authentication expires while offline, local outbox records are strictly preserved until re-authentication.

---

## 5. API Reference

All requests accept and return JSON. Endpoints with `[Auth]` require an active session cookie or `Authorization: Bearer <token>` header.

### Authentication & Account

| Method | Endpoint                    | Description                                                  |
| ------ | --------------------------- | ------------------------------------------------------------ |
| `POST` | `/api/auth/register`        | Register new user, seed default collections, set auth cookie |
| `POST` | `/api/auth/login`           | Authenticate user credentials and issue session              |
| `POST` | `/api/auth/logout`          | Clear session cookie                                         |
| `GET`  | `/api/auth/me`              | Return current authenticated user profile `[Auth]`           |
| `PUT`  | `/api/auth/profile`         | Update username, WebP avatar, or password `[Auth]`           |
| `POST` | `/api/auth/oauth`           | Social login/registration with account linking               |
| `POST` | `/api/auth/forgot-password` | Request password reset token                                 |
| `POST` | `/api/auth/reset-password`  | Set new password with valid reset token                      |
| `GET`  | `/api/auth/export`          | Download complete JSON account backup `[Auth]`               |
| `POST` | `/api/auth/delete-account`  | Permanently delete account and all records `[Auth]`          |

### Synchronization

| Method | Endpoint                        | Description                                                        |
| ------ | ------------------------------- | ------------------------------------------------------------------ |
| `POST` | `/api/sync/push`                | Push compacted outbox mutations with atomic rev increment `[Auth]` |
| `GET`  | `/api/sync/pull?since=<cursor>` | Pull all delta mutations where `rev > since` `[Auth]`              |
| `GET`  | `/api/sync/stream`              | Server-Sent Events stream for real-time invalidation `[Auth]`      |

---

## 6. Verification & Test Suite

The project includes unit, integration, and UI tests across all three packages:

```bash
# Run all tests
npm run test

# Run TypeScript strict typecheck
npm run typecheck

# Verify Prettier and formatting standards
npm run lint

# Production build test
npm run build
```

- **Shared Suite (4 tests):** Priority constants, palette validation, Zod schema validation.
- **API Suite (21 tests):** Health check, user registration, invalid credentials, Argon2id hashing, profile updates, password reset flow, OAuth linking, data export, account deletion, push idempotency, pull isolation, SSE streaming.
- **Web Suite (30 tests):** Urgency sorting, due chip dates, calendar grouping, notification rules (including midnight quiet hours), outbox compaction, theme switching, active user state and database isolation.

---

## 7. Production Deployment & Configuration

### Environment Variables

**`apps/api/.env`:**

```env
PORT=4000
NODE_ENV=production
WEB_ORIGIN=https://synctask.yourdomain.com
JWT_SECRET=super-secure-random-secret-key-at-least-32-chars
MONGODB_URI=mongodb://mongo-user:mongo-pass@mongodb:27017/synctask?authSource=admin
```

**`apps/web/.env`:**

```env
VITE_API_URL=https://api.synctask.yourdomain.com
```

### Docker Compose

Run the stack locally or on production servers:

```bash
docker compose up -d
```

MongoDB is initialized on port 27017 with persistent volume storage in `mongo_data`.

---

## 8. Presentation & Demonstration Guide

SyncTask includes built-in database isolation designed specifically for project presentations:

1. **Pristine Demo Mode (`synctask_demo`):**
   - When opened in guest mode without logging in, the app operates against a dedicated `synctask_demo` IndexedDB.
   - Preloaded with a realistic set of starter tasks (overdue, due today, upcoming, completed), lists ("Project Roadmap", "Client Deliverables"), subtasks, and sample notifications.
2. **Authenticated Account Mode (`synctask_<userId>`):**
   - When a user registers or logs in, the app instantly switches to `synctask_<userId>`.
   - New tasks created during the logged-in session are stored in their isolated database and automatically synchronized to MongoDB.
3. **One-Click Logout & Instant Demo Reset:**
   - Clicking **Log out** (available directly on the top header or in Settings) immediately:
     1. Cleans the session credentials and resets the sync engine.
     2. Switches active database routing back to `'demo'`.
     3. Executes `resetDemoDatabase()`, resetting `synctask_demo` to the clean starter state.
   - The presenter can immediately showcase the application again from the beginning without leftover personal test data.
