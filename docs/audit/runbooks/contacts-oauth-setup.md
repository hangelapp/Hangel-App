# Runbook — E-posta Kişi İçe Aktarma OAuth Kurulumu (PDF-13b)

`/invite` ve `/ngo-admin/qr` sayfalarındaki **Gmail** ve **Outlook** butonları, sunucu
tarafı OAuth ile kullanıcının kişilerini içe aktarır (Google People API + Microsoft
Graph). Bu runbook, OAuth client'larını oluşturma ve env var'larını doldurma adımlarını
verir. Token'lar hiçbir zaman saklanmaz — tek seferlik okuma yapılır.

## Akış özeti

```
Kullanıcı "Gmail/Outlook ile bağlan" tıklar
  → POST /api/contacts/{provider}/start  (Firebase ID token ile auth)
  → sunucu signed `state` + httpOnly cookie üretir, authorizeUrl döner
  → popup provider consent ekranını açar
  → provider GET /api/contacts/{provider}/callback?code=&state= adresine döner
  → sunucu state'i doğrular (HMAC + exp + double-submit cookie)
  → code → access token exchange (server-side)
  → People API / Graph ile kişiler çekilir, normalize edilir (max 2000)
  → callback HTML'i window.opener.postMessage ile kişileri döner, popup kapanır
  → access token discard edilir (persist YOK, log YOK)
```

## Kayıt edilecek redirect URI'lar

| Provider | Redirect URI |
|---|---|
| Google | `https://hangel.org.tr/api/contacts/google/callback` |
| Microsoft | `https://hangel.org.tr/api/contacts/microsoft/callback` |

> Lokal test için ek olarak `http://localhost:3000/api/contacts/{provider}/callback`
> da eklenebilir (Google birden çok redirect URI'ya izin verir; Azure de öyle).
> redirect_uri sunucuda `req.nextUrl.origin`'den türetilir — domain'iniz neyse onu
> kayıt edin.

---

## 1) Google (Gmail) — GCP Console

1. **Google Cloud Console** → doğru projeyi seç (`hangel-new-v18-...`).
2. **APIs & Services → Library** → "People API" ara → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External** (yayında ise Publishing status = In production).
   - Scopes → **Add or remove scopes** → şu scope'u ekle:
     `https://www.googleapis.com/auth/contacts.readonly`
   - Test aşamasındaysa test kullanıcılarını ekle.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs:
     `https://hangel.org.tr/api/contacts/google/callback`
   - **Create** → açılan diyalogdan **Client ID** ve **Client secret**'i kopyala.
5. Env var'lara yaz:
   - `GOOGLE_CONTACTS_CLIENT_ID` = Client ID
   - `GOOGLE_CONTACTS_CLIENT_SECRET` = Client secret

---

## 2) Microsoft (Outlook / Hotmail) — Azure Portal

1. **Azure Portal → Microsoft Entra ID → App registrations → New registration**:
   - Name: `Hangel Contacts Import` (serbest).
   - Supported account types: **Accounts in any organizational directory and
     personal Microsoft accounts** (common tenant için).
   - Redirect URI: Platform **Web**, değer:
     `https://hangel.org.tr/api/contacts/microsoft/callback`
   - **Register**.
2. Uygulama sayfasında **Application (client) ID**'yi kopyala.
3. **API permissions → Add a permission → Microsoft Graph → Delegated permissions**
   → **Contacts.Read** ekle. (Gerekirse "Grant admin consent".)
4. **Certificates & secrets → Client secrets → New client secret** → açıklama + süre
   seç → **Add** → **Value** sütunundaki secret'i hemen kopyala (bir daha gösterilmez).
5. Env var'lara yaz:
   - `MICROSOFT_CONTACTS_CLIENT_ID` = Application (client) ID
   - `MICROSOFT_CONTACTS_CLIENT_SECRET` = client secret **Value**
   - `MICROSOFT_TENANT` = `common` (personal + work/school) ya da tek-tenant ID'si

---

## 3) State imza secret'i

CSRF korumalı `state` token'ı imzalamak için rastgele bir secret üret:

```bash
openssl rand -hex 32
```

Çıktıyı `OAUTH_STATE_SECRET` env var'ına yaz (en az 16 karakter; 32+ önerilir).
Bu secret olmadan `start` route 503 `OAUTH_NOT_CONFIGURED` döner.

---

## 4) Env var özeti (App Hosting / `apphosting.yaml` secret'leri)

| Var | Kaynak |
|---|---|
| `GOOGLE_CONTACTS_CLIENT_ID` | GCP OAuth client ID |
| `GOOGLE_CONTACTS_CLIENT_SECRET` | GCP OAuth client secret |
| `MICROSOFT_CONTACTS_CLIENT_ID` | Azure Application (client) ID |
| `MICROSOFT_CONTACTS_CLIENT_SECRET` | Azure client secret Value |
| `MICROSOFT_TENANT` | `common` (default) veya tenant ID |
| `OAUTH_STATE_SECRET` | `openssl rand -hex 32` |

> Bunlar **server-side secret**'lerdir — `NEXT_PUBLIC_*` YAPMAYIN. Client'a hiç
> gönderilmez. App Hosting'de `apphosting.yaml` secret referansları veya Secret
> Manager üzerinden bağlanır (devops-lead wiring).

## 5) Doğrulama

- Env set edilmeden: Gmail/Outlook tıkla → friendly "Yakında" toast (crash yok).
- Env set edildikten sonra: Gmail/Outlook tıkla → consent ekranı açılır → izin ver →
  popup kapanır, kişiler davet listesini doldurur.
- Hatalı/eksik consent: "Doğrulama başarısız" sayfası + hata toast'u.

## Geri alma

- OAuth client'larını GCP/Azure'da silmek/disable etmek yeterli.
- Env var'ları boşaltırsanız route 503 friendly toast'a döner.
- Tam kod kaldırma: bkz. `docs/audit/decisions.md` 2026-05-21 PDF-13b Rollback maddesi.
