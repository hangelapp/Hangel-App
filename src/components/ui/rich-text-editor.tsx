'use client';

/**
 * Tiptap tabanlı zengin metin editörü (WYSIWYG).
 *
 * Eski sürüm contentEditable + document.execCommand ile çalışıyordu; execCommand
 * deprecated olduğundan silme davranışı bozuk, renk/highlight çalışmıyor, link
 * otomatik değil, imleç yönetimi kırılgandı. Bu sürüm Tiptap (ProseMirror)
 * kullanır: sağlam seçim/silme, otomatik link (mavi), metin rengi, zemin
 * (highlight) rengi, görsel yükleme, değişken ({token}) ekleme ve HTML modu.
 *
 * API mevcut çağıranlarla (mail sihirbazı vb.) birebir uyumludur:
 *   value / onChange / placeholder / className / minHeight /
 *   enableImageUpload / imageUploadPath / variableButtons
 * Ek olarak:
 *   signatures — kaydedilmiş imzalar; editöre tek tıkla eklenir (çoklu imza).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
    Heading2, Heading3, Link2, Unlink, Quote, Eraser, Code2,
    ImagePlus, Loader2, Baseline, Highlighter, PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Değişken (placeholder) ekleme butonu — imlecin olduğu yere {token} yazar. */
export type VariableButton = { token: string; label: string; insert?: string };

/** Kaydedilmiş imza — editöre tek tıkla eklenir (HTML). */
export type SignatureOption = { id: string; label: string; html: string };

type RichTextEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: number;
    enableImageUpload?: boolean;
    imageUploadPath?: string;
    variableButtons?: VariableButton[];
    /** Kaydedilmiş imzalar — verilirse toolbar'da "İmza" menüsü çıkar. */
    signatures?: SignatureOption[];
};

// Metin ve zemin için Apple-tarzı, sınırlı ve uyumlu palet.
const TEXT_COLORS = [
    { name: 'Siyah', value: '#1d1d1f' },
    { name: 'Gri', value: '#6e6e73' },
    { name: 'Kırmızı (marka)', value: '#f34723' },
    { name: 'Mavi', value: '#0071e3' },
    { name: 'Yeşil', value: '#1a7f37' },
    { name: 'Mor', value: '#6e56cf' },
];
const HIGHLIGHT_COLORS = [
    { name: 'Sarı', value: '#fff3b0' },
    { name: 'Yeşil', value: '#c9f7d4' },
    { name: 'Mavi', value: '#cfe8ff' },
    { name: 'Pembe', value: '#ffd6e7' },
    { name: 'Turuncu', value: '#ffe0c2' },
];

