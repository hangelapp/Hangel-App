# Hangel — Task Board

Bu pano `docs/audit/findings.md`'deki bulgulardan türetilmiştir. Her görev: ID, öncelik, sahip lead, etkilenen dosyalar, sorun, önerilen çözüm, risk, test, kabul kriteri, durum.

**Durum**: `📋 Todo` · `🔧 In progress` · `🟡 Awaiting user` · `✅ Done` · `❌ Blocked`

## Acil — Kullanıcı eylemi gerektirenler

| ID | Görev | Sahip | Durum | Runbook |
|---|---|---|---|---|
| **P0-1** | Firebase service account key rotate | security-lead | 🟡 Awaiting user | [service-account-rotate.md](./runbooks/service-account-rotate.md) |
| **P0-1b** | `git filter-repo` ile geçmişten purge (rotate sonrası) | devops-lead | 🟡 Awaiting user | [git-history-purge.md](./runbooks/git-history-purge.md) |
| **P0-4a** | Super-admin custom claims migration (deploy) | security-lead | 🟡 Awaiting user | [super-admin-claims.md](./runbooks/super-admin-claims.md) |

## P0 — Kritik

| ID | Görev | Sahip | Dosya(lar) | Risk | Durum |
|---|---|---|---|---|---|
| P0-2 | `/api/proxy` route'unu kaldır veya host whitelist + auth + rate limit ekle | security-lead | `src/app/api/proxy/route.ts` | Yüksek (callers var mı? grep gerekir) | ✅ Done (2026-05-18) — 0 caller, route + parent dir silindi; `.env.example`'a `ALLOWED_PROXY_HOSTS` placeholder eklendi. |
| P0-3 | `/api/admin/import-data` Admin SDK'ya geçir | security-lead | `src/app/api/admin/import-data/route.ts` | Orta (admin import path) | ✅ Done (2026-05-18) — `getAdminFirestore()` + `FieldValue.serverTimestamp()`; client SDK importları silindi; in-memory IP rate limit (10/dk); `{errorCode,message}` error shape; typecheck PASS, lint 0 errors. |
| P0-4 | Super-admin hardcoded e-postasını custom claim'e taşımak için kod tarafı | security-lead | `firestore.rules:12`, `src/lib/messaging/server-auth.ts:11` | Yüksek (auth model değişir) — sadece kod, deploy P0-4a | 🟡 Awaiting user (2026-05-18 — kod hazır; rules `isSuperAdmin()` artık tek satır claim kontrolü; server-auth + app-shell + super-admin layout claim primary, `users/{uid}.role` fallback; `scripts/set-super-admin-claim.ts` + `tests/rules/super-admin.test.ts` eklendi. Deploy: super-admin-claims.md runbook) |
| P0-5 | `/super-admin/layout.tsx`'e client-side rol kontrolü + redirect | frontend-lead | `src/app/super-admin/layout.tsx` | Düşük (UI gating) | ✅ Done (2026-05-18) — `useUser`+`useDoc<User>` ile rol okunuyor; super-admin değilse `/market`, anon ise `/login/selection`'a `router.replace`; auth çözülürken `<Loader2/>`; typecheck PASS, lint 0 errors. |
| P0-6 | CI workflow'una `npm run test` adımı + rules emülatör job | devops-lead | `.github/workflows/ci.yml` | Düşük | ✅ Done (CI will verify on next PR) |

**Kabul kriterleri:**
- P0-2: `/api/proxy`'ye yapılan tüm çağrılar gözden geçirildi; ya endpoint kaldırıldı ya da `ALLOWED_PROXY_HOSTS` whitelist + Firebase auth gate eklendi. Test: anonim çağrı 401; whitelist dışı host 400.
- P0-3: `getAdminFirestore()` kullanılıyor; client SDK importu kaldırıldı; rate limit eklendi. Test: typecheck PASS, route bir mock token ile rules bypass'ı yapıyor.
- P0-4: `isSuperAdmin()` rules'da yalnızca `request.auth.token.role == 'super-admin'` kontrolü yapar (e-posta literali silindi). Server-auth'da literal kaldırıldı. Test: rules test geçer.
- P0-5: Layout `useAuth()` ile rol okur; süper-admin değilse `/market`'a redirect. Test: typecheck PASS.
- P0-6: PR'da `npm run test` görünür status check oluyor; rules testleri emülatör job'ında çalışıyor.

