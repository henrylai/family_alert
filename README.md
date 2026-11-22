# 🚨 Family Alert

> **Fast, simple, reliable emergency alerts for you and your loved ones.**  
> Built with **[GitHub Spec Kit](https://github.com/github/spec-kit)** | Ready for **[Railway.app](https://railway.app)** deployment.

---

## 📖 Overview

In sudden emergencies (medical crises, accidents, domestic threats, or natural disasters), standard messaging apps (SMS, WhatsApp, Messenger) frequently fail because phones are placed on silent, mute, or Do Not Disturb (DND), and navigating menus under severe panic causes critical delays.

**Family Alert** is a dedicated, zero-friction emergency notification app designed to wake, warn, and coordinate family members instantly.

---

## ⚡ Key Features

- **🔴 1-Touch Emergency Trigger**: A prominent, unambiguous distress button with a 1.2-second press-and-hold guard to prevent accidental pocket activation.
- **👨‍👩‍👧‍👦 Configurable Groups with Invite Codes**: Create a named family group in seconds and invite loved ones using a memorable 6-character code (e.g., `FAM-4912`). No complex passwords or account setup required.
- **🔊 Penetrating Alarm Siren**: Synthesizes a continuous, dual-tone alternating emergency siren (880Hz / 660Hz) using the **Web Audio API** at maximum digital gain with dynamic compression.
- **📱 Screen Wake Lock & Tactile Pulses**: Keeps the screen awake during active alerts via the **Screen Wake Lock API** and pulses device haptics via the **Vibration API**.
- **📡 Sub-Second Real-Time Synchronization**: Powered by **Socket.IO** rooms for instant state broadcast and live acknowledgment tracking (*"I'm Safe"*, *"On My Way"*, *"Calling 911"*).
- **🔔 High-Urgency Web Push**: Dispatches push notifications via the W3C Web Push protocol (VAPID) to reach devices when screens are locked.
- **🎧 Speaker & Volume Test Mode**: A safe 5-second siren test card to verify volume and audio output without triggering a real family incident.
- **🚀 One-Click Railway Deployment**: Monorepo containerized with a production multi-stage `Dockerfile` and `railway.json`.

---

## 🛡️ Do Not Disturb (DND) & Volume Override Architecture

Mobile web browsers operate in secure sandboxes that prevent web pages from silently unmuting hardware volume toggles or circumventing OS-level Focus / DND modes while running in the background.

To maximize reach and urgency, Family Alert implements a **4-Tier Defense-in-Depth Strategy**:

```
                       [DISTRESS TRIGGERED]
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   [Tier 1]                 [Tier 2]                [Tier 3]
High-Urgency Web Push   Foreground Alarm Siren   Contact Emergency Bypass
 (Lock screen banner     (Dual-tone siren loop,     (iOS Emergency Bypass &
  & vibration pulse)     100% gain & Wake Lock)     Android Starred Contacts)
                                │
                                ▼
                            [Tier 4]
                     Native App Wrapper (Capacitor)
               - iOS Apple Critical Alerts Entitlement
               - Android NotificationChannel DND Bypass
```

### In-App DND & Emergency Bypass Setup
The app includes interactive, platform-specific guides:
- **iPhone (iOS)**: Guide family members to open *Contacts > Family Member > Edit > Ringtone > Emergency Bypass ON*. This guarantees calls and messages ring through even when Do Not Disturb or the silent switch is active.
- **Android**: Guide users to add family members to *Starred Contacts* and allow Starred Contacts in Android DND settings.

### Native Evolution Roadmap (Capacitor)
The frontend is built using standard web technologies cleanly decoupled from the backend. When upgrading to native mobile apps:
1. Wrap the Vite build using `@capacitor/core` and `@capacitor/cli`.
2. Request the iOS `com.apple.developer.usernotifications.critical-alerts` entitlement in Xcode.
3. Configure Android's `NotificationChannel.setBypassDnd(true)` and `ACCESS_NOTIFICATION_POLICY`.

---

## 📐 Built with GitHub Spec Kit (Spec-Driven Development)

This repository follows **Spec-Driven Development (SDD)** with GitHub Spec Kit:

- **`.specify/memory/constitution.md`**: Project principles, emergency reliability standards, platform realism, and governance rules.
- **`specs/001-emergency-alert-mvp/`**:
  - [`spec.md`](specs/001-emergency-alert-mvp/spec.md): Prioritized user journeys (P1-P3), functional requirements, and measurable success metrics.
  - [`plan.md`](specs/001-emergency-alert-mvp/plan.md): Technical architecture, component layout, and technology stack choices.
  - [`tasks.md`](specs/001-emergency-alert-mvp/tasks.md): Granular, ordered implementation tasks.
  - [`research.md`](specs/001-emergency-alert-mvp/research.md): Deep-dive into mobile OS audio constraints, Web Push, and DND bypass mechanics.
  - [`data-model.md`](specs/001-emergency-alert-mvp/data-model.md): Entity relationships, REST API endpoints, and WebSocket event payloads.
  - [`quickstart.md`](specs/001-emergency-alert-mvp/quickstart.md): Detailed local execution and cloud deployment instructions.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Socket.IO Client.
- **Backend**: Node.js, Express, Socket.IO, Web-Push (VAPID RFC 8292), TypeScript.
- **Audio & Hardware**: Web Audio API (oscillators, dynamic compressor, gain nodes), Screen Wake Lock API, Vibration API.
- **Deployment**: Docker, Railway.app.

---

## 🚀 Quickstart: Running Locally

### 1. Prerequisites
- Node.js 20+ LTS
- npm 10+

### 2. Clone and Install
```bash
git clone https://github.com/henrylai/family_alert.git
cd family_alert

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Run Development Servers
```bash
# Terminal 1: Backend API & WebSocket (runs on http://localhost:4000)
cd backend && npm run dev

# Terminal 2: Frontend PWA (runs on http://localhost:5173)
cd frontend && npm run dev
```

Open `http://localhost:5173` on your browser or mobile phone on your local Wi-Fi.

---

## 🚂 Deploying to Railway (railway.app)

The project is pre-configured with a root `Dockerfile` and `railway.json`.

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete family alert app scaffold with spec kit"
   git push -u origin main
   ```
2. Log in to **[railway.app](https://railway.app)** and click **"New Project"**.
3. Select **"Deploy from GitHub repo"** and select `henrylai/family_alert`.
4. Railway will automatically build the multi-stage `Dockerfile` (compiling both frontend and backend into a single efficient container).
5. In your Railway service settings under **Variables**, optionally configure:
   - `PORT`: `4000` (or leave default; Railway assigns dynamically)
   - `NODE_ENV`: `production`
   - `VAPID_PUBLIC_KEY`: `(Optional: your custom VAPID public key)`
   - `VAPID_PRIVATE_KEY`: `(Optional: your custom VAPID private key)`
   - `VAPID_SUBJECT`: `mailto:support@yourdomain.com`
6. *(Optional persistence)* Attach a Railway **Persistent Volume** mounted at `/app/data` to retain groups, members, and incidents across container redeploys.
7. Railway will generate a public domain (e.g. `https://family-alert-production.up.railway.app`) with SSL enabled automatically.

---

## 📄 License

MIT © [Henry Lai](https://github.com/henrylai)
