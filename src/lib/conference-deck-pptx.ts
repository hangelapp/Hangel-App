/**
 * Konferans sunumunu (mevcut slaytlardan) PowerPoint (.pptx) olarak üretir.
 * SUNUCU TARAFI — pptxgenjs ESM build'i node:fs/node:https import ettiği için
 * istemci bundle'ında derlenemez; bu yüzden /api/conference-deck/pptx route'undan
 * çağrılır ve nodebuffer döner. hangel renk kartelası: Mercan #f34723,
 * koyu koral #c5391b, Gece Siyahı #1f1f1f, Lacivert #042654, Açık Gri #f1f1f1.
 */
import PptxGenJS from 'pptxgenjs';
import QRCode from 'qrcode';
import { type Slide, DEFAULT_QR_CAPTION_CLOSING, DEFAULT_QR_CAPTION_THANKS } from './conference-deck';

const C = {
  CORAL: 'F34723', DARK: 'C5391B', INK: '1F1F1F', NAVY: '042654',
  LIGHT: 'F1F1F1', WHITE: 'FFFFFF', GRAY: '86868B', TINT: 'FFE3DA',
};
const W = 13.333, H = 7.5, M = 0.85;

export async function buildDeckPptxBuffer(slides: Slide[]): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 inch (16:9)
  pptx.author = 'hangel';
  pptx.company = 'hangel';
  pptx.title = 'STK Gelir Modeli Oluşturma ve Sürdürülebilirlik';

  const qrCache = new Map<string, string>();
  const qr = async (url: string) => {
    if (!qrCache.has(url)) {
      qrCache.set(url, await QRCode.toDataURL(url, { margin: 1, width: 420, color: { dark: '#1f1f1f', light: '#ffffff' } }));
    }
    return qrCache.get(url) as string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wm = (slide: any, color: string) => slide.addText('hangel', { x: M, y: H - 0.82, w: 4, h: 0.5, fontSize: 16, bold: true, color });
  const bullets = (arr: string[]) => arr.map((t) => ({ text: t, options: { breakLine: true } }));
  const lines = (arr: string[]) => arr.map((t) => ({ text: t, options: { breakLine: true } }));

  for (const s of slides) {
    const slide = pptx.addSlide();

    if (s.kind === 'title') {
      slide.background = { color: C.CORAL };
      if (s.eyebrow) slide.addText(s.eyebrow, { x: M, y: 1.5, w: W - 2 * M, h: 0.5, fontSize: 18, bold: true, color: C.WHITE, charSpacing: 3 });
      slide.addText(s.title, { x: M, y: 2.0, w: W - 2 * M, h: 3.2, fontSize: 52, bold: true, color: C.WHITE, lineSpacingMultiple: 0.95, valign: 'top' });
      if (s.sub) slide.addText(s.sub, { x: M, y: 5.4, w: W - 2 * M, h: 0.8, fontSize: 24, color: C.WHITE });
      if (s.foot) slide.addText(s.foot, { x: M, y: H - 0.95, w: W - 2 * M, h: 0.7, fontSize: 12, color: C.WHITE, transparency: 25 });
      wm(slide, C.WHITE);
    } else if (s.kind === 'section') {
      slide.background = { color: C.CORAL };
      slide.addText(s.num, { x: M, y: 1.9, w: W - 2 * M, h: 2.4, fontSize: 130, bold: true, color: C.WHITE });
      slide.addText(s.name, { x: M, y: 4.6, w: W - 2 * M, h: 1, fontSize: 40, bold: true, color: C.WHITE });
      wm(slide, C.WHITE);
    } else if (s.kind === 'body') {
      slide.background = { color: C.WHITE };
      if (s.eyebrow) slide.addText(s.eyebrow, { x: M, y: 0.9, w: W - 2 * M, h: 0.5, fontSize: 16, bold: true, color: C.CORAL, charSpacing: 3 });
      slide.addText(s.title, { x: M, y: 1.45, w: W - 2 * M, h: 2.1, fontSize: 44, bold: true, color: C.INK, lineSpacingMultiple: 0.98, valign: 'top' });
      slide.addText(lines(s.lines || []), { x: M, y: 3.8, w: W - 2 * M, h: 2.6, fontSize: 23, color: '444444', lineSpacingMultiple: 1.2, valign: 'top' });
      wm(slide, C.GRAY);
    } else if (s.kind === 'stats') {
      slide.background = { color: C.WHITE };
      slide.addText(s.title, { x: M, y: 0.85, w: W - 2 * M, h: 0.9, fontSize: 34, bold: true, color: C.INK });
      if (s.intro) slide.addText(s.intro, { x: M, y: 1.75, w: W - 2 * M, h: 0.8, fontSize: 18, color: C.GRAY });
      const n = Math.max(1, s.stats.length);
      const colW = (W - 2 * M) / n;
      s.stats.forEach((st, idx) => {
        const x = M + idx * colW;
        slide.addText(st.big, { x, y: 2.9, w: colW, h: 1.3, fontSize: 60, bold: true, color: C.CORAL, align: 'center' });
        slide.addText(st.label, { x: x + 0.15, y: 4.25, w: colW - 0.3, h: 1.2, fontSize: 16, color: C.INK, align: 'center', valign: 'top' });
      });
      if (s.foot) slide.addText(s.foot, { x: M, y: H - 1.25, w: W - 2 * M, h: 0.7, fontSize: 14, italic: true, color: C.GRAY });
      wm(slide, C.GRAY);
    } else if (s.kind === 'list') {
      const hero = !!s.hero;
      slide.background = { color: hero ? C.CORAL : C.WHITE };
      const fg = hero ? C.WHITE : C.INK;
      slide.addText(s.title, { x: M, y: 0.85, w: W - 2 * M, h: 0.9, fontSize: 36, bold: true, color: fg });
      let y = 1.85;
      if (s.intro) { slide.addText(s.intro, { x: M, y, w: W - 2 * M, h: 0.9, fontSize: 18, color: hero ? C.TINT : C.GRAY }); y += 0.95; }
      slide.addText(bullets(s.items), { x: M, y, w: W - 2 * M, h: H - y - 1.1, fontSize: 21, color: fg, lineSpacingMultiple: 1.25, valign: 'top', bullet: { code: '2022', indent: 18 } });
      if (s.foot) slide.addText(s.foot, { x: M, y: H - 1.1, w: W - 2 * M, h: 0.6, fontSize: 14, italic: true, color: hero ? C.TINT : C.GRAY });
      wm(slide, hero ? C.WHITE : C.GRAY);
    } else if (s.kind === 'flow') {
      slide.background = { color: C.WHITE };
      slide.addText(s.title, { x: M, y: 0.85, w: W - 2 * M, h: 0.9, fontSize: 36, bold: true, color: C.INK });
      if (s.intro) slide.addText(s.intro, { x: M, y: 1.8, w: W - 2 * M, h: 0.8, fontSize: 18, color: C.GRAY });
      slide.addText((s.steps || []).join('    →    '), { x: M, y: 3.2, w: W - 2 * M, h: 1.8, fontSize: 26, bold: true, color: C.CORAL, align: 'center', valign: 'middle', lineSpacingMultiple: 1.4 });
      wm(slide, C.GRAY);
    } else if (s.kind === 'research') {
      slide.background = { color: C.WHITE };
      slide.addText(`Araştırma ${s.n} · ${s.year}`, { x: M, y: 0.8, w: W - 2 * M, h: 0.5, fontSize: 16, bold: true, color: C.CORAL, charSpacing: 2 });
      slide.addText(s.paper, { x: M, y: 1.3, w: W - 2 * M, h: 1.25, fontSize: 24, bold: true, color: C.INK, lineSpacingMultiple: 1, valign: 'top' });
      slide.addText(`${(s.authors || []).join(', ')} — ${(s.unis || []).join(' · ')}`, { x: M, y: 2.6, w: W - 2 * M, h: 0.6, fontSize: 13, italic: true, color: C.GRAY });
      slide.addText(bullets(s.finding || []), { x: M, y: 3.3, w: W - 2 * M, h: 1.5, fontSize: 19, color: C.INK, lineSpacingMultiple: 1.15, valign: 'top', bullet: { code: '2022', indent: 18 } });
      if (s.highlight) {
        slide.addShape(pptx.ShapeType.roundRect, { x: M, y: 5.05, w: W - 2 * M, h: 1.45, fill: { color: C.CORAL }, rectRadius: 0.12 });
        slide.addText(s.highlight, { x: M + 0.35, y: 5.1, w: W - 2 * M - 0.7, h: 1.35, fontSize: 16, bold: true, color: C.WHITE, valign: 'middle' });
      }
      wm(slide, C.GRAY);
    } else if (s.kind === 'closing') {
      slide.background = { color: C.CORAL };
      const tw = s.qr ? W - 4.6 : W - 2 * M;
      slide.addText(s.title, { x: M, y: 1.3, w: tw, h: 2.4, fontSize: 50, bold: true, color: C.WHITE, lineSpacingMultiple: 0.95, valign: 'top' });
      slide.addText(lines(s.lines || []), { x: M, y: 4.0, w: tw, h: 2.2, fontSize: 23, color: C.WHITE, lineSpacingMultiple: 1.2, valign: 'top' });
      if (s.qr) {
        slide.addImage({ data: await qr(s.qr), x: W - 3.7, y: 1.9, w: 2.7, h: 2.7 });
        slide.addText(s.qrCaption || DEFAULT_QR_CAPTION_CLOSING, { x: W - 4.3, y: 4.65, w: 3.9, h: 0.5, fontSize: 14, bold: true, color: C.WHITE, align: 'center' });
        slide.addText(s.qr.replace(/^https?:\/\//, ''), { x: W - 4.3, y: 5.12, w: 3.9, h: 0.4, fontSize: 11, color: C.TINT, align: 'center' });
      }
      wm(slide, C.WHITE);
    } else if (s.kind === 'thanks') {
      slide.background = { color: C.CORAL };
      slide.addText(s.title, { x: M, y: s.qr ? 1.5 : 2.6, w: W - 2 * M, h: 1.6, fontSize: 68, bold: true, color: C.WHITE, align: 'center' });
      if (s.sub) slide.addText(s.sub, { x: M, y: s.qr ? 3.0 : 4.2, w: W - 2 * M, h: 0.8, fontSize: 22, color: C.WHITE, align: 'center' });
      if (s.qr) {
        slide.addImage({ data: await qr(s.qr), x: (W - 2.4) / 2, y: 3.85, w: 2.4, h: 2.4 });
        slide.addText(s.qrCaption || DEFAULT_QR_CAPTION_THANKS, { x: M, y: 6.35, w: W - 2 * M, h: 0.5, fontSize: 14, bold: true, color: C.WHITE, align: 'center' });
      }
    }
  }

  return (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
}
