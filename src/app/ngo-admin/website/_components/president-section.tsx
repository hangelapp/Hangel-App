'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MESSAGE_LIMIT } from './constants';

interface PresidentSectionProps {
    presidentName: string;
    onPresidentNameChange: (value: string) => void;
    presidentsMessage: string;
    onPresidentsMessageChange: (value: string) => void;
    onSave: () => void;
}

export function PresidentSection({ presidentName, onPresidentNameChange, presidentsMessage, onPresidentsMessageChange, onSave }: PresidentSectionProps) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="president-name">Başkanın Adı Soyadı</Label>
                <Input
                    id="president-name"
                    value={presidentName}
                    onChange={(e) => onPresidentNameChange(e.target.value)}
                    placeholder="Örn: Haluk Levent"
                />
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                    <Label htmlFor="president-message">Mesaj İçeriği</Label>
                    <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                        presidentsMessage.length > MESSAGE_LIMIT * 0.9 ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"
                    )}>
                        {presidentsMessage.length} / {MESSAGE_LIMIT}
                    </span>
                </div>
                <Textarea
                    id="president-message"
                    rows={6}
                    maxLength={MESSAGE_LIMIT}
                    placeholder="Geleceğe dair vizyonunuzu buraya yazın..."
                    value={presidentsMessage}
                    onChange={(e) => onPresidentsMessageChange(e.target.value)}
                />
            </div>
            <Button className="w-full" onClick={onSave}><Save className="mr-2 h-4 w-4" /> Mesajı Kaydet</Button>
        </>
    );
}