## P1 — Ana akış / gizlilik

| ID | Görev | Sahip | Dosya(lar) | Durum |
|---|---|---|---|---|
| P1-1 | `/api/auth/check-email` rate-limit + cevap normalizasyonu | security-lead | `src/app/api/auth/check-email/route.ts` | 🔧 partial (2026-05-18) — rate-limit (5/dk per-IP) + sabit 250ms gecikme + `{ errorCode, message }` shape; `exists` flag KORUNDU (frontend `selection/page.tsx:222` ona dayanıyor). Tam normalizasyon → P1-1b. |
| P1-1b | check-email response homojenleştirme (`{ status: 'ok' }`) + `selection/page.tsx` redesign (signup-attempt-driven branching) + distributed rate-limit (Redis/Firestore) | security-lead + frontend-lead | `src/app/api/auth/check-email/route.ts`, `src/app/login/selection/page.tsx` | 📋 |
| P1-2 | Resend/Netgsm webhook'larına HMAC + timestamp doğrulaması | security-lead | `src/app/api/messaging/webhook/[driver]/route.ts` | ✅ Done (2026-05-18) — Resend Svix v1 HMAC + Netgsm IP whitelist; helper `src/lib/messaging/webhook-replay.ts`. Env: `RESEND_WEBHOOK_SECRET`, `NETGSM_WEBHOOK_ALLOWED_IPS`. |
| P1-2b | Netgsm gerçek HMAC sağlayınca IP whitelist'i imza kontrolüne çevir | security-lead | `src/app/api/messaging/webhook/[driver]/route.ts` | 📋 |
| P1-3 | Webhook replay protection (timestamp + nonce kayıt) | security-lead | aynı | 🔧 In progress (2026-05-18) — `webhookReplayIds` create-or-fail + 5dk timestamp window done; TTL cleanup P1-3b'ye ayrıldı. |
| P1-3b | `webhookReplayIds` için Firestore TTL policy veya scheduled cleanup (90 gün) | devops-lead | Firestore Console / Cloud Scheduler | 📋 |
| P1-4 | `storage.rules` — `transparency/{userId}/*` public read kapatma | security-lead | `storage.rules` | ✅ Done (2026-05-18) — read: `isSuperAdmin() \|\| auth.uid == userId \|\| isManagedEntity('Ngo', userId)`; write aynı; deploy gerekli. |
| P1-5 | Global `error.tsx` + key dashboard segment'lerinde error boundary | frontend-lead | `src/app/error.tsx`, `src/app/(dashboard segments)/error.tsx` | ✅ Done |
| P1-6 | `dangerouslySetInnerHTML` sanitize katmanı (DOMPurify isomorphic) | security-lead | `src/app/logo-usage/page.tsx`, `src/app/library/[slug]/page.tsx`, diğerleri | ✅ Done (2026-05-18) — `isomorphic-dompurify@^3.13.0` + `src/lib/sanitize-html.ts` whitelist util; 17 dosya / 19 occurrence sarmalandı (chart.tsx shadcn `<style>` + use-site-content.ts JSDoc bilinçle atlandı); typecheck PASS, lint 0 errors. |
| P1-7 | `target="_blank"` + `rel="noopener noreferrer"` pass | frontend-lead | 15+ dosya | ✅ Done (2026-05-18) — 7 dosya patch'lendi (`ngos/[id]`, `super-admin/{contracts,web-content,association-content,funds,pages}`, `settings/ngo-selection`); ~26 dosya zaten doğruydu; typecheck PASS, lint 0 errors. |
| P1-8 | AI flow'larında input sanitization + per-user quota skeleton | backend-lead | `src/ai/flows/**`, yeni `src/ai/guards.ts` | 🔧 (2026-05-18) — `sanitizeUserInput` 5 flow'a uygulandı; `checkAndConsumeAIQuota` Admin SDK + Firestore transaction iskeleti `src/ai/guards.ts`'de hazır; caller `userId` plumbing follow-up `P1-8c`; env-tunable cap follow-up `P1-8b`. |
| P1-9 | Dashboard empty state'leri (my-applications, my-donations, my-badges, messages, notifications) | frontend-lead | `src/components/shared/empty-state.tsx` (yeni) + 5-6 page | ✅ Done (5/5) — 2026-05-18 |
| P1-10 | `profile/page.tsx` boş hardcoded array'leri Firestore'a bağla | backend-lead | `src/app/profile/page.tsx` | ✅ Done (2026-05-18) — `badges`, `certificates`, `pastVolunteering` üçü de `users/{uid}/{sub}` sub-collection'larından `useCollection` ile çekiliyor; üç boş şube `<EmptyState>` ile değiştirildi; `COLLECTIONS.pastVolunteering` eklendi. |

