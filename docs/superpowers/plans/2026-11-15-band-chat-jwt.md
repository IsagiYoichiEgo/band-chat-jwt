# Band Chat JWT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a separate authenticated WebSocket group chat.

**Architecture:** Reuse a small REST JWT client for auth and refresh. `ChatClient` owns the socket lifecycle and protocol; `app.js` enables sending only after `AUTH_SUCCESS`.

**Tech Stack:** HTML, CSS, JavaScript ES modules, WebSocket, Node built-in test runner

**Spec:** `docs/superpowers/specs/2026-11-15-band-chat-jwt-design.md`

## Global Constraints

- Deploy from the repository root on GitHub Pages.
- Authenticate immediately after socket open with the exact `AUTH` envelope.
- Never enable chat before `AUTH_SUCCESS`.

## Review Focus

- The first socket frame is always `AUTH`.
- Blank messages are rejected client-side.
- A closed or unauthorized socket disables the composer.
- Logout closes the live socket and clears the JWT session.
- Timestamps render safely even when malformed.

### Task 1: WebSocket protocol

**Files:** Create `js/chat-client.js`; test `tests/chat-client.test.js`.

**Interfaces:** Produce `ChatClient.connect(token)`, `sendMessage(text)`, and `disconnect()`.

- [ ] Write failing protocol tests and run them.
- [ ] Implement the minimum socket state machine and rerun the suite.

### Task 2: JWT authentication

**Files:** Create `js/api.js`; test `tests/api.test.js`.

- [ ] Add tests for login, refresh, and logout.
- [ ] Implement the REST client and rerun all tests.

### Task 3: Chat UI and deployment

**Files:** Create `index.html`, `styles.css`, `js/app.js`, `README.md`, `.nojekyll`.

- [ ] Build auth and authenticated chat views.
- [ ] Verify keyboard, mobile layout, protocol, and tests.
- [ ] Commit, create a separate repository, push, enable Pages, and verify its URL.
