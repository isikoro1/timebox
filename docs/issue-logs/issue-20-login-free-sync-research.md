# Issue #20: Login-free cross-device sync research

## Goal

Compare low-risk ways to move or sync schedule data between PC and mobile without adding login, Google auth, Firebase, Supabase, or server-side storage of private schedule data.

## Options

| Option | Difficulty | UX | Security risk | Operations risk | Fit |
| --- | --- | --- | --- | --- | --- |
| Manual JSON export/import with mobile-focused UI | Low | Explicit but a little manual | Low; user controls the file | Low | Best first step |
| Web Share API export | Low to medium | Good on supported mobile browsers | Low; OS share sheet is user-driven | Medium; limited browser support | Good enhancement after manual JSON |
| QR code transfer for small encrypted payloads | Medium | Fast for PC to mobile | Medium; must handle size limits and shoulder-surfing | Low | Useful for one-way transfer of small datasets |
| Local network one-time transfer | Medium to high | Good when devices share Wi-Fi | Medium; needs pairing token and short-lived session | Medium; local networking varies | Later prototype |
| WebRTC data channel with QR pairing | High | Good after pairing | Medium; signaling, pairing, and lifecycle must be understood | Medium to high | Too large for first sync feature |
| User-managed encrypted backup file in cloud storage | Medium | Familiar workflow | Medium; encryption and recovery UX matter | Low; app avoids account storage | Good backup direction |
| PWA with local storage and explicit transfer only | Low | Clear offline-first behavior | Low | Low | Recommended baseline |

## Recommended minimum

Keep the app offline-first and implement explicit transfer improvements before any real sync:

1. Keep JSON export/import as the canonical backup path.
2. Add a mobile-friendly import/export flow with clear success/error states.
3. Add Web Share API export where `navigator.share` and file sharing are available, with JSON download as fallback.
4. Consider QR transfer only after adding payload compression and optional passphrase encryption.

## Before implementation

- Define whether transfer replaces all events or merges by `id`.
- Decide how conflicts are shown if both devices changed the same event.
- Keep imported JSON validation strict and reject malformed date/time fields.
- Do not persist private schedule data on a server unless authentication, authorization, retention, and deletion behavior are understood and tested.

## References

- [MDN: Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) is not Baseline and requires secure contexts in supporting browsers.
- [MDN: File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) requires secure contexts and browser support varies.
- [MDN: BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) is same-origin and useful for tabs, not cross-device sync.
- [MDN: WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels) can exchange arbitrary data peer-to-peer, but require connection setup and signaling.

## Verification

- Research issue only; no runtime verification required.
