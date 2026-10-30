# SyncTask

A calm, fast, offline-first personal to-do and deadline planner. Tasks live on the device first (IndexedDB) and sync to a MongoDB server backend so the same account works across tabs, browsers, and devices.

## Features

- **Offline-first Architecture:** Instant reads and writes with Dexie.js (IndexedDB).
- **Peaceful & Calming Aesthetic:** Soft blue-teal surfaces, "Morning mist" (light) and "Deep tide" (dark) themes with AA-compliant contrast.
- **Smart Triage & Urgency Sorting:** Focus Stream, Today, Upcoming, Overdue, and Completed views.
- **Subtask Trees & Segmented Progress:** Multi-level visual subtasks with CSS connector lines (`|__`) and 8-color palette rotation.
- **Interactive Calendar:** Month view with priority dots, animated day preview panel, and keyboard navigation.
- **Deterministic Reminders:** Lead-time deadline alerts, in-app bell center, snooze, and quiet hours.
- **Cross-device Sync:** Outbox mutation queue, conflict-safe field patches, and MongoDB persistence.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Zustand, Dexie.js, Radix UI primitives, date-fns, Lucide icons.
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), zod, Argon2id, JWT, SSE.
- **Shared:** `@synctask/shared` with shared Zod schemas and TypeScript types.

## Getting Started

### 1. Prerequisites

- Node.js >= 20
- Docker & Docker Compose (or a local MongoDB instance running on port 27017)

### 2. Installation

```bash
npm install
```

### 3. Start Database

```bash
docker compose up -d
```

### 4. Running the Dev Server

```bash
# Run both API and Web concurrently
npm run dev

# Or run separately:
npm run dev:api
npm run dev:web
```

- Web App: `http://localhost:5173`
- API Health: `http://localhost:4000/api/health`

### 5. Typecheck & Tests

```bash
npm run typecheck
npm run test
```