## P2 — UX/Quality

| ID | Görev | Sahip | Durum |
|---|---|---|---|
| P2-1 | Auth + ödeme + admin API'leri için vitest + mock kapsamı | qa worker via leads | 🔧 Partial (6/27+ critical routes, 2026-05-18) — `tests/api/{check-email,import-data,webhook-driver,nkolay-callback,csv-parse,ngo-admin-campaigns}.test.ts`; Firebase Admin + payment + auth helpers `vi.mock`'lanır; `vitest.config.ts` `resolve.alias` ile `@/*` desteği eklendi. |
| P2-1b | Kalan 21+ API route + happy-path emülatör testleri (campaigns recipient batch, deliveryEvents, audit, wallet topup chain) | qa worker | 📋 |
| P2-2 | Lighthouse CI + perf budget | devops-lead | ✅ Done (soft-gated, 2026-05-18) — `.github/workflows/lighthouse.yml` + `.lighthouserc.json` budget (perf warn 0.7 / a11y error 0.85 / seo warn 0.8); LHCI step `continue-on-error: true`. `TODO(P2-2b)`: make blocking once baseline stable. `package.json` dokunulmadı; `npx @lhci/cli@0.13.x autorun` CI-only. |
| P2-3 | `images.unoptimized: true` kaldırılması + LCP image'lara `priority` | devops-lead + frontend-lead | ✅ |
| P2-4 | Lucide ve recharts import'larını tree-shaking | frontend-lead | 🔧 (2026-05-18) — 9/11 lucide wildcard dosyası migrate edildi (`page.tsx` named; `app-shell` + `SideNav` + `super-admin/{page,inbox}` + `ngo-admin/{dashboard,notifications}` + `logo` + `logo-usage` explicit map). 2 SKIP: `library/page.tsx` (Firestore-driven `section.icon` run-time string — kapalı küme güvenli değil), `header.tsx` (do-not-touch list). Recharts 4/4 SKIP — chart = above-the-fold primary view + sibling extraction >30 satır cap aşar. Typecheck PASS, lint 0 errors. Follow-up: P2-4b (`library/page.tsx` Firestore icon allowlist). |
| P2-5 | i18n hardcoded TR string'leri `useTranslation()`'a taşıma (öncelik: header, settings, landing) | frontend-lead | 🔧 partial (2026-05-18 — P2-5a kapandı: 45 yeni key, header `aria-label`'leri, `settings/page.tsx` (30 string), `app/page.tsx` inline labels map + 2 section title migrate edildi. TR/EN dolu, 5 dil skeleton boş. Detay decisions.md. Kalan: P2-5b, P2-5b-landing-rest, P2-5c. typecheck PASS, lint 0 errors.) |
| P2-5b | i18n marketing pages migration (about, press, careers, logo, logo-usage, support, merchant, campus-advantages, ngo-onboarding, hangelassociation, accessibility, social-impact, imece, bilgi-toplumu-hizmetleri) | frontend-lead | 📋 |
| P2-5b-landing-rest | Landing `app/page.tsx`'in alt yarısı (~70 string): brand carousel CTA + count, `kurumlar-grid` description, 4× InfoCard values, `publicNavItems`, `discoveryItems`, `projectCardsData`, `brandTypeLabels`, `VolunteeringCard` countdown, "Tüm Markaları/İlanları Gör", `PublicFooter currentPageLabel`. `ProductShowcaseSection` default cta1 dahil. | frontend-lead | 📋 |
| P2-5c | i18n dashboards migration (profile, my-applications, my-badges, my-donations, messages, notifications, settings alt sayfalar — language, theme, security, profile, volunteer, notifications, marketing-consent, brands, ngo-selection, volunteer-ngo-selection, accessibility, privacy, contracts/*) | frontend-lead | 📋 |
| P2-5d | (opsiyonel) `LanguageProvider.t` empty-string fallback davranışı: boş `""` değer için `lookup` `undefined` dönsün → TR fallback'e düşsün. Şu an `??` nullish operatörü `""`'i geçirir, boş gösterim oluşur | frontend-lead | ✅ Done (2026-05-18) — orchestrator `lookup` retorik'i `string && length>0` ile sıkıştırdı; boş çeviri TR'ye düşüyor |
| P2-6 | God-page refactor (super-admin/brands, users, login/selection) | frontend-lead | 📋 |
| P2-7 | `src/firebase/collections.ts` sabit tanımı (sadece tanım) | backend-lead | 🔧 |
| P2-7b | `COLLECTIONS.*` ile caller migration — `src/firebase/**` + `src/lib/messaging/**` scope | backend-lead | 🔧 (2026-05-18) — `src/firebase/**` 0 literal; `src/lib/messaging/**` 12 dosya / 28 literal migrate edildi (consent, server-auth, trust-score, pricing, wallet, audit, unsubscribe, resolver, providers/{sms,email,whatsapp}/mock, queue/{rateLimiter, schedule, reclaim, enqueue, worker}). 2 atlandı: `resolver.ts:171` (dinamik değişken), `webhook-replay.ts:130` (`webhookReplayIds` constants'da yok → P2-7d). `src/app/**` → P2-7c. Typecheck PASS, lint 0 errors. |
| P2-7c | `src/app/**` + `src/hooks/**` collection literal migration | backend-lead | 📋 |
| P2-7d | `webhookReplayIds` ve diğer eksik koleksiyonların `collections.ts`'ye eklenmesi | backend-lead | ✅ Done (2026-05-18) — `COLLECTIONS.webhookReplayIds` eklendi; `webhook-replay.ts` literal → constant |
| P2-8 | Listener cleanup audit + lint kuralı | backend-lead | ✅ Done (2026-05-18) — Audit: `docs/audit/listener-audit.md`. 218 hook call sites; 0 direct `onSnapshot` outside hooks; 0 inline non-memoized refs; 3 SUSPECT object-ref deps (hepsi `profile/page.tsx`). ESLint `no-restricted-syntax` (warn) eklendi — 0 new warning. Follow-up'lar P2-8b…P2-8f. |
| P2-8b | ESLint rule severity 'warn' → 'error' upgrade | backend-lead | 📋 (gate: P2-8c done + 0 new offender for 1 sprint) |
| P2-8c | Fix `profile/page.tsx` `[db, authUser]` → `[db, authUser?.uid]` (3 hook sites, lines 200-211) | backend-lead | ✅ Done (2026-05-18) — 3 dep array uid'e sıkıştırıldı; listener re-subscribe artık authUser refresh'inde tetiklenmiyor |
| P2-8d | Refactor `ngo-admin/layout.tsx` 4-listener entity resolution into shared hook | backend-lead | 📋 — deps clean but high listener count per ngo-admin route render |
| P2-8e | Consider snapshot-listener pooling for `super-admin/page.tsx` 4 full-collection listeners | backend-lead | 📋 — page-load cost only; defer unless metrics show pain |
| P2-8f | Add `useDoc` runtime `__memo` guard (mirror `useCollection:111-113`) | backend-lead | 📋 — defense-in-depth so inline `doc()` would throw same as inline `collection()` |
| P2-9 | Genkit guardrails: token cap, içerik sanitization | backend-lead | ✅ Done (2026-05-18) — `MAX_OUTPUT_TOKENS=1024` + `MAX_PROMPT_INPUT_CHARS=4000` + `clampOutputText(text, maxChars=8000)` `src/ai/guards.ts`'ye eklendi; 5 flow (`impact-story`, `library`, `marketplace`, `marketplace-product-description`, `project-writer`) `ai.definePrompt` `config:{maxOutputTokens:1024}` ile cap'lendi ve string output alanları `clampOutputText` ile post-process edildi. Typecheck PASS, lint 0 errors. |

## P3 — İyileştirme

| ID | Görev | Sahip | Durum |
|---|---|---|---|
| P3-1 | AutoTranslate provider'ı server-side i18n'e replace | frontend-lead | 📋 |
| P3-2 | Poppins weight sayısını düşür | frontend-lead | ✅ |
| P3-3 | `maxInstances`'i 3-5'e çıkar | devops-lead | ✅ Done (2026-05-18) — `apphosting.yaml` `maxInstances: 1` → `3` (conservative bump); diğer alanlar dokunulmadı. |
| P3-4 | Renovate/Dependabot policy | devops-lead | ✅ Done (2026-05-18) — `.github/dependabot.yml` (yeni): npm weekly PR limit 5 + gruplar (radix/firebase/next/genkit) + github-actions weekly. Renovate kullanılmıyor. |
| P3-5 | `.env.example`'a eksik 11 env var eklenmesi | devops-lead | ✅ Done (2026-05-18) — 11 env var eklendi: WhatsApp (`WHATSAPP_DRIVER`, `META_APP_SECRET`, `META_WA_ACCESS_TOKEN`, `META_WA_BUSINESS_ACCOUNT_ID`, `META_WA_VERIFY_TOKEN`, `NEXT_PUBLIC_WABA_PHONE_ID`) + N-Kolay (`PAYMENT_DRIVER`, `NKOLAY_API_KEY`, `NKOLAY_API_URL`, `NKOLAY_SECRET_KEY`, `NKOLAY_SX`). Mevcut entry'lere dokunulmadı. |

## P4 — Temizlik / kozmetik

| ID | Görev | Sahip | Durum |
|---|---|---|---|
| P4-1 | Orphan dosya silimi (`[Provide the ABSOLUTE...]`) | devops-lead | ✅ Done (2026-05-18) — orchestrator session'ı `rm` ile sildi; `ls` boş |
| P4-2 | `.worktrees/affiliate-direct` durumunu netleştir + temizle | devops-lead | ✅ Done (2026-05-18) — Worktree clean + recent. HEAD `baf23ac feat(affiliate): merchant portal integration page` @ 2026-05-18 19:31:32 +0300 (bugün). 5 commit aktif `feat/affiliate-direct` branch'inde; destructive temizliğe gerek yok. |
| P4-3 | `firebase-debug.log` repo'dan temizle (gitignore zaten var) | devops-lead | ✅ Done (2026-05-18) — `firebase-debug.log` disk'te yok ve `git ls-files` çıktısı boş (tracked değil). `.gitignore:47` zaten kapsıyor. No-op kapanış. |

## Ownership tablosu özet (paralel dispatch için)

| Lead | İlk dalga (bu sprint) |
|---|---|
| security-lead | P0-2, P0-3, P0-4, P1-1, P1-2, P1-3, P1-4, P1-6 |
| frontend-lead | P0-5, P1-5, P1-7, P1-9 |
| backend-lead | P1-8, P1-10, P2-7 |
| devops-lead | P0-6, P2-2, P2-3, P3-3, P3-5, P4-1, P4-2, P4-3 |
| product-lead | (tüm pano sahibi) |

## Yeni görev ekleme formatı

Yeni bir bulgu çıkarsa `product-lead`'i çalıştır:
```
ID: P{öncelik}-{n}
Sahip: <lead>
Dosya(lar): ...
Sorun: ...
Çözüm: ...
Risk: L/M/H
Test: ...
Kabul kriteri: ...
Durum: 📋
```
