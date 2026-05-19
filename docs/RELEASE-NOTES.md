# Hangel — Release Notes (2026-05-18 Audit Sprint)

Bu doküman 2026-05-18 tarihinde gerçekleştirilen kapsamlı güvenlik + UX + altyapı audit'inin teslim edilen değişikliklerinin özetidir.

## TL;DR

- **15+ commit** main branch'e pushed
- **0 lint warning, 0 typecheck error** (baseline temiz)
- **24 test dosyası / 105 test case** (audit başında 0)
- **Production canlı** — HTTP 200, tüm rules deploy edildi
- **5 god-page refactored** (~5940 LoC → ~1857 LoC, -69%)

## Güvenlik

| Eylem | Durum |
|---|---|
| Service account key rotate (gcloud) | ✅ Eski `e1312f88...` DISABLED, yeni `ad33f7ed...` aktif |
| Git history purge (`git filter-repo`) | ✅ 1896 commit yeniden yazıldı, GitHub'da 404 + code search 0 hit |
| Super-admin → Firebase custom claim | ✅ 4 admin UID claim'li + rules deploy edildi |
| `/api/proxy` SSRF | ✅ Silindi (0 caller) |
| `/api/admin/import-data` Admin SDK migration | ✅ Client SDK kaldırıldı, rate limit + structured errors |
| `/api/auth/check-email` enumeration | ✅ Rate limit 5/dk + 250ms delay + distributed Firestore limiter |
| Webhook HMAC (Resend Svix v1 + Netgsm IP whitelist) | ✅ Replay protection (`webhookReplayIds` + 90-day TTL) |
| `storage.rules` transparency public read | ✅ Owner / NGO admin / super-admin only |
| `dangerouslySetInnerHTML` sanitize | ✅ 17 dosya `isomorphic-dompurify` ile |
| `target="_blank"` → `rel="noopener noreferrer"` | ✅ 7 patch + 26 zaten doğru |
| AI flow input sanitize + per-user quota | ✅ `src/ai/guards.ts` + env-tunable cap (AI_QUOTA_*) |

## Yeni Özellikler

| Feature | Açıklama |
|---|---|
| **İmece akıllı eşleştirme** | `src/lib/volunteer-matching.ts` — skills/interests/city/availability/workMode/language ağırlıklı 0-100 puan + "Sana Özel Öneriler" |
| **Real-time messaging** | `readBy.{uid}` server timestamp + unread cue |
| **Affiliate webhook** | `/api/affiliate/webhook/[brandId]` HMAC + idempotent + impactScore inc |
| **Event RSVP** | `/api/events/[id]/rsvp` transactional capacity check + UI |
| **NGO campaign send UI** | Full composer + list with wallet/cost integration |
| **FCM push notifications** | Web scaffold (service worker + provider + token save) — iOS APNs cert pending |
| **Analytics consumption** | GA4 + GTM + Meta Pixel ID form → script injection on NGO public page |
| **Emergency module backend** | Disaster reports + help requests → Firestore |
| **QR card activation backend** | Owner-create idempotent setDoc |
| **Certificate PDF** | Profile sertifika satırlarında Download (zaten implement edilmişti, audit yanlış flag) |

## UX / Kalite

| Eylem | Durum |
|---|---|
| 7 error.tsx boundary | ✅ Global + 6 dashboard |
| 5 dashboard EmptyState | ✅ my-applications/my-donations/my-badges/messages/notifications |
| 5 god-page refactor | ✅ brands (1337→498), users (1283→370), login/selection (1174→57), website (1084→456), volunteer (1061→476) |
| i18n migration | ✅ ~582 string `marketing.* / dashboard.* / aria.* / landing.*` namespace'lerine taşındı (TR+EN dolu, 5 dil TR fallback) |
| Lucide tree-shake | ✅ 11/11 wildcard import'u explicit map'e çevrildi |
| 700+ Firestore collection literal → `COLLECTIONS.*` constants | ✅ Tam migration |
| Listener cleanup audit + ESLint rule (`error` severity) | ✅ Codebase disiplinli (0 offender) |
| Lighthouse CI hard gate | ✅ a11y >= 0.85 blocker, perf/seo warn |
| Dependabot weekly grouped updates | ✅ npm + github-actions |

## CI/CD

| Eylem | Durum |
|---|---|
| Vitest job (`.github/workflows/ci.yml`) | ✅ Her PR'da çalışır |
| Rules emulator job (Java + firestore emulator) | ✅ Non-blocking initially, TODO upgrade |
| Lighthouse workflow | ✅ Hard gate on a11y |
| Dependabot config | ✅ Weekly, grouped by domain |

## Operasyon

| Eylem | Durum |
|---|---|
| `apphosting.yaml` maxInstances 1→3 | ✅ |
| Firestore TTL for `webhookReplayIds.expiresAt` (90 gün) | ✅ ACTIVE |
| 11 eksik env var `.env.example`'a eklendi | ✅ WhatsApp + N-Kolay + AI_QUOTA_* + RESEND_WEBHOOK_SECRET + AFFILIATE_WEBHOOK_SECRET + NEXT_PUBLIC_FIREBASE_VAPID_KEY |

## Persistent Altyapı (yeni oturumlarda otomatik yüklenir)

- `/CLAUDE.md` — orchestration playbook
- `.claude/agents/` — 5 lead + 3 worker subagent tanımı
- `docs/audit/` — findings, tasks, decisions, listener-audit + runbooks

## ⚠️ Senin yapacakların (deploy'dan önce)

1. **App Hosting secrets** (12 değişken): RESEND_WEBHOOK_SECRET, NETGSM_WEBHOOK_ALLOWED_IPS, META_*, NKOLAY_*, AFFILIATE_WEBHOOK_SECRET, NEXT_PUBLIC_FIREBASE_VAPID_KEY
   - `firebase apphosting:secrets:set <NAME>` her biri için
2. **`apphosting.yaml`** env→secret mapping ekleme (secrets set edildikten sonra)
3. **FCM Server Key** (Firebase Console → Cloud Messaging → Web push certificates) — `NEXT_PUBLIC_FIREBASE_VAPID_KEY` için
4. **iOS APNs cert** (Apple Developer Portal) — P-FCM-DELIVERY için
5. **`apphosting:secrets:set` AI_QUOTA_*** ortam değerleri (opsiyonel — default 30 zaten OK)

Daha detaylı runbook'lar: `docs/audit/runbooks/`

## Kalan tekil iyileştirmeler (önemsiz, future)

Spawn'lı follow-up ID'leri `docs/audit/tasks.md`'de tutuluyor:
- P1-1b-tail: check-email response shape redesign (UX kontrat değişikliği)
- P1-2b: Netgsm gerçek HMAC sağlayınca migrate (external)
- P3-1b: AutoTranslate full removal (önkoşul: tüm string'ler 7 dil tam dolduğunda)
- P3-2b: font-black 371 occurrence audit (opsiyonel font weight optimization)
- P-FCM-DELIVERY: foreground/background payload routing + click nav + settings CTA
