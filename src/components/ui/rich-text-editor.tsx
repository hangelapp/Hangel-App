'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
    Heading2, Heading3, Link2, Code as CodeIcon, Quote, Eraser, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize-html';

type RichTextEditorProps = {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: number;
};

/**
 * Bağımsız (dependency-free) WYSIWYG editör.
 * - Toolbar: Bold, Italic, Underline, H2, H3, UL, OL, Quote, Link, Code, Temizle
 * - Visual / HTML modu arasında geçiş yapılabilir
 * - contentEditable + document.execCommand ile çalışır
 */
export function RichTextEditor({ value, onChange, placeholder, className, minHeight = 240 }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<'visual' | 'html'>('visual');
    const [internalHtml, setInternalHtml] = useState(value || '');

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

            {/* Body */}
            {mode === 'visual' ? (
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onBlur={handleInput}
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
    onClick, title, icon: Icon, iconText,
}: { onClick: () => void; title: string; icon?: React.ComponentType<{ className?: string }>; iconText?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted active:bg-muted/70 transition-colors text-foreground/80 hover:text-foreground"
        >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="text-xs font-bold">{iconText}</span>}
        </button>
    );
}

function Separator() {
    return <div className="w-px h-5 bg-border mx-1" />;
}
