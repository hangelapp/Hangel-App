#!/bin/zsh
# Grup 2/3/4 importer'ı 45'er dk arayla çalıştırır (Grup 1 ayrıca çalışıyor).
cd /Users/apple/new-app
echo "[schedule] başladı $(date)" >> /tmp/import-schedule.log
sleep 2700   # +45 dk
echo "[schedule] GRUP 2 başlıyor $(date)" >> /tmp/import-schedule.log
node _importer.js 2 >> /tmp/import-schedule.log 2>&1
sleep 2700   # +90 dk
echo "[schedule] GRUP 3 başlıyor $(date)" >> /tmp/import-schedule.log
node _importer.js 3 >> /tmp/import-schedule.log 2>&1
sleep 2700   # +135 dk
echo "[schedule] GRUP 4 başlıyor $(date)" >> /tmp/import-schedule.log
node _importer.js 4 >> /tmp/import-schedule.log 2>&1
echo "[schedule] TÜM GRUPLAR BİTTİ $(date)" >> /tmp/import-schedule.log
