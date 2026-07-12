#!/bin/bash
# hangel santral — çağrı akışı (call flow) sunucu kurulumu.
# AGI köprüsünü + ses senkron cron'unu + voicemail bağlamını kurar.
# Idempotent; tekrar çalıştırılabilir. Asterisk yeniden yüklenir.
#
# ENV gerekir (santral.env'den ya da elle export):
#   HANGEL_API_BASE   (varsayılan https://hangel.org)
#   SANTRAL_GATEWAY_SECRET   (resolve API auth — hangel apphosting ile AYNI olmalı)
set -e

API_BASE="${HANGEL_API_BASE:-https://hangel.org}"
SECRET="${SANTRAL_GATEWAY_SECRET:-}"
AGI_DIR="/var/lib/asterisk/agi-bin"
SOUNDS_DIR="/var/lib/asterisk/sounds/hangel"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> 1) AGI script yerleştiriliyor"
sudo mkdir -p "$AGI_DIR"
sudo cp "$SRC_DIR/asterisk/agi/hangel-callflow.py" "$AGI_DIR/hangel-callflow.py"
sudo chmod +x "$AGI_DIR/hangel-callflow.py"
sudo chown asterisk:asterisk "$AGI_DIR/hangel-callflow.py"

echo "==> 2) AGI ortam değişkenleri (systemd override ile Asterisk'e geçir)"
sudo mkdir -p /etc/systemd/system/asterisk.service.d
sudo tee /etc/systemd/system/asterisk.service.d/hangel-env.conf >/dev/null <<ENVCONF
[Service]
Environment=HANGEL_API_BASE=${API_BASE}
Environment=SANTRAL_GATEWAY_SECRET=${SECRET}
ENVCONF

echo "==> 3) Ses klasörü + senkron script"
sudo mkdir -p "$SOUNDS_DIR"
sudo tee /usr/local/bin/santral-sync-audio.sh >/dev/null <<'SYNC'
#!/bin/bash
# callFlow ses URL'lerini indirip yerel sounds/'a koyar (Asterisk uzak URL çalamaz).
# hangel API'den her STK'nın callFlow'undaki audio URL'lerini alır.
# Basit sürüm: /api/santral/audio-manifest -> [{ngoId,slot,url}] döner.
API_BASE="${HANGEL_API_BASE:-https://hangel.org}"
SECRET="${SANTRAL_GATEWAY_SECRET:-}"
SOUNDS="/var/lib/asterisk/sounds/hangel"
MANIFEST=$(curl -s -H "Authorization: Bearer ${SECRET}" "${API_BASE}/api/santral/audio-manifest" 2>/dev/null)
[ -z "$MANIFEST" ] && exit 0
echo "$MANIFEST" | python3 -c '
import sys, json, os, subprocess
try: items = json.load(sys.stdin).get("items", [])
except Exception: sys.exit(0)
sounds = "/var/lib/asterisk/sounds/hangel"
for it in items:
    ngo, slot, url = it.get("ngoId"), it.get("slot"), it.get("url")
    if not (ngo and slot and url): continue
    d = f"{sounds}/{ngo}"; os.makedirs(d, exist_ok=True)
    raw = f"{d}/{slot}.download"
    subprocess.run(["curl","-sL","-o",raw,url], timeout=30)
    # WAV değilse Asterisk için 8kHz mono WAV a çevir (sox varsa)
    out = f"{d}/{slot}.wav"
    if subprocess.run(["which","sox"],capture_output=True).returncode==0:
        subprocess.run(["sox",raw,"-r","8000","-c","1","-b","16",out], timeout=30)
    else:
        os.replace(raw, out)
'
sudo chown -R asterisk:asterisk "$SOUNDS" 2>/dev/null || true
SYNC
sudo chmod +x /usr/local/bin/santral-sync-audio.sh
# sox (ses dönüştürme) kur
sudo apt-get install -y sox libsox-fmt-mp3 >/dev/null 2>&1 || true
# HANGEL env'i cron'a da ver
echo "HANGEL_API_BASE=${API_BASE}" | sudo tee /etc/default/santral-audio >/dev/null
echo "SANTRAL_GATEWAY_SECRET=${SECRET}" | sudo tee -a /etc/default/santral-audio >/dev/null
# 5 dakikada bir senkron (cron)
( sudo crontab -l 2>/dev/null | grep -v santral-sync-audio; echo "*/5 * * * * . /etc/default/santral-audio; /usr/local/bin/santral-sync-audio.sh" ) | sudo crontab -

echo "==> 4) voicemail bağlamı (hangel context, kutu 100)"
sudo tee /etc/asterisk/voicemail.conf >/dev/null <<'VM'
[general]
format=wav
maxmsg=100
[hangel]
100 => 1234,hangel Santral,,,attach=no
VM

echo "==> 5) Python3 kontrol (AGI için)"
which python3 >/dev/null || sudo apt-get install -y python3 >/dev/null 2>&1

echo "==> 6) Asterisk yeniden yükleniyor"
sudo systemctl daemon-reload
sudo systemctl restart asterisk
sleep 4

echo "==> SONUÇ"
sudo asterisk -rx "dialplan show tenant1-from-pstn" 2>/dev/null | head -8
echo "AGI: $AGI_DIR/hangel-callflow.py"
echo "Ses senkron: her 5 dk (santral-sync-audio.sh)"
