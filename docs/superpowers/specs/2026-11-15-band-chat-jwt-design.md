# Band Chat JWT — design

## Intent

Create a separate Russian-language group chat where only JWT-authenticated users can connect and write. Registration, login, refresh, and logout reuse the supplied REST backend; live messages use the supplied WebSocket protocol.

## Constraints

- Static HTML, CSS, and JavaScript suitable for GitHub Pages.
- REST backend: `https://inai-col3.fishrungames.com`.
- Socket: `wss://inai-col3.fishrungames.com/chat/`.
- First socket message is `AUTH` with the access token; chat input unlocks only after `AUTH_SUCCESS`.
- Logout closes the socket, clears access state, and calls the REST logout endpoint.

## Approach

Use a dependency-free client with isolated REST and WebSocket modules. The interface resembles a band rehearsal control desk: deep navy, signal amber, cool white, and compact channel-strip details, while staying simple enough to defend in class.

## Non-goals

No private rooms, message history storage, attachments, moderation, or typing indicators.
