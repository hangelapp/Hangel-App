# Runbook — Firestore Scheduled Export (Disaster Recovery)

**Operasyonel kurulum gerektirir; tek seferlik komutlar burada.**

## Önkoşullar
- `gcloud` CLI authenticated (`alikemalergelen@gmail.com`)
- Project: `hangel-new-v18-87297865-9bcc3`
- Firebase Storage zaten mevcut (`gs://hangel-new-v18-87297865-9bcc3.appspot.com`) — buraya yazılmaz, ayrı bucket önerilir

## Adım 1 — Backup bucket'ı oluştur
```bash
PROJECT=hangel-new-v18-87297865-9bcc3
REGION=eu                                   # AB veri yeri (KVKK uyumlu)
BUCKET=${PROJECT}-firestore-backups
gcloud storage buckets create gs://$BUCKET --location=$REGION --project=$PROJECT
```

Lifecycle policy (90 günlük retention):
```bash
cat > /tmp/lifecycle.json <<EOF
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": { "age": 90 }
    }
  ]
}
EOF
gcloud storage buckets update gs://$BUCKET --lifecycle-file=/tmp/lifecycle.json
```

## Adım 2 — Service account IAM yetkisi
Firestore export servisi App Hosting SA üzerinden çalışıyor:
```bash
SA=service-1082171206975@gcp-sa-firestore.iam.gserviceaccount.com
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/datastore.importExportAdmin"

gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:$SA" \
  --role="roles/storage.admin"
```

## Adım 3 — Manuel one-shot export (test)
```bash
gcloud firestore export gs://$BUCKET/$(date +%Y-%m-%d) --project=$PROJECT
```

Beklenen çıktı:
```
Waiting for [operation_id] to finish...done.
metadata:
  ...
  operationState: SUCCESSFUL
```

## Adım 4 — Cloud Scheduler (günlük otomatik export)
```bash
gcloud scheduler jobs create http firestore-daily-export \
  --schedule="0 3 * * *" \
  --time-zone="Europe/Istanbul" \
  --uri="https://firestore.googleapis.com/v1/projects/$PROJECT/databases/(default):exportDocuments" \
  --http-method=POST \
  --oauth-service-account-email="$SA" \
  --oauth-token-scope="https://www.googleapis.com/auth/datastore" \
  --message-body='{"outputUriPrefix":"gs://'$BUCKET'/scheduled"}' \
  --headers="Content-Type=application/json" \
  --project=$PROJECT \
  --location=$REGION
```

Schedule: her gün saat 03:00 Istanbul time. `outputUriPrefix` her run'da timestamped klasör altına yazar.

## Adım 5 — Doğrulama
```bash
gcloud scheduler jobs run firestore-daily-export --location=$REGION --project=$PROJECT
gcloud storage ls gs://$BUCKET/scheduled/
```

## Restore (acil durum)
```bash
gcloud firestore import gs://$BUCKET/2026-05-18 --project=$PROJECT
```

**UYARI**: Import mevcut Firestore koleksiyonlarını ÜZERİNE yazar veya birleştirir (collection-level). Production restore'dan önce test ortamında dene.

## Maliyet (yaklaşık)
- Storage: ~0.020 USD/GB/ay (EU multi-region standard)
- Export operation: ücretsiz (Firestore tarafında okuma quotası dışında)
- 90 günlük retention + ~500MB veri = aylık ~1 USD altı
