# Research & Feasibility: DND Override & Volume Control on Mobile Web

## 1. Operating System Capabilities & Browser Sandboxing

### 1.1 iOS (Safari / PWA)
- **Do Not Disturb (Focus Modes)**:
  - iOS Web Push was introduced in iOS 16.4 for PWAs added to the Home Screen.
  - Apple strictly gates the `interruption-level: critical` entitlement (`com.apple.developer.usernotifications.critical-alerts`). This entitlement can **only** be granted to native iOS apps with an approved Apple developer exemption (e.g. medical, emergency, or home security hardware apps).
  - PWA Web Push notifications on iOS honor the user's active Focus / Do Not Disturb filters.
- **Hardware Silent Switch / Ringer Control**:
  - The physical mute toggle / action button silences the system ringer stream.
  - Web Audio API (inside an active webpage) runs on the ambient audio session by default. However, when configured with `AudioContext`, it can play through device media speakers if the page is active and the user has interacted with the document.
- **Reliable Workaround (Contact Emergency Bypass)**:
  - iOS allows users to enable **Emergency Bypass** on a per-contact basis:
    - *Settings > Contacts > [Family Member / Alert Service] > Edit > Ringtone > Emergency Bypass = ON*.
    - When enabled, phone calls and text messages from this contact sound and vibrate even when Do Not Disturb is enabled or the silent switch is on.
    - The Family Alert app can provide an automated SMS/voice escalation fallback or contact card download (`.vcf`) to leverage this native bypass.

---

### 1.2 Android (Chrome / PWA)
- **Do Not Disturb (DND)**:
  - Android browsers allow Web Push notifications without requiring the app to be installed to the home screen.
  - Web Push notifications can declare `urgency: high`.
  - Bypassing Android system DND requires the native permission `android.permission.ACCESS_NOTIFICATION_POLICY`, which web pages cannot request.
  - However, users can configure **Starred Contacts** or allow notifications from specific apps in Android DND settings.
- **Hardware Volume & Stream Control**:
  - Web pages cannot alter system stream volumes (`AudioManager.setStreamVolume`) due to browser sandbox restrictions.
  - However, Web Audio API output played in the foreground uses the media audio stream at maximum gain.

---

### 1.3 Defense-in-Depth Architecture for Web MVP

To provide the highest possible alert efficacy within the web platform:

```
[Distress Triggered]
         │
         ├──> 1. Web Push (Urgency: High, Vibration tag, Persistent)
         │       └─> Delivered to device lock screen / banner
         │
         ├──> 2. Web Audio Alarm (Foreground Siren)
         │       └─> When opened/tapped: Dual-tone continuous siren at 100% gain + WakeLock
         │
         ├──> 3. Native Contact Emergency Bypass Guidance
         │       └─> In-app setup guide & downloadable vCard with Emergency Bypass
         │
         └──> 4. Native App Packaging (Roadmap via Capacitor)
                 └─> Direct access to Critical Alerts (iOS) and DND Policy (Android)
```

---

### 1.4 Native Packaging Roadmap (Capacitor)

When graduating from Web MVP to Native iOS/Android apps:
1. **Zero Frontend Rewrite**: The Vite + React frontend can be wrapped directly with `@capacitor/core` and `@capacitor/cli`.
2. **iOS Critical Alerts**: In Xcode, add the `Push Notifications` and `Critical Alerts` capabilities with Apple entitlement.
3. **Android DND Override**: In Android Studio, request `ACCESS_NOTIFICATION_POLICY` and create a `NotificationChannel` with `setBypassDnd(true)` and `AUDIO_ATTRIBUTES_USAGE_ALARM`.
