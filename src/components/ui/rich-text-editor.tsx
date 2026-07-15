'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
    Heading2, Heading3, Link2, Code as CodeIcon, Quote, Eraser, Pencil,
    ImagePlus, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize-html';

/** Değişken (placeholder) ekleme butonu — imlecin olduğu yere {token} yazar. */
export type VariableButton = { token: string; label: string; insert?: string };

type RichTextEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: number;
    /** Görsel yükleme butonu göster (bilgisayardan seç → Storage'a yükle → gövdeye ekle). */
    enableImageUpload?: boolean;
    /** Storage yükleme klasörü (varsayılan: 'mail-images'). */
    imageUploadPath?: string;
    /** İmleç konumuna tek tıkla eklenecek değişken butonları. */
    variableButtons?: VariableButton[];
};

/**
 * Bağımsız (dependency-free) WYSIWYG editör.
 * - Toolbar: Bold, Italic, Underline, H2, H3, UL, OL, Quote, Link, Code, Temizle
 * - Visual / HTML modu arasında geçiş yapılabilir
 * - contentEditable + document.execCommand ile çalışır
 */
export function RichTextEditor({
    value, onChange, placeholder, className, minHeight = 240,
    enableImageUpload = false, imageUploadPath = 'mail-images', variableButtons,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const [mode, setMode] = useState<'visual' | 'html'>('visual');
    const [internalHtml, setInternalHtml] = useState(value || '');
    const [uploading, setUploading] = useState(false);

    // Dış değer değişince içeri yansıt (sayfa yenilemede vb.)
    useEffect(() => {
        if (value !== internalHtml) {
            setInternalHtml(value || '');
            if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
                editorRef.current.innerHTML = value || '';
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const exec = (command: string, val?: string) => {
        if (typeof document === 'undefined') return;
        document.execCommand(command, false, val);
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            setInternalHtml(html);
            onChange(html);
        }
        editorRef.current?.focus();
    };

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            setInternalHtml(html);
            onChange(html);
        }
    };

    // İmleç (seçim) konumunu sakla — buton/dosya seçimi odağı editörden alınca
    // ekleme yeri kaybolmasın diye. blur/mousedown anında çağrılır.
    const saveSelection = () => {
        const sel = typeof window !== 'undefined' ? window.getSelection() : null;
        if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
            savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
    };

    // Kaydedilen imleç konumuna HTML ekle (yoksa sona ekler). execCommand yerine
    // Range API — insertHTML bazı tarayıcılarda güvenilmez.
    const insertHtmlAtCursor = (html: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();
        const sel = window.getSelection();
        let range = savedRangeRef.current;
        if (!range || !editor.contains(range.commonAncestorContainer)) {
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false); // sona
        }
        sel?.removeAllRanges();
        sel?.addRange(range);

        const temp = document.createElement('div');
        temp.innerHTML = html;
        const frag = document.createDocumentFragment();
        let lastNode: ChildNode | null = null;
        while (temp.firstChild) { lastNode = temp.firstChild; frag.appendChild(temp.firstChild); }
        range.deleteContents();
        range.insertNode(frag);
        // İmleci eklenen içeriğin sonuna taşı
        if (lastNode) {
            const after = document.createRange();
            after.setStartAfter(lastNode);
            after.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(after);
            savedRangeRef.current = after.cloneRange();
        }
        const out = editor.innerHTML;
        setInternalHtml(out);
        onChange(out);
    };

    // Değişken işaretini ekle: HTML modunda düz {token}, görsel modda güvenli metin.
    const insertVariable = (v: VariableButton) => {
        const text = v.insert ?? `{${v.token}}`;
        if (mode === 'html') {
            const ta = editorRef.current;
            // HTML modunda textarea yok; görsel modda çalışır. HTML modunda sona ekle.
            void ta;
            const next = (internalHtml || '') + text;
            setInternalHtml(next);
            onChange(next);
            return;
        }
        const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        insertHtmlAtCursor(esc);
    };

    const handlePickImage = () => {
        saveSelection();
        fileInputRef.current?.click();
    };

    const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // aynı dosya tekrar seçilebilsin
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            window.alert('Lütfen bir görsel dosyası seç (jpg, png, webp…).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            window.alert('Görsel en fazla 5 MB olabilir.');
            return;
        }
        setUploading(true);
        try {
            const storage = getStorage();
            const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            // eslint-disable-next-line react-hooks/purity -- dosya seçimi event handler'ında (render değil); benzersiz yol için zaman damgası
            const path = `${imageUploadPath}/${Date.now()}-${safe}`;
            const r = storageRef(storage, path);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);
            // Mail istemcileriyle uyumlu: style yerine width attribute (sanitize style'ı siler).
            insertHtmlAtCursor(`<img src="${url}" alt="${safe}" width="600" />`);
        } catch (err) {
            console.error('[rich-text-editor] görsel yükleme hatası', err);
            window.alert('Görsel yüklenemedi. Bağlantını kontrol edip tekrar dene.');
        } finally {
            setUploading(false);
        }
    };

    const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const html = e.target.value;
        setInternalHtml(html);
        onChange(html);
    };

    const handleLink = () => {
        const url = window.prompt('Bağlantı URL\'si:', 'https://');
        if (url && url !== 'https://') {
            exec('createLink', url);
        }
    };

    const handleClear = () => {
        if (window.confirm('Tüm biçimlendirme temizlensin mi?')) {
            exec('removeFormat');
        }
    };

    return (
        <div className={cn('border rounded-xl overflow-hidden bg-background', className)}>
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 p-1.5 border-b bg-muted/30 flex-wrap">
                <ToolbarButton onClick={() => exec('bold')} title="Kalın (Ctrl+B)" icon={Bold} />
                <ToolbarButton onClick={() => exec('italic')} title="İtalik (Ctrl+I)" icon={Italic} />
                <ToolbarButton onClick={() => exec('underline')} title="Altı çizili (Ctrl+U)" icon={UnderlineIcon} />
                <Separator />
                <ToolbarButton onClick={() => exec('formatBlock', '<h2>')} title="Başlık 2" icon={Heading2} />
                <ToolbarButton onClick={() => exec('formatBlock', '<h3>')} title="Başlık 3" icon={Heading3} />
                <ToolbarButton onClick={() => exec('formatBlock', '<p>')} title="Paragraf" iconText="P" />
                <Separator />
                <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Maddeli liste" icon={List} />
                <ToolbarButton onClick={() => exec('insertOrderedList')} title="Sıralı liste" icon={ListOrdered} />
                <ToolbarButton onClick={() => exec('formatBlock', '<blockquote>')} title="Alıntı" icon={Quote} />
                <Separator />
                <ToolbarButton onClick={handleLink} title="Bağlantı" icon={Link2} />
                <ToolbarButton onClick={() => exec('formatBlock', '<pre>')} title="Kod bloğu" icon={CodeIcon} />
                {enableImageUpload && (
                    <ToolbarButton
                        onClick={handlePickImage}
                        title="Görsel ekle (bilgisayardan)"
                        icon={uploading ? Loader2 : ImagePlus}
                        spin={uploading}
                    />
                )}
                <Separator />
                <ToolbarButton onClick={handleClear} title="Biçimi temizle" icon={Eraser} />

                <div className="ml-auto flex items-center gap-1">
                    <Button
                        type="button"
                        variant={mode === 'visual' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        onClick={() => setMode('visual')}
                    >
                        <Pencil className="h-3 w-3 mr-1" /> Görsel
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'html' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        onClick={() => setMode('html')}
                    >
                        <CodeIcon className="h-3 w-3 mr-1" /> HTML
                    </Button>
                </div>
            </div>

            {/* Değişken (otomatik dolan bilgi) butonları — imleç konumuna {token} ekler.
                mousedown ile imleç kaybolmadan önce seçim saklanır. */}
            {variableButtons && variableButtons.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 px-2 py-1.5">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Otomatik bilgi:
                    </span>
                    {variableButtons.map((v) => (
                        <button
                            key={v.token}
                            type="button"
                            title={`Ekle: ${v.insert ?? `{${v.token}}`}`}
                            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
                            onClick={() => insertVariable(v)}
                            className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary transition hover:bg-primary/10 active:scale-95"
                        >
                            + {v.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Gizli dosya seçici — görsel yükleme butonu bunu tetikler. */}
            {enableImageUpload && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelected}
                />
            )}

            {/* Body */}
            {mode === 'visual' ? (
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onBlur={() => { saveSelection(); handleInput(); }}
                    onKeyUp={saveSelection}
                    onMouseUp={saveSelection}
                    data-placeholder={placeholder || 'Buraya yazın...'}
                    className={cn(
                        'prose prose-sm max-w-none p-4 outline-none',
                        'focus-visible:ring-0',
                        '[&[contenteditable=true]:empty]:before:content-[attr(data-placeholder)]',
                        '[&[contenteditable=true]:empty]:before:text-muted-foreground',
                        '[&[contenteditable=true]:empty]:before:pointer-events-none',
                    )}
                    style={{ minHeight }}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || '') }}
                />
            ) : (
                <textarea
                    value={internalHtml}
                    onChange={handleHtmlChange}
                    className="w-full p-4 font-mono text-xs outline-none bg-background resize-y"
                    style={{ minHeight }}
                    placeholder="<h2>Başlık</h2>\n<p>Paragraf...</p>"
                />
            )}
        </div>
    );
}

function ToolbarButton({
    onClick, title, icon: Icon, iconText, spin,
}: { onClick: () => void; title: string; icon?: React.ComponentType<{ className?: string }>; iconText?: string; spin?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted active:bg-muted/70 transition-colors text-foreground/80 hover:text-foreground"
        >
            {Icon ? <Icon className={cn('h-3.5 w-3.5', spin && 'animate-spin')} /> : <span className="text-xs font-bold">{iconText}</span>}
        </button>
    );
}

function Separator() {
    return <div className="w-px h-5 bg-border mx-1" />;
}
