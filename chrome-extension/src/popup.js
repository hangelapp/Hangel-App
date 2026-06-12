/**
 * hangel Chrome Extension — Popup script
 * Toolbar icon tıklanınca açılan kart. Durum gösterimi + manuel aksiyonlar.
 */

const BRANDS_STORAGE_KEY = 'hangel_brands_cache';
const DISMISSAL_STORAGE_KEY = 'hangel_dismissals';

function formatRelative(iso) {
  if (!iso) return '—';
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'az önce';
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} sa önce`;
    return `${Math.floor(h / 24)} gün önce`;
  } catch { return '—'; }
}

async function getCurrentTabHost() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    return new URL(tab.url).hostname.replace(/^www\./, '');
  } catch { return null; }
}

async function render() {
  const cache = (await chrome.storage.local.get(BRANDS_STORAGE_KEY))[BRANDS_STORAGE_KEY];
  const brands = cache?.brands || [];

  document.getElementById('brand-count').textContent = brands.length
    ? `${brands.length}`
    : 'Yükleniyor...';
  document.getElementById('last-update').textContent = formatRelative(cache?.fetchedAt);

  // Current tab match
  const host = await getCurrentTabHost();
  const currentBrandEl = document.getElementById('current-brand');
  if (!host) {
    currentBrandEl.textContent = '—';
    currentBrandEl.classList.add('match-no');
    return;
  }
  const match = brands.find((b) => {
    if (!b.domain) return false;
    const d = b.domain.replace(/^www\./, '');
    return host === d || host.endsWith(`.${d}`);
  });
  if (match) {
    currentBrandEl.textContent = `${match.name} (%${match.donationRate})`;
    currentBrandEl.classList.add('match-yes');
    currentBrandEl.classList.remove('match-no');
  } else {
    currentBrandEl.textContent = 'Kayıtlı değil';
    currentBrandEl.classList.add('match-no');
    currentBrandEl.classList.remove('match-yes');
  }
}

document.getElementById('btn-open-hangel').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://hangel.org.tr' });
});

document.getElementById('btn-refresh').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.textContent = 'Güncelleniyor...';
  btn.disabled = true;
  await chrome.runtime.sendMessage({ type: 'REFRESH_BRANDS' });
  await render();
  btn.textContent = 'Markaları güncelle';
  btn.disabled = false;
});

document.getElementById('btn-clear-dismissals').addEventListener('click', async () => {
  await chrome.storage.local.set({ [DISMISSAL_STORAGE_KEY]: {} });
  const btn = document.getElementById('btn-clear-dismissals');
  btn.textContent = '✓ Sıfırlandı';
  setTimeout(() => { btn.textContent = 'Tüm "bir daha sorma" kayıtlarını sıfırla'; }, 1500);
});

render();
