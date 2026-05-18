# Hangel — Orchestration Playbook for Claude

Bu dosya proje kökündedir ve Claude Code her oturumda otomatik yükler. Hangel projesinde nasıl çalışılacağını tanımlar.

## Üç katmanlı ajan sistemi

```
Layer 0  Orchestrator (ana oturum)        Karar verir, sıralar, çakışmaları çözer
Layer 1  Topic Leads (5)                  hangel-security-lead, hangel-frontend-lead, hangel-backend-lead, hangel-devops-lead, hangel-product-lead
Layer 2  Worker Specialists (3)           hangel-surgical-coder, hangel-code-auditor, hangel-test-engineer
```

Lead'ler `.claude/agents/` altında tanımlı. Her lead dispatch ettiği surgical-coder + code-auditor + test-engineer çıktısını birleştirip rapor verir.

## Bir görev geldiğinde sıra

1. **Orchestrator**: görev tipini belirle, ilgili lead'i seç.
2. **Lead**: `docs/audit/tasks.md` içinden ilgili task ID'sini çek, blast radius çıkar, ≤5 bullet plan yaz, `docs/audit/decisions.md`'e plan + rollback ekle.
3. **Lead → Surgical Coder**: dosya listesi + kabul kriteri + "do not touch" listesi ile dispatch et.
4. **Lead → Test Engineer**: yeni davranışı koruyan testler.
5. **Lead → Code Auditor**: diff'i plana ve standartlara karşı bağımsız doğrulama.
6. **Lead**: `npm run typecheck && npm run lint && npm run test` (ve rules için `npm run test:rules`). Her geçit yeşil olmalı.
7. **Lead**: `docs/audit/tasks.md` durumunu güncelle. `docs/audit/decisions.md`'e changelog ekle.
8. **Orchestrator**: rapor + kullanıcıya görsel test gerektiren maddeleri açıkça işaretle.

## Çakışma kuralları (paralel dispatch için)

Aynı dosyaya iki ajan paralel yazamaz. Lead'ler dispatch ederken **dosya ownership tablosu** üretip orchestrator'a sunar. Orchestrator çakışmayı görür ve ya ardışıklaştırır ya da scope böler.

Dosya sahipliği tablosu (default):
- `firestore.rules`, `storage.rules`, `src/app/api/auth/**`, `src/app/api/admin/**`, `src/app/api/messaging/webhook/**`, `src/app/api/proxy/**`, `src/ai/flows/**`, `tests/rules/**`, `dangerouslySetInnerHTML` kullanımı → **security-lead**
- `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/app/**/error.tsx`, `src/components/**`, `src/hooks/**`, `src/lib/translations.ts` → **frontend-lead**
- Diğer `src/app/api/**`, `src/app/actions/**`, `src/firebase/**`, `src/lib/{messaging,payment,invoice}/**`, `src/ai/flows/**` (logic), `src/lib/api-clients.ts` → **backend-lead**
- `.github/workflows/**`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `apphosting.yaml`, `firebase.json`, `.firebaserc`, `capacitor.config.ts`, `package.json`, `.env.example`, `.gitignore`, `docs/audit/runbooks/**` → **devops-lead**
- `docs/audit/findings.md`, `docs/audit/tasks.md`, `docs/audit/README.md`, `README.md` (ürün metni) → **product-lead**

## Yüksek riskli alanlar (asla otomatik uygulanmaz)

Aşağıdaki alanlar daima `🟡 Needs user approval` ile döner. Lead bunlara dokunmadan önce `docs/audit/decisions.md`'e risk + rollback plan yazar:

- Firebase service account rotasyonu (Console gerektirir)
- Git history purge (`git filter-repo`, force-push)
- Firestore/Storage rules deploy (`firebase deploy --only firestore:rules`)
- Payment provider (N-Kolay) gerçek anahtar takasları
- Super-admin role/claims modeli değişiklikleri
- `firebase.json`, `apphosting.yaml`'da production-impacting değişiklikler

Bu maddeler için `docs/audit/runbooks/` altında copy-paste komut listesi tutulur.

## Stil ve sınırlar

- **Cerrahi edit**: bir bug-fix etrafını temizlemez. Bir one-shot işlem helper'a dönüştürülmez.
- Hayali "future-proof" abstraction yok. Aynı satır 3 kez tekrar etse bile premature abstraction'dan iyidir.
- Yeni `as any`, yeni `@ts-ignore`, yeni `console.log` üretim kodunda yok.
- Yeni `dangerouslySetInnerHTML` yok (sadece sanitize edilmiş üretim).
- Türkçe metin korunur; `translations.ts` taşımalarında string birebir aynı kalır.
- Her API route `{ errorCode, message }` formatında hata döner; raw `error.message` istemciye sızdırılmaz.
- `as` cast yerine zod parse + `as const` tercih.

## Test ve doğrulama

Hızlı gate (her edit sonrası): `npm run typecheck`
Tam gate (görev tamamlandığında): `npm run typecheck && npm run lint && npm run test`
Rules için: `npm run test:rules` (Firestore emulator açık olmalı)
Performans için: kullanıcı `npm run build` çalıştırır ve sonucu paylaşır

## Deploy

Kullanıcı manuel deploy eder. Hiçbir ajan `firebase deploy` veya `git push` çalıştırmaz. Lead'ler hazır komutu runbook'larda tutar.

## Memory ile ilişki

`~/.claude/projects/-Users-ake-Documents-hangelapp/memory/MEMORY.md` kişisel kullanıcı tercihlerini tutar (autonomous worker, surgical edits, manual deploys, vb.) — bunlar yukarıdaki kurallarla çelişirse **kullanıcı tercihleri kazanır**.

## Daha fazla bilgi

- Bulgular: `docs/audit/findings.md`
- Görev panosu: `docs/audit/tasks.md`
- Karar günlüğü: `docs/audit/decisions.md`
- Runbook'lar: `docs/audit/runbooks/`
