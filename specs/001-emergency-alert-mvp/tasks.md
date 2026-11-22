# Tasks: Family Emergency Alert MVP

**Branch**: `001-emergency-alert-mvp` | **Spec**: [Feature Specification](file:///Users/henrylai/workspace/family_alert/specs/001-emergency-alert-mvp/spec.md) | **Plan**: [Implementation Plan](file:///Users/henrylai/workspace/family_alert/specs/001-emergency-alert-mvp/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize monorepo directory structure, package manifests, and development configurations.

- [ ] T001 Initialize `backend/` Node.js TypeScript project with dependencies (`express`, `socket.io`, `web-push`, `better-sqlite3`, `dotenv`, `cors`, `zod`, `tsx`, `typescript`) in `backend/package.json`
- [ ] T002 Initialize `frontend/` React TypeScript PWA with Vite, Tailwind CSS, Lucide icons in `frontend/package.json`
- [ ] T003 [P] Create `Dockerfile` with multi-stage build (build frontend, build backend, package single production runtime)
- [ ] T004 [P] Create `railway.json` declaring deployment configuration, healthcheck path `/health`, and restart policy
- [ ] T005 [P] Create root `package.json` with convenience scripts (`npm run dev:backend`, `npm run dev:frontend`, `npm run build`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, core types, Socket.IO gateway, and VAPID push infrastructure.

- [ ] T006 Define shared TypeScript types for `FamilyGroup`, `GroupMember`, `EmergencyIncident`, `IncidentAcknowledgment` in `backend/src/types/index.ts`
- [ ] T007 Setup SQLite database initialization and schema migration in `backend/src/db/index.ts`
- [ ] T008 [P] Implement VAPID Web Push helper service in `backend/src/services/pushService.ts`
- [ ] T009 [P] Initialize Express app and HTTP server with CORS, JSON parser, and `/health` route in `backend/src/index.ts`
- [ ] T010 Setup Socket.IO server with room subscription logic (`group_${groupId}`) in `backend/src/socket/index.ts`
- [ ] T011 [P] Setup frontend API client and Socket.IO client hook in `frontend/src/services/api.ts` and `frontend/src/hooks/useSocket.ts`

---

## Phase 3: User Story 1 - Group Creation & Invite Code Onboarding (Priority: P1) 🎯 MVP Foundation

**Goal**: Allow users to create family groups with short invite codes (e.g. `FAM-4912`) and join using only a code and display name.

- [ ] T012 [US1] Implement group creation controller `POST /api/groups` (generates 6-character code, saves group & admin member) in `backend/src/controllers/groupController.ts`
- [ ] T013 [US1] Implement group join controller `POST /api/groups/join` (validates code, creates member session) in `backend/src/controllers/groupController.ts`
- [ ] T014 [US1] Implement group roster endpoint `GET /api/groups/:id` in `backend/src/controllers/groupController.ts`
- [ ] T015 [US1] Create client session state management (local storage persistence for `groupId`, `memberId`, `token`) in `frontend/src/services/storage.ts`
- [ ] T016 [US1] Build `GroupOnboardingModal` component (tabs: "Create Family Group" & "Join with Code") in `frontend/src/components/GroupOnboardingModal.tsx`
- [ ] T017 [US1] Build `MemberRoster` component displaying family members and online status in `frontend/src/components/MemberRoster.tsx`

---

## Phase 4: User Story 2 - Instant 1-Touch Emergency Alert Broadcast (Priority: P1) 🎯 Core Alert

**Goal**: 1-touch emergency activation broadcasting immediate alert to all connected group members.

- [ ] T018 [US2] Implement incident trigger endpoint `POST /api/incidents/trigger` in `backend/src/controllers/incidentController.ts`
- [ ] T019 [US2] Wire Socket.IO `emergency:trigger` event to broadcast `alert_triggered` to all members in `backend/src/socket/incidentSocket.ts`
- [ ] T020 [US2] Build `EmergencyButton` component with 1.5s press-and-hold progress ring or rapid-cancel window in `frontend/src/components/EmergencyButton.tsx`
- [ ] T021 [US2] Build `ActiveIncidentBanner` showing alert sender, elapsed timer, and live status in `frontend/src/components/ActiveIncidentBanner.tsx`

---

## Phase 5: User Story 3 - Loud Looping Siren, Flashing UI & Screen Wake Lock (Priority: P1) 🎯 Alarm Sensory

**Goal**: When an alert is received, play continuous dual-tone siren at max gain, pulse vibration, request wake lock, and flash high-contrast beacon.

- [ ] T022 [US3] Implement Web Audio API dual-tone siren synthesizer (alternating 880Hz / 660Hz with dynamics compression) in `frontend/src/services/audioAlarm.ts`
- [ ] T023 [US3] Implement Screen Wake Lock and Vibration controller in `frontend/src/services/deviceControls.ts`
- [ ] T024 [US3] Build full-screen `AlarmOverlay` with red/white strobe animation, giant "MUTE SIREN" and "I'M RESPONDING" buttons in `frontend/src/components/AlarmOverlay.tsx`
- [ ] T025 [US3] Wire audio unlock listener on initial page touch to comply with mobile browser autoplay policies in `frontend/src/App.tsx`

---

## Phase 6: User Story 4 - Live Acknowledgment & Status Feedback (Priority: P2)

**Goal**: Real-time acknowledgment buttons ("I'm Safe", "On My Way", "Calling 911") visible to all members.

- [ ] T026 [US4] Implement acknowledgment endpoint `POST /api/incidents/:id/acknowledge` in `backend/src/controllers/incidentController.ts`
- [ ] T027 [US4] Wire Socket.IO `incident:ack` event to broadcast real-time status updates in `backend/src/socket/incidentSocket.ts`
- [ ] T028 [US4] Implement incident resolution endpoint `POST /api/incidents/:id/resolve` in `backend/src/controllers/incidentController.ts`
- [ ] T029 [US4] Build `AcknowledgmentList` component showing real-time response badges in `frontend/src/components/AcknowledgmentList.tsx`

---

## Phase 7: User Story 5 - Web Push Notifications & DND Contact Bypass Guide (Priority: P2)

**Goal**: Deliver background push notifications when screen is locked, and provide iOS/Android contact bypass instructions.

- [ ] T030 [US5] Implement `POST /api/push/subscribe` and push dispatch on emergency trigger in `backend/src/services/pushService.ts`
- [ ] T031 [US5] Implement Service Worker with push notification handler and click action in `frontend/public/sw.js`
- [ ] T032 [US5] Implement PWA Web App Manifest (`manifest.json`) with emergency icons and standalone display mode in `frontend/public/manifest.json`
- [ ] T033 [US5] Build `DNDSetupGuideModal` with interactive instructions for iOS "Emergency Bypass" and Android "Starred Contacts" in `frontend/src/components/DNDSetupGuideModal.tsx`

---

## Phase 8: User Story 6 - Siren & Audio Volume Test Mode (Priority: P3)

**Goal**: Safe test mode to verify speaker output and audio permissions.

- [ ] T034 [US6] Build `SirenTestCard` component allowing a 5-second sample alarm in `frontend/src/components/SirenTestCard.tsx`
- [ ] T035 [US6] Add speaker volume check indicator and browser permission diagnostics in `frontend/src/components/AudioDiagnostics.tsx`

---

## Phase 9: Railway Deployment & End-to-End Verification

**Purpose**: Production packaging, deployment testing, and verification.

- [ ] T036 Verify root `Dockerfile` builds cleanly and bundles Vite frontend with Express backend
- [ ] T037 Validate health check endpoint `/health` returns status `ok`
- [ ] T038 Create comprehensive `README.md` with architecture diagram, local instructions, and Railway deployment steps
- [ ] T039 Commit all initial Spec Kit and project scaffold files to git main branch
