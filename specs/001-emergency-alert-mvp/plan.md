# Implementation Plan: Family Emergency Alert MVP

**Branch**: `001-emergency-alert-mvp` | **Date**: 2026-11-22 | **Spec**: [Feature Specification](file:///Users/henrylai/workspace/family_alert/specs/001-emergency-alert-mvp/spec.md)

---

## 1. Summary

The Family Emergency Alert system is an urgent-notification platform designed to reliably wake, warn, and coordinate family members in emergency situations. The MVP consists of:
1. **Containerized Backend**: Node.js/TypeScript service with WebSocket (`socket.io`), REST API, Web Push (VAPID) engine, and persistent storage, packaged for direct deployment to **Railway.app**.
2. **Mobile-First Progressive Web App (PWA)**: React + Vite + Tailwind CSS frontend featuring invite-code group onboarding, 1-touch emergency activation, Web Audio API continuous siren, Screen Wake Lock, and high-contrast flashing beacon.
3. **Defense-in-Depth Alerting & DND Strategy**: Tiered escalation utilizing high-urgency Web Push, foreground siren loop, OS Emergency Bypass contact setup guides, and clean architecture designed for future Capacitor native wrapper deployment.

---

## 2. Technical Context

- **Backend Runtime**: Node.js 20+ LTS / TypeScript 5+
- **Backend Framework**: Express with `socket.io` for robust WebSocket room management, automatic reconnection, and acknowledgment delivery.
- **Push Notification Service**: `web-push` (RFC 8291 / 8292 standard) with VAPID key pair generation and push subscription persistence.
- **Frontend Framework**: React 19 / Vite + TypeScript + Tailwind CSS.
- **Client APIs**:
  - `AudioContext` (Web Audio API) for dual-tone emergency siren synthesizer with dynamic gain node.
  - `navigator.wakeLock` for screen-on persistence during active alerts.
  - `navigator.vibrate` for tactile alarm pulses.
  - `ServiceWorker` + `PushManager` for background notification receipt.
- **Data Persistence**: SQLite (via `better-sqlite3` or Drizzle ORM) for lightweight, zero-dependency storage, with environment switch for PostgreSQL (`DATABASE_URL`) on Railway.
- **Deployment Platform**: Railway.app via root `Dockerfile` and `railway.json`.
- **Target Mobile Browsers**: Safari (iOS 16.4+ PWA) and Chrome (Android).

---

## 3. Constitution & Gate Verification

| Principle | Check / Gate | Status |
|---|---|---|
| **I. Emergency Reliability** | Real-time WebSocket delivery (<500ms) with delivery acknowledgment roundtrip | PASSED |
| **II. Radical Simplicity** | Onboarding via 6-character invite code (e.g. `FAM-4912`), zero password friction, 1-touch trigger | PASSED |
| **III. Platform Realism & DND** | Multi-tier defense-in-depth: Web Push + Web Audio Siren + OS Bypass Guide + Capacitor-ready architecture | PASSED |
| **IV. Railway Deployability** | Self-contained Dockerfile, port-binding from `PORT` env var, health check at `/health` | PASSED |
| **V. Privacy & Isolation** | Group data isolated by UUID, invite codes regenerable, sessions tokenized | PASSED |

---

## 4. System Architecture & Component Design

```
+-------------------------------------------------------------+
|                        Client Tier                          |
|  +-------------------+  +--------------------------------+  |
|  | Web Audio Siren   |  | Service Worker (Push Handler)  |  |
|  | (Dual-Tone Synth) |  | (High-Urgency Notification)    |  |
|  +-------------------+  +--------------------------------+  |
|  +-------------------------------------------------------+  |
|  | React PWA UI (Vite + Tailwind)                         |  |
|  | - 1-Touch Trigger Button (Press & Hold guard)          |  |
|  | - Group Invite / Join View                            |  |
|  | - Active Emergency Dashboard (Ack buttons)           |  |
|  | - Sound & Vibration Test Mode                         |  |
|  | - DND Contact Bypass Setup Guide                      |  |
|  +-------------------------------------------------------+  |
+------------------------------+------------------------------+
                               | HTTPS / WSS
                               v
+-------------------------------------------------------------+
|                 Backend Service (Railway.app)               |
|  +--------------------+  +-------------------------------+  |
|  | Express REST API   |  | Socket.IO Gateway             |  |
|  | - /api/groups      |  | - room: group_{groupId}       |  |
|  | - /api/incidents   |  | - event: emergency:trigger    |  |
|  | - /api/push        |  | - event: member:ack           |  |
|  | - /health          |  | - event: incident:resolved    |  |
|  +--------------------+  +-------------------------------+  |
|  +-------------------------------------------------------+  |
|  | Web Push Engine (VAPID RFC 8292)                      |  |
|  +-------------------------------------------------------+  |
|  +-------------------------------------------------------+  |
|  | Storage Repository (SQLite / PostgreSQL)              |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

---

## 5. Detailed Component Specifications

### 5.1 Web Audio Siren Engine (`frontend/src/services/audioAlarm.ts`)
- Modern browsers block audio until the user interacts with the page.
- On initialization / user tap, the app unlocks an `AudioContext`.
- When an alert triggers, an oscillator node generates an alternating dual-frequency tone:
  - Frequency A: 880 Hz (A5) for 400ms
  - Frequency B: 660 Hz (E5) for 400ms
  - Swept through an exponential ramp at full gain (`gainNode.gain.value = 1.0`).
- A DynamicsCompressorNode prevents speaker distortion at peak amplification.
- Siren loops continuously until explicitly acknowledged or dismissed.

### 5.2 Real-Time Communication & Group State (`backend/src/socket/`)
- When a user joins a group, their socket joins room `group_<groupId>`.
- Client transmits:
  - `emergency:trigger` -> Payload: `{ groupId, senderId, senderName, coords, message }`
  - `incident:ack` -> Payload: `{ incidentId, memberId, memberName, status: "safe" | "on_my_way" | "calling_911" }`
  - `incident:resolve` -> Payload: `{ incidentId, resolvedBy }`
- Server dispatches simultaneously:
  1. WebSocket broadcast to all active clients in room.
  2. Asynchronous Web Push notification to all registered push subscriptions for group members (excluding the sender).

### 5.3 Web Push & Service Worker (`frontend/public/sw.js` & `backend/src/services/pushService.ts`)
- Generates standard VAPID public/private keypair.
- Frontend registers service worker and calls `pushManager.subscribe`.
- Service worker handles `push` event:
  - Notification options:
    - `title`: `EMERGENCY ALERT: [Sender Name]`
    - `body`: `Immediate response requested! Tap to open alarm.`
    - `tag`: `emergency-alert`
    - `urgency`: `high`
    - `requireInteraction`: `true`
    - `vibrate`: `[500, 200, 500, 200, 500]`
- Notification click focuses existing window or opens the app, instantly triggering the audio siren.

### 5.4 Railway Deployment Specification
- Multi-stage `Dockerfile`:
  - Stage 1: Build frontend via Vite (`npm run build`).
  - Stage 2: Compile TypeScript backend.
  - Stage 3: Slim Node.js Alpine runtime serving backend API, WebSocket, and static PWA assets from a single port (`PORT` dynamically assigned by Railway).
- `railway.json`: Declares build and deploy settings, restart policies, and healthcheck path (`/health`).

---

## 6. Project Directory Layout

```text
family_alert/
├── .specify/                         # Spec Kit configuration and memory
│   ├── memory/constitution.md        # Project constitution
│   └── templates/                    # Process templates
├── specs/
│   └── 001-emergency-alert-mvp/      # Active feature spec directory
│       ├── spec.md                   # Feature requirements
│       ├── plan.md                   # This implementation plan
│       ├── data-model.md             # Entities and schemas
│       ├── research.md               # DND override & Web Push deep-dive
│       ├── quickstart.md             # Local setup and Railway deployment guide
│       └── tasks.md                  # Implementation task breakdown
├── backend/
│   ├── src/
│   │   ├── controllers/              # Group, Incident, Push endpoints
│   │   ├── db/                       # Database connection and migrations
│   │   ├── services/                 # PushService, IncidentService
│   │   ├── socket/                   # Socket.IO handlers
│   │   ├── types/                    # Shared TypeScript interfaces
│   │   └── index.ts                  # Server entrypoint
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json             # PWA Web App Manifest
│   │   └── sw.js                     # Service Worker for Web Push
│   ├── src/
│   │   ├── components/               # EmergencyButton, MemberRoster, IncidentBanner
│   │   ├── hooks/                    # useSocket, useAudioAlarm, usePushNotifications
│   │   ├── services/                 # audioAlarm.ts, api.ts, pushManager.ts
│   │   ├── types/                    # Frontend models
│   │   ├── App.tsx                   # Main application router/view
│   │   ├── index.css                 # Tailwind CSS styles
│   │   └── main.tsx                  # React DOM entrypoint
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
├── Dockerfile                        # Unified Railway production container
├── railway.json                      # Railway configuration file
├── .gitignore                        # Git ignore patterns
└── README.md                         # Project documentation and setup guide
```
