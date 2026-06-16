#!/usr/bin/env bash
# =============================================================================
# hangel — Santral kurulum betiği (Ubuntu 22.04)
# -----------------------------------------------------------------------------
# WebRTC <-> SIP geçidi: Asterisk (PJSIP) + coturn (TURN) + Let's Encrypt TLS.
#
# KULLANIM (Ubuntu 22.04 VM'de, root/sudo ile):
#   1) bu dizini sunucuya kopyala
#   2) cp santral.env.example santral.env && nano santral.env   (değerleri doldur)
#   3) sudo bash setup.sh
#
# Idempotent: tekrar çalıştırılabilir. Kurulu paketleri atlar, konfigleri yeniden
# üretir, sertifikayı yalnızca yoksa/yenilenmesi gerekiyorsa alır.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/santral.env"

log()  { echo -e "\n\033[1;36m==> $*\033[0m"; }
ok()   { echo -e "\033[1;32m    [OK] $*\033[0m"; }
warn() { echo -e "\033[1;33m    [!] $*\033[0m"; }
die()  { echo -e "\033[1;31m    [HATA] $*\033[0m" >&2; exit 1; }

# --- 0. Ön kontroller --------------------------------------------------------
[ "$(id -u)" -eq 0 ] || die "Bu betik root/sudo ile çalıştırılmalı: sudo bash setup.sh"
[ -f "$ENV_FILE" ]   || die "santral.env yok. Önce: cp santral.env.example santral.env && nano santral.env"

log "santral.env okunuyor"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${DOMAIN:?santral.env içinde DOMAIN tanımlı olmalı}"
: "${LETSENCRYPT_EMAIL:?santral.env içinde LETSENCRYPT_EMAIL tanımlı olmalı}"
ok "DOMAIN=${DOMAIN}"

# Konfiglere geçirilecek değişkenleri envsubst için sınırla (rastgele env sızmasın).
SUBST_VARS='${DOMAIN} ${EXTERNAL_IP} ${TURN_SECRET} ${TURN_USER} ${TURN_PWD}'
SUBST_VARS+=' ${PASIFIK_HOST} ${PASIFIK_PORT} ${PASIFIK_EXT_100} ${PASIFIK_PWD_100}'
SUBST_VARS+=' ${TENANT1_WEBRTC_USER} ${TENANT1_WEBRTC_PWD} ${TENANT1_DID}'

# --- 1. Paket kurulumu -------------------------------------------------------
log "Paket listesi güncelleniyor"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y

install_if_missing() {
  local pkg="$1"
  if dpkg -s "$pkg" >/dev/null 2>&1; then
    ok "$pkg zaten kurulu"
  else
    log "$pkg kuruluyor"
    apt-get install -y "$pkg"
    ok "$pkg kuruldu"
  fi
}

# Asterisk 20.x: Ubuntu 22.04 deposunda asterisk paketi mevcut (20.x serisi).
install_if_missing asterisk
install_if_missing coturn
install_if_missing certbot
install_if_missing gettext-base   # envsubst için

# --- 2. Let's Encrypt sertifikası -------------------------------------------
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
if [ -f "${CERT_DIR}/fullchain.pem" ]; then
  ok "Sertifika mevcut: ${CERT_DIR} (gerekirse certbot otomatik yeniler)"
else
  log "Let's Encrypt sertifikası alınıyor (standalone, 80/TCP geçici kullanılır)"
  warn "DNS (${DOMAIN} -> bu VM'in dış IP'si) YAYILMIŞ olmalı, yoksa certbot başarısız olur."
  # 80 portunu geçici dinlemek için varsa servisleri durdur (idempotent).
  systemctl stop asterisk 2>/dev/null || true
  certbot certonly --standalone --non-interactive --agree-tos \
    -m "${LETSENCRYPT_EMAIL}" -d "${DOMAIN}" \
    || die "certbot başarısız. 80/TCP açık mı, DNS doğru mu kontrol et."
  ok "Sertifika alındı"
fi

# coturn, Let's Encrypt key'ini okuyabilsin (turnserver kullanıcısı root değil).
log "Sertifika izinleri ayarlanıyor (coturn okuyabilsin)"
groupadd -f ssl-cert
usermod -aG ssl-cert turnserver 2>/dev/null || true
chgrp -R ssl-cert /etc/letsencrypt/live /etc/letsencrypt/archive 2>/dev/null || true
chmod -R g+rX /etc/letsencrypt/live /etc/letsencrypt/archive 2>/dev/null || true
ok "İzinler ayarlandı"

