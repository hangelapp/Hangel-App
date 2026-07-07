/**
 * hangel Chrome Extension — Content Script
 *
 * Çalıştığı zaman: her sayfa yüklendiğinde (run_at: document_idle).
 *
 * Akış:
 *   1. chrome.storage.local'den brand cache'ini oku
 *   2. Current tab hostname'i ile brand.domain match'le
 *   3. Eşleşme varsa + 30 gün içinde dismiss edilmediyse popart toast inject et
 *   4. "Yapsın" → background.js'e OPEN_AFFILIATE mesajı → tab affiliate URL'e yenilenir
 *   5. "Sonra" → toast kapanır (sayfayı kapatınca tekrar gelir)
 *   6. "Bir daha sorma" → 30 gün dismiss kaydedilir
 *
 * Privacy: brand match TAMAMEN local. Tab URL hangel.org'ye GİTMEZ.
 * Sadece kullanıcı "Yapsın" derse o anki brandId gönderilir.
 */

(() => {
  const BRANDS_STORAGE_KEY = 'hangel_brands_cache';
  const DISMISSAL_STORAGE_KEY = 'hangel_dismissals';
  const DISMISS_DAYS = 30;
  const TOAST_ID = 'hangel-popart-toast';

  // Sayfa zaten hangel.org ise hiçbir şey yapma
  if (window.location.hostname.endsWith('hangel.org')) return;

  // Zaten toast inject edildi mi?
  if (document.getElementById(TOAST_ID)) return;

  const hostname = window.location.hostname.replace(/^www\./, '');

  function findMatchingBrand(brands, host) {
    if (!Array.isArray(brands)) return null;
    return brands.find((b) => {
      if (!b.domain) return false;
      const d = b.domain.replace(/^www\./, '');
      return host === d || host.endsWith(`.${d}`);
    }) || null;
  }

  function isDismissed(dismissals, brandId) {
    if (!dismissals || typeof dismissals !== 'object') return false;
    const ts = dismissals[brandId];
    if (!ts) return false;
    const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return ageDays < DISMISS_DAYS;
  }

  function injectToast(brand) {
    const toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.className = 'hangel-toast';
    toast.innerHTML = `
      <div class="hangel-toast-inner">
        <button class="hangel-close" aria-label="Kapat">×</button>
        <div class="hangel-header">
          <img class="hangel-logo" src="${chrome.runtime.getURL('icons/icon-48.png')}" alt="hangel" />
          <div class="hangel-headtext">
            <div class="hangel-title">hangel</div>
            <div class="hangel-subtitle">
              <strong>${escapeHtml(brand.name)}</strong> alışverişini bir bağışa dönüştür.
            </div>
          </div>
        </div>
        <div class="hangel-rate">
          Tutarın <strong>%${brand.donationRate}</strong>’i seçtiğin derneklere bağış olur
        </div>
        <div class="hangel-actions">
          <button class="hangel-btn-yes">Bağışa Dönüştür</button>
          <button class="hangel-btn-later">Şimdi Değil</button>
          <button class="hangel-btn-never">Bu sitede bir daha sorma</button>
        </div>
      </div>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('hangel-show'));

    toast.querySelector('.hangel-close').addEventListener('click', () => dismissToast(toast));
    toast.querySelector('.hangel-btn-later').addEventListener('click', () => dismissToast(toast));
    toast.querySelector('.hangel-btn-never').addEventListener('click', async () => {
      const cur = await chrome.storage.local.get(DISMISSAL_STORAGE_KEY);
      const dismissals = cur[DISMISSAL_STORAGE_KEY] || {};
      dismissals[brand.id] = Date.now();
      await chrome.storage.local.set({ [DISMISSAL_STORAGE_KEY]: dismissals });
      dismissToast(toast);
    });
    toast.querySelector('.hangel-btn-yes').addEventListener('click', () => {
      toast.classList.add('hangel-loading');
      chrome.runtime.sendMessage(
        { type: 'OPEN_AFFILIATE', brandId: brand.id },
        (resp) => {
          if (chrome.runtime.lastError || !resp?.ok) {
            console.error('[hangel] click failed', chrome.runtime.lastError || resp);
            toast.classList.remove('hangel-loading');
            alert('hangel: affiliate link alınamadı. Lütfen tekrar dene.');
          }
        },
      );
    });
  }

  function dismissToast(toast) {
    toast.classList.remove('hangel-show');
    setTimeout(() => toast.remove(), 400);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // Opsiyonel debug: localStorage.setItem('hangel_debug','1') ile aç
  let debug = false;
  try { debug = localStorage.getItem('hangel_debug') === '1'; } catch { /* iframe / sandbox */ }

  // Main flow
  chrome.storage.local.get([BRANDS_STORAGE_KEY, DISMISSAL_STORAGE_KEY]).then(({
    [BRANDS_STORAGE_KEY]: cache,
    [DISMISSAL_STORAGE_KEY]: dismissals,
  }) => {
    const brand = findMatchingBrand(cache?.brands, hostname);
    if (debug) {
      const brandCount = Array.isArray(cache?.brands) ? cache.brands.length : 0;
      console.log('[hangel] domain check:', {
        hostname,
        brandCount,
        matched: brand ? { id: brand.id, name: brand.name, domain: brand.domain } : null,
        dismissed: brand ? isDismissed(dismissals, brand.id) : false,
      });
    }
    if (!brand) return;
    if (isDismissed(dismissals, brand.id)) return;
    injectToast(brand);
  }).catch((err) => console.error('[hangel] content init failed:', err));
})();