export function RichTextEditor({
    value, onChange, placeholder, className, minHeight = 240,
    enableImageUpload = false, imageUploadPath = 'mail-images', variableButtons, signatures,
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<'visual' | 'html'>('visual');
    const [uploading, setUploading] = useState(false);
    const [htmlDraft, setHtmlDraft] = useState(value || '');

    const editor = useEditor({
        immediatelyRender: false, // Next.js SSR uyumu
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            LinkExtension.configure({
                openOnClick: false,
                autolink: true,          // yazılan/yapıştırılan URL otomatik linklenir
                linkOnPaste: true,
                HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
            }),
            ImageExtension.configure({ HTMLAttributes: { width: '600' } }),
            Placeholder.configure({ placeholder: placeholder || 'Buraya yazın...' }),
        ],
        content: value || '',
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm max-w-none px-4 py-3 outline-none focus:outline-none',
                    // Tiptap link'lerini mavi + altı çizili göster (mail görünümüyle tutarlı)
                    '[&_a]:text-[#0071e3] [&_a]:underline',
                ),
                style: `min-height:${minHeight}px`,
            },
        },
        onUpdate: ({ editor: ed }) => {
            const html = ed.getHTML();
            setHtmlDraft(html);
            onChange(html);
        },
    });

    // Dış value değişince (şablon yükleme, sıfırlama) editörü senkronla.
    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        if ((value || '') !== current) {
            editor.commands.setContent(value || '', false);
            setHtmlDraft(value || '');
        }
    }, [value, editor]);

    const insertHtml = useCallback((html: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(html).run();
    }, [editor]);

    const insertVariable = useCallback((v: VariableButton) => {
        const text = v.insert ?? `{${v.token}}`;
        if (!editor) return;
        // Değişken düz metin olarak eklenir (mail render'ında {token} değişir).
        editor.chain().focus().insertContent(text).run();
    }, [editor]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Bağlantı URL\'si:', prev || 'https://');
        if (url === null) return;            // iptal
        if (url === '' || url === 'https://') {
            editor.chain().focus().unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const handlePickImage = useCallback(() => fileInputRef.current?.click(), []);

    const handleImageSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !editor) return;
        if (!file.type.startsWith('image/')) { window.alert('Lütfen bir görsel dosyası seç (jpg, png, webp…).'); return; }
        if (file.size > 5 * 1024 * 1024) { window.alert('Görsel en fazla 5 MB olabilir.'); return; }
        setUploading(true);
        try {
            const storage = getStorage();
            const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${imageUploadPath}/${Date.now()}-${safe}`;
            const r = storageRef(storage, path);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);
            editor.chain().focus().setImage({ src: url, alt: safe }).run();
        } catch (err) {
            console.error('[rich-text-editor] görsel yükleme hatası', err);
            window.alert('Görsel yüklenemedi. Bağlantını kontrol edip tekrar dene.');
        } finally {
            setUploading(false);
        }
    }, [editor, imageUploadPath]);

    const handleClear = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().unsetAllMarks().clearNodes().run();
    }, [editor]);

    // HTML modundan görsel moda dönerken düzenlenen HTML'i editöre uygula.
    const applyHtmlDraft = useCallback(() => {
        if (!editor) return;
        editor.commands.setContent(htmlDraft || '', true);
    }, [editor, htmlDraft]);

    if (!editor) {
        return (
            <div className={cn('flex items-center justify-center rounded-2xl border bg-background', className)} style={{ minHeight }}>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className={cn('overflow-hidden rounded-2xl border bg-background', className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
                <Tb active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Kalın (⌘B)" icon={Bold} />
                <Tb active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="İtalik (⌘I)" icon={Italic} />
                <Tb active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Altı çizili (⌘U)" icon={UnderlineIcon} />
                <Sep />
                <Tb active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Başlık" icon={Heading2} />
                <Tb active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Alt başlık" icon={Heading3} />
                <Tb active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraf" iconText="P" />
                <Sep />
                <Tb active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Maddeli liste" icon={List} />
                <Tb active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Sıralı liste" icon={ListOrdered} />
                <Tb active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Alıntı" icon={Quote} />
                <Sep />
                {/* Metin rengi */}
                <ColorMenu
                    icon={Baseline}
                    title="Metin rengi"
                    colors={TEXT_COLORS}
                    onPick={(c) => editor.chain().focus().setColor(c).run()}
                    onClear={() => editor.chain().focus().unsetColor().run()}
                />
                {/* Zemin (highlight) rengi */}
                <ColorMenu
                    icon={Highlighter}
                    title="Zemin rengi"
                    colors={HIGHLIGHT_COLORS}
                    onPick={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
                    onClear={() => editor.chain().focus().unsetHighlight().run()}
                />
                <Sep />
                <Tb active={editor.isActive('link')} onClick={setLink} title="Bağlantı ekle" icon={Link2} />
                {editor.isActive('link') && (
                    <Tb onClick={() => editor.chain().focus().unsetLink().run()} title="Bağlantıyı kaldır" icon={Unlink} />
                )}
                <Tb active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Kod bloğu" icon={Code2} />
                {enableImageUpload && (
                    <Tb onClick={handlePickImage} title="Görsel ekle (bilgisayardan)" icon={uploading ? Loader2 : ImagePlus} spin={uploading} />
                )}
                <Sep />
                <Tb onClick={handleClear} title="Biçimi temizle" icon={Eraser} />

                {/* İmza menüsü */}
                {signatures && signatures.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" title="İmza ekle" className="ml-1 inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-foreground/80 transition hover:bg-muted">
                                <PenLine className="h-3.5 w-3.5" /> İmza
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-w-[280px]">
                            {signatures.map((s) => (
                                <DropdownMenuItem key={s.id} onClick={() => insertHtml(s.html)} className="text-xs">
                                    {s.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                <div className="ml-auto flex items-center gap-1">
                    <Button type="button" variant={mode === 'visual' ? 'default' : 'ghost'} size="sm" className="h-7 px-2 text-[11px]"
                        onClick={() => { if (mode === 'html') applyHtmlDraft(); setMode('visual'); }}>
                        <PenLine className="mr-1 h-3 w-3" /> Görsel
                    </Button>
                    <Button type="button" variant={mode === 'html' ? 'default' : 'ghost'} size="sm" className="h-7 px-2 text-[11px]"
                        onClick={() => { setHtmlDraft(editor.getHTML()); setMode('html'); }}>
                        <Code2 className="mr-1 h-3 w-3" /> HTML
                    </Button>
                </div>
            </div>

            {/* Değişken butonları */}
            {variableButtons && variableButtons.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 px-2 py-1.5">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Otomatik bilgi:</span>
                    {variableButtons.map((v) => (
                        <button key={v.token} type="button" title={`Ekle: ${v.insert ?? `{${v.token}}`}`} onClick={() => insertVariable(v)}
                            className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary transition hover:bg-primary/10 active:scale-95">
                            + {v.label}
                        </button>
                    ))}
                </div>
            )}

            {enableImageUpload && (
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelected} />
            )}

            {/* Gövde */}
            {mode === 'visual' ? (
                <EditorContent editor={editor} />
            ) : (
                <textarea
                    value={htmlDraft}
                    onChange={(e) => { setHtmlDraft(e.target.value); onChange(sanitizeHtml(e.target.value)); }}
                    className="w-full resize-y bg-background p-4 font-mono text-xs outline-none"
                    style={{ minHeight }}
                    placeholder="<h2>Başlık</h2>&#10;<p>Paragraf...</p>"
                />
            )}
        </div>
    );
}

function Tb({ active, onClick, title, icon: Icon, iconText, spin }: {
    active?: boolean; onClick: () => void; title: string;
    icon?: React.ComponentType<{ className?: string }>; iconText?: string; spin?: boolean;
}) {
    return (
        <button type="button" onClick={onClick} title={title} aria-label={title} aria-pressed={active}
            className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                active ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-muted hover:text-foreground',
            )}>
            {Icon ? <Icon className={cn('h-3.5 w-3.5', spin && 'animate-spin')} /> : <span className="text-xs font-bold">{iconText}</span>}
        </button>
    );
}

function ColorMenu({ icon: Icon, title, colors, onPick, onClear }: {
    icon: React.ComponentType<{ className?: string }>; title: string;
    colors: Array<{ name: string; value: string }>; onPick: (c: string) => void; onClear: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button type="button" title={title} aria-label={title}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-muted hover:text-foreground">
                    <Icon className="h-3.5 w-3.5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
                <div className="grid grid-cols-3 gap-1.5 p-1.5">
                    {colors.map((c) => (
                        <button key={c.value} type="button" title={c.name} onClick={() => onPick(c.value)}
                            className="h-8 w-full rounded-md border transition hover:scale-105"
                            style={{ backgroundColor: c.value }} aria-label={c.name} />
                    ))}
                </div>
                <DropdownMenuItem onClick={onClear} className="text-xs text-muted-foreground">Rengi kaldır</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function Sep() {
    return <div className="mx-1 h-5 w-px bg-border" />;
}

// Editor tipini dışarı aç (gerekebilir).
export type { Editor as RichTextEditorInstance };
