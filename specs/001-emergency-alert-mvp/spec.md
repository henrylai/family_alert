# Feature Specification: Family Emergency Alert MVP

**Feature Branch**: `001-emergency-alert-mvp`  
**Created**: 2026-11-22  
**Status**: Ready for Planning  
**Input**: "Family emergency alert app for user and loved ones. Simple and easy to use, configurable groups using invite codes, maximum DND and volume override capabilities on web MVP with native evolution roadmap, deployed to Railway.app."

---

## 1. Executive Summary & Problem Definition

In sudden emergencies (medical crises, accidents, domestic threats, natural disasters), traditional messaging apps (SMS, WhatsApp, Messenger) frequently fail to alert loved ones because:
1. Phones are placed on silent, mute, or Do Not Disturb (DND) modes.
2. Senders face friction navigating menus, selecting recipients, or typing messages under severe panic.
3. Group members don't know who has seen the alert or who is responding.

This project delivers a dedicated, lightweight **Family Alert App**. The MVP focuses on a web-first Progressive Web App (PWA) with a containerized backend deployable to Railway.app, maximizing audio penetration and push delivery while providing an explicit bridge to native mobile capabilities.

---

## 2. Multi-Tier Alert & DND Override Strategy

Because mobile web browsers enforce strict security sandboxes (preventing arbitrary web pages from directly unmuting hardware volume sliders or circumventing OS-level Focus / Do Not Disturb filters without native OS permissions), the app implements a **4-Tier Defense-in-Depth Strategy**:

| Tier | Channel / Mechanism | OS DND / Silent Behavior | Implementation in Web MVP |
|---|---|---|---|
| **Tier 1: High-Priority Web Push** | W3C Push API with `urgency: high` | Vibrates and displays alert banner. On iOS/Android respects Focus unless configured. | Supported via Service Worker + Web Push (VAPID). |
| **Tier 2: Foreground Alarm Siren & Wake Lock** | Web Audio API synthesizer + Screen Wake Lock | Plays continuous high-decibel siren at max digital gain; keeps screen on with high-contrast flashing beacon. | Primary alarm mode when recipient opens notification or has app open. |
| **Tier 3: Contact Emergency Bypass** | Telephony / SMS or Dedicated Number | **Guaranteed DND Bypass on iOS & Android** if user adds family number / alert service to "Emergency Bypass" (iOS) or "Starred Contacts" (Android). | Guided onboarding instructing family members how to set up emergency bypass, plus optional webhook/SMS escalation. |
| **Tier 4: Native Critical Alert (Roadmap)** | Native iOS / Android wrapper (Capacitor) | **Direct Hardware DND Bypass & Ringer Override** (`com.apple.developer.usernotifications.critical-alerts` on iOS; `NotificationChannel.setBypassDnd(true)` on Android). | API and frontend architecture are built Capacitor-ready for zero-rewrite packaging. |

---

## 3. User Scenarios & Prioritized Journeys

### User Story 1 - Group Creation & Invite Code Onboarding (Priority: P1)
As a family coordinator, I want to create a named family group (e.g., "Lai Family") and receive a short, memorable invite code (e.g. `FAM-9241`) so that my loved ones can join in seconds without signing up for complex accounts or remembering passwords.

- **Why this priority**: Without seamless onboarding, non-technical family members (elderly parents, children) will abandon the app before an emergency occurs.
- **Independent Test**: Group creator clicks "Create Group" -> enters name -> receives 6-character code. Second user visits site -> enters code and display name -> immediately appears in member roster.
- **Acceptance Scenarios**:
  1. **Given** an unauthenticated visitor, **When** they click "Create Family Group" and provide a group name and their own name, **Then** a new group is created, a unique alphanumeric invite code is issued, and the user is stored as Admin.
  2. **Given** a visitor with an invite code, **When** they submit the code and their nickname, **Then** they join the group, their session is saved in local storage, and the real-time member list updates.
  3. **Given** an invalid or expired code, **When** a user submits it, **Then** an explicit error is displayed explaining the code was not found.

---

