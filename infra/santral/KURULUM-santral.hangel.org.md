# Santral kurulumu — santral.hangel.org (tek VM + Asterisk)

Bu, `wss://santral.hangel.org/ws` WebRTC geçidini SIFIRDAN, çalışır hale
getiren adım-adım kılavuzdur. Teşhis (2026-07-11): eski `santral.hangel.org.tr`
adresi bir Kubernetes ingress'ine düşüyordu, TLS sertifikası geçersizdi
(cluster iç sertifikası) ve Asterisk portları kapalıydı → tarayıcı WSS
handshake'i **kod 1006** ile kapanıyordu. Çözüm: temiz bir Ubuntu VM'de
`setup.sh` ile Asterisk + coturn + Let's Encrypt.

Tüm repo tarafı hazır; aşağıdaki adımlar **sunucu + DNS** tarafıdır (SSH/DNS
paneli erişimi gerektirir).

---

## 0. Ön koşul: bilmen gerekenler
- Pasifik SIP şifresi (`100` dahilisi) — operatörden.
- Cloudflare hangel.org DNS erişimi.
- GCP Compute Engine erişimi.

## 1. VM aç (GCP Compute Engine)
- Region: `europe-west3` (Frankfurt, TR'ye yakın) veya `europe-west1`.
- Makine: `e2-small` (2 vCPU, 2 GB) — başlangıç için yeterli.
- Boot disk: **Ubuntu 22.04 LTS**, 20 GB.
- Dış IP: **Static IP ayır** (VM silinse de IP sabit kalsın):
  https://console.cloud.google.com/networking/addresses
- Ayrılan static IP'yi not et → aşağıda `VM_IP`.

## 2. Firewall (VPC → Firewall → Create rule; VM network tag'ine uygula)
| Port          | Proto   | Amaç                       |
|---------------|---------|----------------------------|
| 443           | TCP     | WSS (tarayıcı SIP.js)      |
| 80            | TCP     | Let's Encrypt sertifika    |
| 3478          | TCP+UDP | TURN / STUN                |
| 5349          | TCP+UDP | TURN over TLS              |
| 49152-65535   | UDP     | RTP / TURN relay (ses)     |
Kaynak: `0.0.0.0/0`. (SIP 5060/UDP yalnız giden — kural gerekmez.)

## 3. DNS (Cloudflare → hangel.org → DNS → Records)
- **A** kaydı: `santral` → `VM_IP`
- **Proxy: DNS only (GRİ bulut)** — turuncu bulut KAPALI. WSS/TURN proxy'lenemez.
- Doğrula (birkaç dk sonra):
  ```bash
  dig +short santral.hangel.org      # VM_IP dönmeli
  ```
  Sertifika alımı için bu ŞART — yayılmadan adım 6'ya geçme.

## 4. Dosyaları VM'e kopyala
```bash
# yerelden (bu repo kökünde):
gcloud compute scp --recurse infra/santral VM_ADI:~/santral --zone=europe-west3-a
# veya VM'de: git clone <repo> && cd new-app/infra/santral
```

## 5. santral.env doldur
```bash
cd ~/santral
cp santral.env.example santral.env
nano santral.env
```
Doldurulacaklar:
- `DOMAIN=santral.hangel.org`  (zaten doğru)
- `LETSENCRYPT_EMAIL=ismailhilmi@hangel.org`
- `PASIFIK_PWD_100=<Pasifik 100 dahilisinin SIP şifresi>`
- `TENANT1_WEBRTC_PWD=<panel için yeni şifre üret: openssl rand -hex 16>`
- `TURN_SECRET=<openssl rand -hex 32>`

> **KRİTİK — panel ile eşleşme:** `TENANT1_WEBRTC_USER` **sosyalfayda-100**
> olmalı (varsayılan böyle) ve `apphosting.yaml`'daki
> `NEXT_PUBLIC_SANTRAL_SIP_USER` de **sosyalfayda-100** (düzeltildi).
> `TENANT1_WEBRTC_PWD` ile `NEXT_PUBLIC_SANTRAL_SIP_PASS` de AYNI olmalı.
> Yeni şifre ürettiysen adım 8'de apphosting.yaml'ı güncelle.

## 6. Kurulum
```bash
sudo bash setup.sh
```
Asterisk 20 + coturn + certbot kurar, `santral.hangel.org` için Let's Encrypt
sertifikası alır, konfigleri yazar, servisleri başlatır. Idempotent.

## 7. Sunucuda doğrula
```bash
asterisk -rx 'pjsip show registrations'   # tenant1-pasifik-reg => Registered
systemctl status coturn --no-pager
sudo ss -tlnp | grep -E ':443|:5060'      # 443 (WSS) ve 5060 (SIP) dinliyor mu
```
Uzaktan TLS testi (yerelden):
```bash
echo | openssl s_client -connect santral.hangel.org:443 -servername santral.hangel.org 2>/dev/null \
  | openssl x509 -noout -subject -issuer
# subject: CN=santral.hangel.org  |  issuer: Let's Encrypt  (cluster IP DEĞİL)
```

## 8. Panel şifresini eşitle (yeni WebRTC şifresi ürettiysen)
`apphosting.yaml`:
```yaml
- variable: NEXT_PUBLIC_SANTRAL_SIP_PASS
  value: "<TENANT1_WEBRTC_PWD ile aynı>"
```
Sonra canlıya al (git push main → App Hosting deploy).

## 9. Pasifik whitelist (operatör IP-ACL uyguluyorsa)
Pasifik'e: **"VM dış IP'miz `VM_IP`'yi `100` dahilisinin SIP trunk'ı için
whitelist'leyin."**

---

## Bittiğinde
- Panel (santral → arama) `wss://santral.hangel.org/ws`'e bağlanır, kod 1006 biter.
- Bağlantı koparsa panel otomatik yeniden dener (use-sip-phone backoff).
- TLS testinde issuer "Let's Encrypt" görünür.