# --- 3. Dış IP tespiti (coturn external-ip / Asterisk için) ------------------
if [ -z "${EXTERNAL_IP:-}" ]; then
  EXTERNAL_IP="$(curl -fsS --max-time 5 https://api.ipify.org || true)"
fi
if [ -n "${EXTERNAL_IP:-}" ]; then
  export EXTERNAL_IP
  ok "Dış IP: ${EXTERNAL_IP}"
else
  warn "Dış IP otomatik tespit edilemedi. santral.env'e EXTERNAL_IP ekleyebilirsin."
fi

# --- 4. Konfigleri üret (envsubst ile ${VAR} yerleştir) ----------------------
render() {  # render <kaynak-sablon> <hedef>
  local src="$1" dst="$2"
  [ -f "$src" ] || die "Şablon bulunamadı: $src"
  mkdir -p "$(dirname "$dst")"
  # Sadece izinli değişkenleri yerleştir; tanımsızları '' yapma riskine karşı uyar.
  envsubst "$SUBST_VARS" < "$src" > "$dst"
  chmod 640 "$dst"
  ok "Üretildi: $dst"
}

log "Asterisk konfigleri yazılıyor (/etc/asterisk)"
render "${SCRIPT_DIR}/asterisk/pjsip.conf"      "/etc/asterisk/pjsip.conf"
render "${SCRIPT_DIR}/asterisk/extensions.conf" "/etc/asterisk/extensions.conf"
chown root:asterisk /etc/asterisk/pjsip.conf /etc/asterisk/extensions.conf 2>/dev/null || true

# Çok-kiracı include dizinleri (boş olsa bile #include hata vermesin).
mkdir -p /etc/asterisk/pjsip.d /etc/asterisk/extensions.d
if compgen -G "${SCRIPT_DIR}/asterisk/tenants/*.conf" >/dev/null; then
  log "Ek kiracı konfigleri işleniyor (tenants/*.conf)"
  for f in "${SCRIPT_DIR}"/asterisk/tenants/*.conf; do
    base="$(basename "$f")"
    render "$f" "/etc/asterisk/pjsip.d/${base}"
  done
fi

log "coturn konfigi yazılıyor (/etc/turnserver.conf)"
render "${SCRIPT_DIR}/coturn/turnserver.conf" "/etc/turnserver.conf"
chown root:turnserver /etc/turnserver.conf 2>/dev/null || true
# Dış IP'yi konfige ekle (tespit edilebildiyse ve henüz yoksa).
if [ -n "${EXTERNAL_IP:-}" ] && ! grep -q "^external-ip=" /etc/turnserver.conf; then
  echo "external-ip=${EXTERNAL_IP}" >> /etc/turnserver.conf
  ok "coturn external-ip eklendi: ${EXTERNAL_IP}"
fi

# coturn'ün varsayılan /etc/default/turnserver'da etkin olduğundan emin ol.
if [ -f /etc/default/coturn ]; then
  sed -i 's/^#\?TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn || true
fi
mkdir -p /var/log/turnserver && chown turnserver:turnserver /var/log/turnserver 2>/dev/null || true

# --- 5. Servisleri etkinleştir + yeniden başlat ------------------------------
log "Servisler etkinleştiriliyor ve başlatılıyor"
systemctl enable asterisk coturn >/dev/null 2>&1 || true
systemctl restart coturn   && ok "coturn çalışıyor"
systemctl restart asterisk && ok "asterisk çalışıyor"

# --- 6. Sertifika yenileme kancası (coturn/asterisk reload) ------------------
HOOK="/etc/letsencrypt/renewal-hooks/deploy/santral-reload.sh"
mkdir -p "$(dirname "$HOOK")"
cat > "$HOOK" <<'HOOKEOF'
#!/usr/bin/env bash
chgrp -R ssl-cert /etc/letsencrypt/live /etc/letsencrypt/archive 2>/dev/null || true
chmod -R g+rX /etc/letsencrypt/live /etc/letsencrypt/archive 2>/dev/null || true
systemctl restart coturn || true
systemctl reload asterisk 2>/dev/null || systemctl restart asterisk || true
HOOKEOF
chmod +x "$HOOK"
ok "Sertifika yenileme kancası kuruldu: $HOOK"

log "KURULUM TAMAMLANDI"
echo "    Asterisk durumu:  asterisk -rx 'pjsip show registrations'"
echo "    coturn durumu  :  systemctl status coturn --no-pager"
echo "    WSS endpoint   :  wss://${DOMAIN}:443  (SIP.js bağlantı adresi)"
echo "    TURN           :  turn:${DOMAIN}:3478  /  turns:${DOMAIN}:5349"
