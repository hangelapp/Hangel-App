# Runbook: Vakıf/Dernek Registry (Kütük) Import

**Feature:** Corporate registration auto-fill from government registry data
**Owner:** operator (executes), backend-lead (verifies)
**Risk:** L (idempotent for dernekler; reversible for vakıflar by clearing the collection)
**When to run:** Once to seed `registryDernekler` + `registryVakiflar`, then again
whenever the source sheets are refreshed.

---

## Background

Two government registry datasets exist as Google Sheets. We export them to CSV and
import them into Firestore so the corporate registration form can look up an org and
auto-fill its info.

- **DERNEKLER** → collection `registryDernekler`, doc id = trimmed **Kütük No**
  (e.g. `06-154-120`). Looked up by kütük number.
- **VAKIFLAR** → collection `registryVakiflar`, doc id = auto. No kütük column, so
  vakıflar are looked up by **name** (`nameLower`).

Source sheets:

- Dernekler: https://docs.google.com/spreadsheets/d/1Nu6nLi_dy4tVMXOpw7k9Y5U2FC53kukn/
- Vakıflar:  https://docs.google.com/spreadsheets/d/1taZvzvUDsT9nmaAuxMI91iIsjxVrwxHj/

## Step 1 — Export each sheet to CSV

In each sheet: **File ▸ Download ▸ Comma-separated values (.csv)**.

Save them next to the repo (or anywhere) with these names so the commands below match:

- `dernekler.csv`  — headers (in order):
  `Sıra No, Faaliyet Alanı, Detaylı Faaliyet Alanı, Kurum Adı, Kütük No, Kuruluş Tarihi, Web Site, Kurum Adresi`
- `vakiflar.csv`   — headers (in order):
  `VAKIF ADI, ADRES, İL, İLÇE, TELEFON-1, TELEFON-2, E-TEBLİGAT ADRESİ, E-POSTA`

The parser is header-driven and quote-aware (addresses contain commas), so the exact
column order is not load-bearing as long as the header names match.

## Step 2 — Authenticate (ADC)

```sh
gcloud auth application-default login
gcloud auth application-default print-access-token | head -c 12 ; echo
```

The script targets project `hangel-new-v18-87297865-9bcc3` (hardcoded).

## Step 3 — Dry run (no writes)

```sh
node scripts/import-registry.mjs --dernekler ./dernekler.csv --vakiflar ./vakiflar.csv --dry
```

Check the printed counts:

```
[import-registry] dernekler parsed=… eligible=… skipped=…
[import-registry] vakiflar  parsed=… eligible=… skipped=…
```

`skipped` for dernekler = rows with empty Kütük No or empty name (plus DERBİS test
rows if you pass `--skip-test`). `skipped` for vakıflar = rows with empty name.

To also drop obvious DERBİS test dernekler:

```sh
node scripts/import-registry.mjs --dernekler ./dernekler.csv --vakiflar ./vakiflar.csv --skip-test --dry
```

## Step 4 — Real import

```sh
node scripts/import-registry.mjs --dernekler ./dernekler.csv --vakiflar ./vakiflar.csv
```

Writes are batched (≤450 per commit). Progress is logged per batch.

## Step 5 — Deploy rules

`registryDernekler` / `registryVakiflar` are public-read, no-client-write. Deploy the
updated rules so the registration form can query them pre-auth:

```sh
firebase deploy --only firestore:rules
```

## Verify

1. Spot-check a known kütük no in Firestore Console: `registryDernekler/06-154-120`
   should hold `{ name, faaliyetAlani, foundedYear, adres, type: 'Dernek', nameLower, … }`.
2. Spot-check a vakıf doc: `{ name, nameLower, il, ilce, telefon1, type: 'Vakıf', … }`,
   with `-` placeholders normalized to empty strings.
3. From the corporate registration form (pre-auth), confirm a lookup returns the org.

## ⚠️ Vakıflar re-run caveat

- **Dernekler are idempotent:** doc id = kütük no, so re-running OVERWRITES in place.
  Safe to re-run any number of times.
- **Vakıflar use auto-ids:** re-running APPENDS duplicates. To re-import cleanly,
  **clear `registryVakiflar` first**, then re-run. Mirror the batched-delete pattern
  in `scripts/delete-all-ngos.js` (point it at `registryVakiflar`), or delete the
  collection from the Firestore Console before running the import again.

## Notes

- No new npm dependencies — the script ships its own quote-aware CSV parser.
- The script reads ADC credentials only when actually writing; `--dry` does not need
  Firestore access for the write phase (it still reads the CSV files).
