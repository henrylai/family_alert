# Family Alert Constitution

## Core Principles

### I. Critical Emergency Reliability
Emergency alerts must be treated with life-safety-grade priority. The system must guarantee:
- Sub-second notification dispatch across all group channels upon trigger.
- Immediate acknowledgment loop (senders must see real-time delivery status: Dispatched, Received, Acknowledged "I'm Safe" / "On My Way").
- Resilient retry and offline queueing if a sender temporarily has intermittent connectivity.

### II. Radical Simplicity & Zero-Friction UX
In high-stress situations, cognitive load must be near zero:
- **1-Tap Trigger**: Primary alert action is massive, unambiguous, and immediate (with a brief cancellation guard or long-press to avoid accidental pocket triggers).
- **Invite Code Onboarding**: Joining a family group must only require entering a short alphanumeric invite code (e.g. `FAM-4892`) and a display name. No complex multi-step registration or password hurdles.
- **High-Contrast, Accessible UI**: Crisp, legible, dark/light aware interface readable under panic or low-light conditions.

### III. Platform Capability Realism & Defense-in-Depth Alerting
System architecture must balance web portability with operating system notification constraints:
- **Web App / PWA Constraints**: Standard browser sandboxes on iOS Safari and Android Chrome prevent web pages from unilaterally overriding hardware silent switches, changing system audio ringer streams, or bypassing system Do Not Disturb (DND) when running in the background.
- **Multi-Layered Alert Strategy**:
  1. *Layer 1 (Push Notification)*: Web Push API with `urgency: high`, persistent vibration patterns, and custom sound action tags.
  2. *Layer 2 (Foreground Siren & Wake Lock)*: When the app is opened or active, play a loud looped alarm using the Web Audio API at maximum gain, activate Screen Wake Lock API to prevent screen sleep, and flash high-contrast visual cues.
  3. *Layer 3 (Telephony / Emergency Contact Bypass)*: Provide guidance and optional automated telephony/SMS alerts from a designated number that users can add to iOS "Emergency Bypass" or Android "Starred Contacts" to reliably penetrate DND.
  4. *Layer 4 (Native Wrapper Evolution)*: Design the codebase with a clean API boundary so it can be packaged with Capacitor or React Native to unlock iOS Critical Alerts (`com.apple.developer.usernotifications.critical-alerts`) and Android `NotificationChannel` DND bypass (`setBypassDnd(true)`).

### IV. Railway Deployability & Cloud-Native Backend
- The backend must be containerized and configured for one-click deployment on Railway.app.
- The service must support WebSocket or Server-Sent Events (SSE) alongside RESTful endpoints for real-time bi-directional alert broadcasts.
- Ephemeral containers must maintain persistence via cloud-managed databases (e.g. Railway PostgreSQL or persistent volume SQLite).

### V. Privacy, Group Isolation, and Family Security
- Alerts and member data must be strictly isolated to authorized group members.
- Group invite codes must be revocable and regenerable by group creators.
- Sensitive location or emergency audio data must be end-to-end encrypted or transmitted securely over HTTPS/WSS and never shared outside the group.

## Architectural Standards

### Frontend
- **Format**: Progressive Web App (PWA) with manifest, service worker, and offline capabilities.
- **Framework**: Modern reactive TypeScript framework (e.g., React / Vite) with Tailwind CSS for rapid, clean styling.
- **Hardware Integration**: Web Audio API (synthesizer/siren generator), Screen Wake Lock API, Vibration API, Web Push API.

### Backend
- **Format**: Containerized Node.js (TypeScript) or Python service with Dockerfile and Railway configuration (`railway.json` / `Procfile`).
- **Communication**: REST API for resource management + WebSockets (Socket.IO / native WS) for low-latency live dispatch.
- **Push Service**: Web Push protocol (VAPID key generation and push notification payload encryption).

## Governance

- The Constitution supersedes ad-hoc implementation choices. Any architectural deviation must be ratified via an amendment to this document.
- Development follows Spec-Driven Development: Features must have an approved specification (`specs/NNN-feature/spec.md`), a technical plan (`plan.md`), and an ordered task breakdown (`tasks.md`) before implementation.

**Version**: 1.0.0 | **Ratified**: 2026-11-22 | **Last Amended**: 2026-11-22
