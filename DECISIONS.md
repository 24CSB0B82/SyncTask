# Architectural & Design Decisions

This document records architectural decisions, trade-offs, and deviations from the baseline specification.

---

## Decision 1: Database Migration from PostgreSQL to MongoDB

**Date:** 2026-10-13  
**Status:** Accepted  
**Context:**  
The user requested substituting PostgreSQL 16 with MongoDB while maintaining all requirements of SyncTask (offline-first architecture, local-first Dexie IndexedDB sync, atomic cursor-based rev tracking, soft deletes, and user isolation).

### Impact & Conflict Analysis

1. **No Blocking Conflicts:**
   The offline-first sync protocol is decoupled from the specific database engine. Both PostgreSQL and MongoDB can fulfill the sync contract (`/sync/push`, `/sync/pull`, `/sync/stream`).
2. **Primary Key & UUID Handling:**
   - _PostgreSQL:_ native `uuid` columns.
   - _MongoDB:_ Default `ObjectId` can cause friction with client-generated UUIDs (`crypto.randomUUID()`).
   - _Resolution:_ All MongoDB documents will explicitly store the client's UUID string directly in `_id: string`. This creates a 1:1, zero-conversion mapping between IndexedDB and MongoDB.
3. **Atomic Cursor Increment:**
   - _PostgreSQL:_ Used `cursor bigint` with transactional increment.
   - _MongoDB:_ Uses `findOneAndUpdate({ _id: userId }, { $inc: { cursor: 1 } }, { returnDocument: 'after' })` which is natively atomic per document without needing complex distributed locks.
4. **Rev Tracking & Compound Indexes:**
   - Every document in `tasks`, `lists`, `subtasks`, `notifications`, and `user_settings` retains `userId: string`, `rev: number`, `createdAt: Date`, `updatedAt: Date`, and `deletedAt: Date | null`.
   - Compound index `{ userId: 1, rev: 1 }` is applied to each collection for efficient delta queries (`rev > since`).
5. **Real-time Scale-out:**
   - _PostgreSQL:_ Would require `LISTEN/NOTIFY`.
   - _MongoDB:_ Naturally scales out across processes using MongoDB Change Streams (`collection.watch()`). For local dev / single node, an in-memory event emitter is used as specified in Section 8.4.
6. **Local Development:**
   - `docker-compose.yml` configures `mongo:7` mapped to port 27017 instead of PostgreSQL 16 on port 5432.
   - Environment variable changed from `DATABASE_URL=postgresql://...` to `MONGODB_URI=mongodb://localhost:27017/synctask`.

---

## Decision 2: Monorepo Setup & Tooling Configuration

**Date:** 2026-10-13  
**Status:** Accepted  
**Context:**  
Standard npm workspaces configured with `apps/web`, `apps/api`, and `packages/shared`. TypeScript project references and shared zod schemas.

---

## Decision 3: Phase 8 & 9 Authentication, Profile, Recovery & Security Hardening

**Date:** 2026-10-29  
**Status:** Accepted  
**Context:**  
Implementation of user profile customisation, password recovery, social identity provider account linking, data export, outbox compaction, and production hardening.

### Details & Specifications Met:

1. **Client-Side Avatar Resizing (FR-AUTH-4):**
   - Resized via HTML5 Canvas to 256x256 WebP with a hard limit of 100 KB.
   - Preserves user privacy without requiring heavy server-side image processing dependencies.
2. **Deterministic Password Reset Flow (FR-AUTH-6):**
   - Generates 32-byte cryptographic random tokens with SHA-256 database hashing and 1-hour expiry.
   - Development links logged directly to server stdout; production-ready for SMTP.
3. **OAuth Account Linking (FR-AUTH-5):**
   - Google & GitHub OAuth handlers automatically link accounts based on verified email, seamlessly seeding default collections for new identities.
4. **Outbox Compaction (Section 8.3):**
   - Merges consecutive entity mutations before cloud sync and removes canceled create-then-delete mutations before dispatching to `/api/sync/push`.
5. **Security & Production Hardening (NFR-1, NFR-2, Section 14.2):**
   - Helmet CSP and HSTS enforcement.
   - Global React `ErrorBoundary` and friendly 404 route handling.

---

## Decision 4: User Session Isolation & Demo Mode Restoration

**Date:** 2026-10-30  
**Status:** Accepted  
**Context:**  
During project demonstrations and testing, users create an account, log in, and add personal tasks. When logging out, the dashboard must immediately return to its pristine "demo mode" (with clean starter tasks and lists) without showing tasks created in the user profile, allowing seamless repeated demonstrations.

### Implementation & Architecture:

1. **Active User Reactive State (`activeUser.ts`):**
   - Tracks the active user ID (`'demo'` for unauthenticated guests, or `<userId>` for logged-in accounts).
   - Exposes `getActiveUserId()`, `setActiveUserId(userId)`, and `subscribeActiveUserId(listener)`.
2. **Dynamic Database Resolution (`dexie.ts`):**
   - `getDb(userId?: string)` dynamically routes to `synctask_${userId || getActiveUserId()}`.
   - The demo database is isolated to `synctask_demo`, while user profiles use `synctask_<userId>`.
3. **Reactive React Live Hooks (`useDatabase.ts`):**
   - `useCurrentUserId()` listens to active user transitions.
   - All live query hooks (`useLiveTasks`, `useLiveLists`, `useLiveSubtasks`, etc.) automatically re-query the target database whenever the active user changes.
4. **Pristine Demo Restoration on Logout (`useSession.ts`):**
   - When `logout()` or `deleteAccount()` is invoked:
     1. Clears `localStorage` auth token.
     2. Calls `syncEngine.reset()` to stop streaming and clear outbox pending state.
     3. Calls `setActiveUserId(null)` (resetting active user to `'demo'`).
     4. Calls `resetDemoDatabase()`, which clears `synctask_demo` and re-seeds clean starter tasks, subtasks, lists, and notifications.
   - The user's account database (`synctask_<userId>`) and MongoDB cloud records remain securely persisted and isolated.
