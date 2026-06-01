# hangel — Audit Workspace

Bu klasör hangel projesinin denetim ve görev takip alanıdır. Tüm bulgular, görevler, kararlar ve runbook'lar burada.

## İçindekiler

| Dosya | Ne içerir |
|---|---|
| [findings.md](./findings.md) | 6 paralel audit'in birleştirilmiş bulgu raporu (mimari, frontend, backend, security, integrations, qa/devops) |
| [tasks.md](./tasks.md) | P0–P4 görev panosu — durum, sahip lead, kabul kriteri |
| [decisions.md](./decisions.md) | Her uygulanan değişikliğin plan + rollback kaydı (chronological) |
| [runbooks/](./runbooks/) | Kullanıcının elle çalıştırması gereken yüksek riskli komutlar |

## Ajan sistemi nasıl çalışır?

`/CLAUDE.md` proje kökünde orkestrasyon playbook'unu, `.claude/agents/` altındaki dosyalar 5 lead + 3 worker subagent tanımını tutar.

Bir görev verildiğinde sıra:
1. Orchestrator (ana Claude oturumu) görev tipini belirler.
2. İlgili lead'i dispatch eder.
3. Lead `tasks.md`'den task ID'yi çeker, plan + rollback yazar.
4. Lead surgical-coder → test-engineer → code-auditor sırasıyla çalışır.
5. Tüm gate'ler (typecheck, lint, test) yeşilse durum `Done`a alınır.
6. Yüksek riskli işler `🟡 Needs user approval` ile durur ve runbook üretilir.

## Hızlı linkler

- En kritik P0 → `tasks.md` üst satır
- Service account rotate → `runbooks/service-account-rotate.md`
- Git history purge → `runbooks/git-history-purge.md`
- Super-admin claims migration → `runbooks/super-admin-claims.md`
- Production rules deploy → `runbooks/rules-deploy.md`

## İlk açılışta kullanıcının yapması gerekenler

1. `runbooks/service-account-rotate.md`'i oku — Firebase Console adımları (yalnızca sen yapabilirsin).
2. Anahtarı rotate ettikten sonra orchestrator'a bildir; history purge ikinci aşamada koordineli çalıştırılır.
