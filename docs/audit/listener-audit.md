# P2-8: Firestore Listener Cleanup Audit

**Date**: 2026-05-18
**Lead**: hangel-backend-lead
**Scope**: All `onSnapshot` consumers across `src/**` — direct calls + `useDoc` / `useCollection` hook callers.

## Headline counts

| Metric | Count |
|---|---|
| Files using `useDoc` / `useCollection` | 95 |
| Total hook call sites (`useDoc<T>(...)` + `useCollection<T>(...)`) | 218 |
| Direct `onSnapshot(...)` callers outside the hook files | **0** |
| Files using the hooks WITHOUT also using `useMemoFirebase` | **0** |
| Hook call sites passing an INLINE `collection(...)` / `doc(...)` (no memo) | **0** |
| `useMemoFirebase(...)` call sites | 221 |
| Hook callers with object-ref dep (not `.uid`) — SUSPECT | **3** (all in one file) |

## Architecture summary (load-bearing facts)

- `src/firebase/firestore/use-doc.tsx:51-87` and `src/firebase/firestore/use-collection.tsx:65-110` both wrap `onSnapshot` inside `useEffect` and return `() => unsubscribe()`. Cleanup is correctly wired at the hook layer; callers cannot leak unless they re-subscribe every render via an unstable ref.
- `useCollection` has a runtime guard: line `111-113` throws if the passed ref is missing the `__memo` marker set by `useMemoFirebase` (`src/firebase/provider.tsx:157-168`). This is why **0 files** pass an inline `collection(...)` — that would crash on mount in production.
- `useDoc` has NO such runtime guard. An inline `doc(...)` arg would silently re-subscribe every render. Audit found **0** such sites in `src/` — discipline holds.

## A. Direct `onSnapshot` callers

Outside the two hook files, **zero** direct `onSnapshot` calls exist in `src/`.

```
src/firebase/firestore/use-doc.tsx:61          (inside hook, cleanup OK)
src/firebase/firestore/use-collection.tsx:77   (inside hook, cleanup OK)
```

→ **Nothing to fix in this category.**

## B. Hook callers without memoized refs

**Zero**. Every file that imports `useDoc` or `useCollection` also imports `useMemoFirebase`, and every call passes a value returned by `useMemoFirebase(...)` (verified by inverse grep: `grep -L useMemoFirebase` over the 95 files that use the hooks returned an empty set).

## C. Hook callers passing inline `collection(...)` / `doc(...)`

**Zero**. The `__memo` runtime check in `useCollection` catches this at mount time, so any past offender would have been triaged on first render. `useDoc` has no such check, but a grep for `useDoc(\s*(doc|collection)\(` across `src/` returned no matches.

## D. SUSPECT — Hook callers with object-ref deps

The single risky pattern surfaced by the audit: passing the full `authUser` (Firebase `User` object) into the dep array instead of `authUser.uid` (stable primitive). The `User` object reference can change between auth-state refreshes, causing the memoized ref to invalidate → `useEffect` cleans up + re-subscribes the snapshot listener for no functional reason.

| # | File | Lines | Pattern |
|---|---|---|---|
| 1 | `src/app/profile/page.tsx` | 200-211 (3 hooks) | `[db, authUser]` should be `[db, authUser?.uid]` |

All other 218 hook sites use either `[db]`, `[firestore]`, `[db, authUser?.uid]`, `[db, params.id]`, `[db, userData?.managedNgoId]`, etc. — primitive or null-safe optional-chained primitives.

## E. Five highest-risk files

Ranked by combination of (hooks-per-file × dep-array stability × render frequency):

1. **`src/app/profile/page.tsx`** — 3 hooks with `[db, authUser]` (object ref). Each user-object refresh re-subscribes 3 listeners (badges, certificates, pastVolunteering). Owner-page → frequent re-renders.
2. **`src/app/ngo-admin/layout.tsx`** — 4 listeners (userDoc + 3 entity-fallback queries by `adminUserId`) on every ngo-admin route. Deps are correct (`authUser?.uid`), but high listener count: a single hot route opens 4 concurrent snapshots. If any caller above forgets a memo wrap in the future, this is the multiplier.
3. **`src/app/super-admin/page.tsx`** — 4 collection listeners (users, ngos, brands, applications) on the super-admin dashboard; deps `[db]` only. Stable, but full-collection listeners are expensive — leak amplification high if any future caller bypasses memo.
4. **`src/app/admin/page.tsx`** — 4 hooks: `userDocRef` + 3 managed-entity refs keyed on `userData?.managed*Id`. Deps look correct but the user doc itself loads via `useDoc` and feeds 3 downstream memos → if the user doc returns a fresh `userData` object reference (it does, since `useDoc` rebuilds the wrapper `{...data, id}` on every snapshot), the 3 downstream queries currently key off `userData?.managedNgoId` which is a **stable string** so they're fine. Listed here for vigilance, not as a bug.
5. **`src/app/super-admin/messaging/campaigns/[id]/page.tsx`** — 1 `useDoc` + 1 `useCollection` keyed on dynamic route param `params.id`. Deps `[db, params.id]` are correct, but per-row drilldown amplifies attention — any future change must keep `params.id` extraction outside of an inline factory.

## F. ESLint rule added (see `eslint.config.mjs`)

```js
'no-restricted-syntax': ['warn', {
  selector: 'CallExpression[callee.name=/^(useDoc|useCollection)$/] > CallExpression[callee.name=/^(collection|doc)$/]',
  message: 'Pass a memoized ref (via useMemoFirebase) to useDoc/useCollection — inline collection()/doc() recreates the listener every render.',
}]
```

Selector matches `useDoc(doc(...))` / `useCollection(collection(...))` direct-pass patterns. Set to `warn` initially; `TODO(P2-8b)` upgrades to `error` once any new patches land.

Initial warning count produced by this rule: **0** (codebase already clean).

## G. Follow-up tasks spawned

See `docs/audit/tasks.md` rows `P2-8b` through `P2-8f`. Top entry: fix `profile/page.tsx` `[db, authUser]` → `[db, authUser?.uid]`.