### User Story 2 - Instant 1-Touch Emergency Alert Broadcast (Priority: P1)
As a person in distress, I want to press a single prominent Emergency Alert button so that all members of my family group are alerted immediately without needing to type or select recipients.

- **Why this priority**: In a real emergency, physical coordination and time are extremely limited. Every second counts.
- **Independent Test**: User holds "TRIGGER EMERGENCY" for 1.5 seconds (or presses and confirms). Alert broadcasts to backend via WebSocket/REST, and all connected clients immediately transition into emergency state within <500ms.
- **Acceptance Scenarios**:
  1. **Given** a user in a group, **When** they activate the emergency alert, **Then** the backend dispatches an emergency payload with timestamp, sender name, and optional location coordinates to all group members.
  2. **Given** an active alert, **When** the sender views the screen, **Then** the screen displays "ALERT ACTIVE", showing an elapsed timer, a "Cancel Alert" button, and live delivery status.

---

### User Story 3 - Loud Looping Siren, Flashing UI & Screen Wake Lock (Priority: P1)
As an alert recipient, when an emergency alert is triggered, I want my device to play a continuous loud siren and flash visual indicators until I acknowledge it, so that I cannot miss the notification even if my phone is across the room.

- **Why this priority**: Standard discreet notification chimes are easily ignored. An emergency requires unmistakable sensory urgency.
- **Independent Test**: Trigger alert on sender device. On recipient device with web app open or opened via notification, siren loops at full digital volume, screen flashes red/white, and screen does not sleep.
- **Acceptance Scenarios**:
  1. **Given** a recipient has the web app open or tapped open from notification, **When** an incoming emergency alert arrives, **Then** the browser invokes Web Audio API to produce an alternating dual-tone siren at maximum gain, triggers `navigator.vibrate([500, 250, 500])`, and requests a Screen Wake Lock.
  2. **Given** an active siren, **When** the recipient taps "Acknowledge" or "Mute Alarm", **Then** the siren stops immediately while keeping the incident dashboard visible.

---

### User Story 4 - Live Acknowledgment & Status Feedback (Priority: P2)
As a sender or family member during an emergency, I want to see which family members have acknowledged the alert and what action they are taking (e.g. "I'm Safe", "On My Way", "Calling 911") so we can coordinate response efforts.

- **Why this priority**: Eliminates panic over whether anyone saw the distress signal.
- **Independent Test**: Recipient selects "On My Way (ETA 10m)". Senders and other members see the recipient's status badge update live via WebSocket.
- **Acceptance Scenarios**:
  1. **Given** an active emergency, **When** a recipient taps an acknowledgment action ("On My Way", "I'm Safe", "Calling Help"), **Then** their choice and timestamp are broadcasted to all group members in real time.
  2. **Given** an active emergency, **When** the sender or admin taps "Resolve / All Clear", **Then** the emergency state closes and is archived to incident history.

---

### User Story 5 - Web Push Notification & DND Guidance (Priority: P2)
As a user whose phone screen may be locked, I want to receive high-priority Web Push notifications and clear step-by-step guidance on setting up iOS/Android Emergency Bypass, so alerts can reach me even in Do Not Disturb.

- **Independent Test**: User enables push notifications in settings. Service worker registers push subscription to backend. Triggering an alert pushes a high-urgency payload to the device.
- **Acceptance Scenarios**:
  1. **Given** a supported browser, **When** the user clicks "Enable Emergency Push", **Then** the browser prompts for notification permissions and registers the push subscription with the backend.
  2. **Given** iOS or Android users, **When** they view the "DND Setup Guide", **Then** the app provides clear platform-specific instructions on how to add family contacts to Emergency Bypass / Starred Contacts.

---

### User Story 6 - Siren & Audio Volume Test Mode (Priority: P3)
As a user setting up the app, I want to run a 5-second "Sound Test" so I can verify my device speaker volume, audio permissions, and vibration without triggering a real family emergency.

- **Independent Test**: User clicks "Test Siren (5s)". Device plays the emergency siren for 5 seconds and confirms audio capability.

---

## 4. Edge Cases & Resilience Requirements

