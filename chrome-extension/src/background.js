/**
 * hangel Chrome Extension — Background Service Worker
 *
 * Sorumluluklar:
 *   1. Brand list cache: hangel.org/api/extension/brands çekip
 *      chrome.storage.local'e yazar. TTL = 1 saat.
 *   2. Auth state: chrome.storage.local'de hangel_user_token tutar.
 *      Login flow: popup → "Giriş Yap" → yeni sekme açılır → callback'te
 *      postMessage ile token gelir.
 *   3. Content script ↔ click handling: content.js'den gelen
 *      "openAffiliate" mesajını alır, /api/extension/click endpoint'ini
 *      çağırır, tab URL'ini affiliate link ile günceller.
 *
 * Privacy: browsing history asla server'a gönderilmez. Sadece kullanıcı
 * "Yapsın" tıkladığında o anki brandId hangel'e gider.
 */

const API_BASE = 'https://hangel.org';
const BRANDS_REFRESH_INTERVAL_MIN = 60;
const BRANDS_STORAGE_KEY = 'hangel_brands_cache';

// ── Brand list cache ─────────────────────────────────────────────────────────

async function refreshBrandsCache() {
  try {
    const res = await fetch(`${API_BASE}/api/extension/brands`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data?.brands)) throw new Error('Invalid response');
    await chrome.storage.local.set({
      [BRANDS_STORAGE_KEY]: {
        brands: data.brands,
        fetchedAt: new Date().toISOString(),
        version: data.version || 1,
      },
    });
    console.log(`[hangel] ${data.brands.length} marka cache'e yazıldı`);
  } catch (err) {
    console.error('[hangel] brand cache refresh failed:', err);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[hangel] extension installed');
  await refreshBrandsCache();
  chrome.alarms.create?.('refreshBrands', { periodInMinutes: BRANDS_REFRESH_INTERVAL_MIN });
});

chrome.runtime.onStartup.addListener(async () => {
  await refreshBrandsCache();
});

if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'refreshBrands') refreshBrandsCache();
  });
}

// ── Click handler: content script "Yapsın" mesajı ────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'OPEN_AFFILIATE' && typeof msg.brandId === 'string') {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/extension/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId: msg.brandId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const tabId = sender?.tab?.id;
        if (data.affiliateUrl && tabId) {
          await chrome.tabs.update(tabId, { url: data.affiliateUrl });
        }
        sendResponse({ ok: true, brandName: data.brandName, donationRate: data.donationRate });
      } catch (err) {
        console.error('[hangel] affiliate click failed:', err);
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true; // async response
  }
  // Google arama sayfasından: markayı YENİ SEKMEDE aç (arama sayfası kalsın).
  if (msg?.type === 'OPEN_AFFILIATE_NEWTAB' && typeof msg.brandId === 'string') {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/extension/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId: msg.brandId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.affiliateUrl) await chrome.tabs.create({ url: data.affiliateUrl });
        sendResponse({ ok: true, brandName: data.brandName, donationRate: data.donationRate });
      } catch (err) {
        console.error('[hangel] google affiliate open failed:', err);
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true;
  }
  if (msg?.type === 'GET_BRANDS') {
    chrome.storage.local.get(BRANDS_STORAGE_KEY).then((data) => {
      sendResponse({ brands: data[BRANDS_STORAGE_KEY]?.brands || [] });
    });
    return true;
  }
  if (msg?.type === 'REFRESH_BRANDS') {
    refreshBrandsCache().then(() => sendResponse({ ok: true }));
    return true;
  }
});
