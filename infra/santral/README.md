# hangel — Santral (WebRTC ↔ SIP geçidi)

Kendi santral altyapımız: tarayıcıdaki hangel paneli (SIP.js) ile operatör SIP
trunk'ları arasında köprü kuran **çok-kiracılı** bir geçit.

## Mimari (BYOC — Bring Your Own Carrier)

Her dernek/STK **kendi lisanslı operatör hattını** (SIP trunk) getirir; hangel
yalnızca yazılımı ve geçidi sağlar.

```
  Tarayıcı (hangel paneli, SIP.js)
        │  WSS  (wss://santral.hangel.org:443)   [DTLS-SRTP, ICE, opus]
        ▼
  ┌──────────────────────────────────────────────┐
  │  GEÇİT  (Ubuntu 22.04, tek VM, çok-kiracılı)   │
  │   • Asterisk (PJSIP)  — sinyalizasyon + medya  │
  │   • coturn (TURN/STUN) — NAT geçişi            │
  │   • Let's Encrypt TLS  — santral.hangel.org │
  └──────────────────────────────────────────────┘
        │  SIP/UDP 5060   [ulaw/alaw]
        ▼
  Operatör trunk (ör. Pasifik 185.77.91.103) ──► PSTN / mobil
```

- **İlk kiracı:** Sosyal Fayda Derneği — Pasifik trunk: `185.77.91.103:5060/UDP`,
  dahili `100` (Kullanıcı İlişkileri; diğerleri 101-105), DID `902167080216`.
- Tarayıcı WSS ile geçide kaydolur; geçit kiracının operatör trunk'ına köprüler.

> **Secret'lar hakkında:** Bu dizindeki dosyalar git'e **secret'sız** girer.
> Gerçek SIP şifreleri ve TURN secret'ı yalnızca sunucudaki `santral.env`
> dosyasında bulunur (`.gitignore`'da; commit edilmez). Konfig şablonlarında
> `${VAR}` placeholder'ları vardır; `setup.sh` bunları kurulumda yerleştirir.

---

## Kurulum — adım adım

### 1. Google Cloud'da VM aç
1. Google Cloud Console → **Compute Engine → VM instances → Create instance**
   - https://console.cloud.google.com/compute/instances
2. Ayarlar:
   - **Region:** `europe-west1` (veya `europe-west3` — düşük gecikme için TR'ye yakın)
   - **Machine type:** `e2-small` (2 vCPU paylaşımlı, 2 GB) — başlangıç için yeterli
   - **Boot disk:** Ubuntu **22.04 LTS**, 20 GB
   - **Network:** dış (ephemeral) IP açık. Kalıcı IP için sonra **Static IP** ayır
     (https://console.cloud.google.com/networking/addresses).

### 2. Firewall portlarını aç
**VPC network → Firewall → Create firewall rule**
(https://console.cloud.google.com/networking/firewalls). VM'in network tag'ine
uygula. Açılacak portlar:

| Port            | Proto    | Amaç                          |
|-----------------|----------|-------------------------------|
| `443`           | TCP      | WSS (tarayıcı SIP.js sinyali) |
| `80`            | TCP      | Let's Encrypt (yalnız sertifika alımı) |
| `3478`          | TCP+UDP  | TURN / STUN                   |
| `5349`          | TCP+UDP  | TURN over TLS                 |
| `49152-65535`   | UDP      | RTP / TURN relay (medya)      |
| `5060`          | UDP      | (yalnızca giden — operatör trunk; kural opsiyonel) |

Kaynak `0.0.0.0/0` olabilir (tarayıcılar her yerden bağlanır).

### 3. DNS kaydı (Cloudflare)
- Cloudflare → hangel.org → **DNS → Records → Add record**
- **A** kaydı: `santral` → VM'in dış IP'si
- **Proxy durumu: DNS only (gri bulut)** — WSS/TURN proxy'lenemez, turuncu bulut KAPALI olmalı.
- Yayılmayı bekle (`dig santral.hangel.org` ile doğrula); sertifika için şart.

### 4. Dosyaları sunucuya kopyala
```bash
# yerelden:
gcloud compute scp --recurse infra/santral VM_ADI:~/santral --zone=europe-west1-b
# veya: git clone + cd new-app/infra/santral
```

### 5. `santral.env`'i doldur
```bash
cd ~/santral
cp santral.env.example santral.env
nano santral.env
```
Doldur: `PASIFIK_PWD_100` (Pasifik SIP şifresi), `TENANT1_WEBRTC_PWD`
(panel/SIP.js client şifresi), `TURN_SECRET` (`openssl rand -hex 32`).

### 6. Kurulumu çalıştır
```bash
sudo bash setup.sh
```
Betik: Asterisk 20.x + coturn + certbot kurar, Let's Encrypt sertifikası alır,
konfigleri `${VAR}` değerleriyle üretip `/etc/asterisk` ve `/etc/turnserver.conf`'a
yazar, servisleri başlatır. Idempotent — tekrar çalıştırılabilir.

### 7. Doğrula
```bash
asterisk -rx 'pjsip show registrations'   # tenant1-pasifik-reg => Registered olmalı
systemctl status coturn --no-pager
```
Tarayıcı bağlantı adresi: `wss://santral.hangel.org:443`,
TURN: `turns:santral.hangel.org:5349`.

---

## Pasifik'ten istenecek TEK şey

Pasifik IP-tabanlı kimlik doğrulama (ACL) uyguluyorsa, geçidin çıkış IP'si
trunk'ta beyaz listeye alınmalı:

> **"VM dış IP'mizi `X.X.X.X`, `100` dahilisinin SIP trunk'ı için
> whitelist'leyin."**

(`X.X.X.X` = adım 1'de ayrılan VM static IP'si.) Yalnız kullanıcı/şifre auth
yetiyorsa whitelist gerekmez; çoğu operatörde IP whitelist + auth birlikte istenir.

---

## Yeni kiracı ekleme

1. `asterisk/tenants/tenant.conf.example` → `tenant2.conf` kopyala; içindeki
   `tenant1`/`tenant2` ve `${OPERATOR2_*}` değişkenlerini düzenle.
2. `extensions.conf`'taki üç context'i (`*-from-browser`, `*-from-pstn`,
   `*-ring-browser`) yeni kiracı adıyla `extensions.d/` altına kopyala.
3. `santral.env`'e yeni kiracının değişkenlerini ekle (`TENANT2_*`, `OPERATOR2_*`).
4. `sudo bash setup.sh` tekrar çalıştır — yeni konfigler `pjsip.d/` ve
   `extensions.d/` altına üretilir, servisler reload edilir.

Context ayrımı kiracılar arası izolasyonu sağlar: bir kiracının tarayıcısı
diğerinin trunk'ını çeviremez.

---

## Dosyalar
- `setup.sh` — Ubuntu 22.04 kurulum betiği (idempotent)
- `santral.env.example` — ortam değişkeni şablonu (secret'sız)
- `asterisk/pjsip.conf` — WSS transport + WebRTC endpoint + Pasifik trunk
- `asterisk/extensions.conf` — dialplan (giden / gelen DID)
- `asterisk/tenants/tenant.conf.example` — yeni kiracı PJSIP deseni
- `coturn/turnserver.conf` — TURN/STUN konfigi
- `.gitignore` — `santral.env`, `*.key` ignore
