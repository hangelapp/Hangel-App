#!/bin/bash
# Asterisk'i KAYNAKTAN derle+kur — Ubuntu paketi WSS (res_pjsip_transport_websocket)
# desteklemediği için. WebRTC/WSS için gereken modüller derleme zamanında dahil edilir.
# Idempotent değil; tek seferlik. Mevcut config (/etc/asterisk) KORUNUR.
set -e
AST_VER="20.9.3"   # LTS, WSS/WebRTC stabil

echo "==> 1) Ubuntu paketi Asterisk kaldırılıyor (config korunur)"
sudo systemctl stop asterisk 2>/dev/null || true
sudo apt-get remove -y asterisk asterisk-modules asterisk-config 2>/dev/null || true
sudo apt-get autoremove -y 2>/dev/null || true

echo "==> 2) Derleme bağımlılıkları"
sudo apt-get update -y
sudo apt-get install -y build-essential wget libssl-dev libncurses5-dev \
  libnewt-dev libxml2-dev libsqlite3-dev uuid-dev libjansson-dev libedit-dev pkg-config

echo "==> 3) Asterisk ${AST_VER} kaynağı indiriliyor"
cd /usr/src
sudo rm -rf asterisk-${AST_VER}*
sudo wget -q https://downloads.asterisk.org/pub/telephony/asterisk/releases/asterisk-${AST_VER}.tar.gz
sudo tar xzf asterisk-${AST_VER}.tar.gz
cd asterisk-${AST_VER}

echo "==> 4) Ek bağımlılıklar (script)"
sudo contrib/scripts/install_prereq install >/dev/null 2>&1 || true

echo "==> 5) configure (WebSocket + PJSIP dahil)"
sudo ./configure --with-jansson-bundled --with-pjproject-bundled >/dev/null

echo "==> 6) menuselect: WSS/WebRTC modülleri açık"
sudo make menuselect.makeopts >/dev/null
sudo menuselect/menuselect --enable res_http_websocket --enable res_pjsip_transport_websocket \
  --enable res_pjsip --enable chan_pjsip --enable res_srtp menuselect.makeopts || true

echo "==> 7) Derleme (birkaç dakika)"
sudo make -j"$(nproc)" >/dev/null
sudo make install >/dev/null

echo "==> 8) Servis dosyası + kullanıcı"
sudo make config >/dev/null 2>&1 || true
id asterisk >/dev/null 2>&1 || sudo useradd -r -d /var/lib/asterisk -s /usr/sbin/nologin asterisk
sudo chown -R asterisk:asterisk /etc/asterisk /var/lib/asterisk /var/log/asterisk /var/spool/asterisk /usr/lib/asterisk 2>/dev/null || true

echo "==> 9) Sertifika izinleri (asterisk okuyabilsin)"
sudo usermod -aG ssl-cert asterisk 2>/dev/null || true

echo "==> 10) Asterisk başlatılıyor"
sudo systemctl enable asterisk
sudo systemctl restart asterisk
sleep 6

echo "==> SONUÇ"
sudo asterisk -rx "pjsip show transports"
sudo ss -tlnp | grep ":443" && echo "443 ACIK-BASARILI" || echo "443 HALA KAPALI"
