'use client';

/**
 * Native (Capacitor) dosya kaydet/paylaş — TEK kaynak.
 *
 * Neden bu yardımcı var (2026-07-11, "sertifika önizleme/indirme app'te hata
 * veriyor" kökü):
 * - `Browser.open({ url: file://... })` iOS SFSafariViewController ve Android
 *   Custom Tabs'ta ÇALIŞMAZ — yalnız http/https kabul ederler → önizleme her
 *   native cihazda hata veriyordu. file:// URL'i Browser'a VERME.
 * - `Directory.Documents`'a yazmak Android 11+'ta scoped storage nedeniyle
 *   izin hatası fırlatır → indirme Android'de hata veriyordu.
 *
 * Doğru desen: Directory.Cache'e yaz (iki platformda da izinsiz yazılır) +
 * sistem paylaşım sayfasını aç — kullanıcı oradan "Dosyalara kaydet /
 * İndirilenler / Yazdır / başka uygulamada aç" seçer.
 */

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(((reader.result as string) || '').split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export async function saveAndShareFileNative(
  blob: Blob,
  filename: string,
  opts: { title?: string; text?: string; dialogTitle?: string } = {},
): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const base64 = await blobToBase64(blob);
  const written = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  });
  try {
    await Share.share({
      title: opts.title || filename,
      text: opts.text,
      url: written.uri,
      dialogTitle: opts.dialogTitle || 'Kaydet veya paylaş',
    });
  } catch {
    // kullanıcı paylaşım sayfasını kapattı — hata değil
  }
}

/**
 * Blob indir — platform-farkında TEK kapı. Native'de Cache + paylaşım sayfası;
 * web'de <a download>. `<a download>` (ve jsPDF `pdf.save()`, o da anchor
 * kullanır) native WebView'de SESSİZCE hiçbir şey yapmaz — app'te "buton
 * çalışmıyor" şikayetlerinin ana kaynağı. Yeni indirme yazarken bunu kullan.
 */
export async function downloadBlobSmart(
  blob: Blob,
  filename: string,
  opts: { title?: string; text?: string; dialogTitle?: string } = {},
): Promise<void> {
  const { isNativeApp } = await import('@/lib/capacitor');
  if (isNativeApp()) {
    await saveAndShareFileNative(blob, filename, opts);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* yok say */ } }, 1500);
}

/** canvas.toDataURL çıktısını indir — downloadBlobSmart'ın data-URL sarmalayıcısı. */
export async function downloadDataUrlSmart(
  dataUrl: string,
  filename: string,
  opts: { title?: string; text?: string; dialogTitle?: string } = {},
): Promise<void> {
  const blob = await (await fetch(dataUrl)).blob();
  await downloadBlobSmart(blob, filename, opts);
}
