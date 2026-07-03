/**
 * hangel — Google arama sayfası content script'i (Rakuten/Honey benzeri).
 *
 * Kullanıcı Google'da bir PARTNER markayı arayınca, sonuçların üstünde Apple
 * kimliğinde bir hangel kartı çıkar: "{marka} alışverişini bağışa çevir".
 * "Bağışa Çevir" → markanın hangel affiliate linki YENİ SEKMEDE açılır; komisyon
 * seçtiğin derneklere bağış olur. Gizlilik: yalnız sonuç linkleri lokal taranır.
 */
(() => {
  const BRANDS_STORAGE_KEY = 'hangel_brands_cache';
  const DISMISS_KEY = 'hangel_google_dismissed_at';
  const TIP_ID = 'hangel-google-tip';

  if (!/\/search/.test(location.pathname)) return;
  if (document.getElementById(TIP_ID)) return;

  const normHost = (h) => (h || '').replace(/^www\./, '').toLowerCase();

  function findBrandInResults(brands) {
    if (!Array.isArray(brands) || !brands.length) return null;
    const domains = brands
      .map((b) => ({ b, d: normHost(b.domain) }))
      .filter((x) => x.d);
    const anchors = document.querySelectorAll('#search a[href^="http"], #rso a[href^="http"], a[href^="http"]');
    for (const a of anchors) {
      let host;
      try { host = normHost(new URL(a.href).hostname); } catch { continue; }
      if (!host || host.includes('google.')) continue;
      const hit = domains.find((x) => host === x.d || host.endsWith('.' + x.d));
      if (hit) return hit.b;
    }
    return null;
  }

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function close(el) {
    el.classList.remove('hangel-show');
    setTimeout(() => el.remove(), 400);
  }

  function injectTip(brand) {
    const el = document.createElement('div');
    el.id = TIP_ID;
    el.className = 'hangel-toast';
    el.innerHTML = `
      <div class="hangel-toast-inner">
        <button class="hangel-close" aria-label="Kapat">×</button>
        <div class="hangel-header">
          <img class="hangel-logo" src="${chrome.runtime.getURL('icons/icon-48.png')}" alt="hangel" />
          <div class="hangel-headtext">
            <div class="hangel-title">hangel</div>
            <div class="hangel-subtitle"><strong>${escapeHtml(brand.name)}</strong> alışverişini bir bağışa çevir.</div>
          </div>
        </div>
        <div class="hangel-rate">Tutarın <strong>%${brand.donationRate}</strong>’i seçtiğin derneklere bağış olur</div>
        <div class="hangel-actions">
          <button class="hangel-btn-yes">Bağışa Çevir</button>
          <button class="hangel-btn-later">Şimdi Değil</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('hangel-show'));

    el.querySelector('.hangel-close').addEventListener('click', () => close(el));
    el.querySelector('.hangel-btn-later').addEventListener('click', () => close(el));
    el.querySelector('.hangel-btn-yes').addEventListener('click', () => {
      el.classList.add('hangel-loading');
      chrome.runtime.sendMessage({ type: 'OPEN_AFFILIATE_NEWTAB', brandId: brand.id }, (resp) => {
        if (chrome.runtime.lastError || !resp?.ok) {
          el.classList.remove('hangel-loading');
        } else {
          close(el);
        }
      });
    });
  }

  chrome.storage.local.get([BRANDS_STORAGE_KEY, DISMISS_KEY]).then(({ [BRANDS_STORAGE_KEY]: cache }) => {
    const brand = findBrandInResults(cache?.brands);
    if (brand) injectTip(brand);
  });
})();
