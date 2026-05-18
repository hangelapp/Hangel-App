# Firestore Security Rules Tests

This directory contains Vitest + `@firebase/rules-unit-testing` based tests
that exercise the rules declared in `firestore.rules` against the local
Firestore emulator.

## Running the tests

### Option A — single command (recommended)

`firebase emulators:exec` starts the emulator, runs the tests, and tears the
emulator down on exit. No need to manage two terminals:

```bash
npm run test:rules
```

Under the hood this runs:

```bash
firebase emulators:exec --only firestore "vitest run rules"
```

### Option B — emulator in a separate terminal

```bash
# Terminal 1 — start the emulator
firebase emulators:start --only firestore

# Terminal 2 — run the tests
npm run test
```

## Behavior when the emulator is NOT running

The tests detect emulator availability at module-load time via a quick HTTP
probe (`tests/rules/setup.ts → isEmulatorRunning()`).

- If the emulator is reachable, all suites run normally.
- If it is NOT reachable, every suite is skipped via `describe.skipIf(...)`.
  `npm run test` will exit successfully with all suites reported as skipped —
  this is intentional so plain `npm run test` in CI never blocks on the
  emulator.

## Configuration

`vitest.config.ts` is at the repo root. The emulator host/port can be
overridden via environment variables:

| Variable                    | Default       |
|-----------------------------|---------------|
| `FIRESTORE_EMULATOR_HOST_HOST` | `127.0.0.1` |
| `FIRESTORE_EMULATOR_PORT`     | `8080`      |

(If you set `FIRESTORE_EMULATOR_HOST` like `127.0.0.1:8080`, the port is
parsed from it as a fallback.)

## Files

| File                  | Covers                                                    |
|-----------------------|-----------------------------------------------------------|
| `setup.ts`            | RulesTestEnvironment singleton, helpers (`authedAs`, `unauthedDb`, `adminSeed`), emulator probe |
| `users.test.ts`       | `/users/{uid}` read/write, owner-only update, super-admin override |
| `ngos.test.ts`        | `/ngos/{ngoId}` public read, viewCount-only public update, admin-only writes |
| `donations.test.ts`   | `/donations/{donationId}` own-doc reads, authed list, admin-only updates |
| `campaigns.test.ts`   | `/campaigns/*`, `/messageTemplates/*`, server-only `/messageJobs/*`, `/messagingAuditLogs/*` |

## Notes

- `isSuperAdmin()` in `firestore.rules` accepts two signals: the hard-coded
  email `ismailhilmi@hangel.org` on the auth token, OR a `users/{uid}` doc
  with `role == 'super-admin'`. The tests cover both paths where applicable.
- Tests use `withSecurityRulesDisabled` (via the `adminSeed` helper) to seed
  fixture documents before each test.