1. **Intermittent Connectivity**: If an alert trigger fails due to temporary connection loss, the frontend must retry automatically with exponential backoff (1s, 2s, 4s) and notify the user with visual indicators ("Connecting...").
2. **Audio Autoplay Sandbox Restriction**: Modern browsers block unprompted audio playback until the user interacts with the page. The app must prompt for an initial "Sound Activation" tap on first load or upon tapping the push notification so the Web Audio context is primed and unlocked.
3. **Multiple Alerts / Concurrency**: If two members trigger alerts simultaneously, the backend merges them into an active group incident with multiple active distress signals rather than overwriting.
4. **App Killed / Closed State**: In pure web mode, push notifications wake the service worker to display the notification banner. When the user taps the notification, the app opens full screen with the alarm siren immediately firing.

---

## 5. Functional Requirements (FRs)

- **FR-001**: System MUST allow any user to create a family group with a human-readable title and auto-generate a unique 6-character alphanumeric invite code.
- **FR-002**: System MUST allow users to join an existing group by providing an invite code and a display name.
- **FR-003**: System MUST persist group membership and session tokens in client storage so returning users do not need to re-enter codes.
- **FR-004**: System MUST support emergency alert broadcast to all members of a group within 500ms of trigger.
- **FR-005**: System MUST provide a prominent, dedicated emergency trigger UI with safety protection (e.g. 1.5s press-and-hold or instant button with 5s cancel window) to prevent accidental pocket activation.
- **FR-006**: System MUST utilize WebSockets for real-time bi-directional state synchronization (alerts, acknowledgments, incident resolution).
- **FR-007**: System MUST implement Web Push API with VAPID authentication to deliver push notifications when devices are locked or app is closed.
- **FR-008**: System MUST implement a continuous dual-tone audio siren using the Web Audio API with configurable volume and immediate mute control.
- **FR-009**: System MUST request the Screen Wake Lock API during an active emergency to keep the screen powered on.
- **FR-010**: System MUST support member acknowledgments ("I'm Safe", "On My Way", "Calling 911") updated in real-time.
- **FR-011**: System MUST provide an "Emergency Test" mode allowing users to safely test speaker output and notification delivery.
- **FR-012**: System MUST allow the alert initiator or group admin to mark an emergency as "Resolved / All Clear".
- **FR-013**: System MUST provide in-app configuration guides for iOS Emergency Bypass and Android Starred Contacts.
- **FR-014**: System MUST be containerized with a production Dockerfile and Railway configuration ready for deployment to railway.app.
- **FR-015**: Backend MUST expose health check endpoints (`/health`) and structured logging for Railway monitoring.
- **FR-016**: Architecture MUST decouple API endpoints and client logic to allow future packaging via Capacitor into native iOS/Android binaries without backend refactoring.

---

## 6. Key Data Entities

- **FamilyGroup**: `id`, `name`, `inviteCode`, `createdAt`, `updatedAt`, `adminId`.
- **GroupMember**: `id`, `groupId`, `displayName`, `role` (admin | member), `deviceType`, `pushSubscription`, `joinedAt`, `lastSeenAt`.
- **EmergencyIncident**: `id`, `groupId`, `senderId`, `senderName`, `status` (active | resolved | cancelled), `startedAt`, `resolvedAt`, `resolvedBy`, `notes`.
- **IncidentAcknowledgment**: `id`, `incidentId`, `memberId`, `memberName`, `status` (acknowledged | on_my_way | safe | contacting_services), `timestamp`, `message`.

---

## 7. Success Criteria

- **SC-001**: Group onboarding (from initial visit to joining with invite code) takes under 30 seconds for non-technical users.
- **SC-002**: Alert latency from trigger tap to WebSocket broadcast arrival across connected group devices is < 500 milliseconds on broadband/LTE.
- **SC-003**: 100% of tested mobile browsers (Safari on iOS 16.4+, Chrome on Android) successfully register push notifications and play alarm siren when opened.
- **SC-004**: Zero accidental triggers observed due to press-and-hold safety guard.
- **SC-005**: 1-click or automated deployment to Railway passes health checks with zero manual server configuration.
