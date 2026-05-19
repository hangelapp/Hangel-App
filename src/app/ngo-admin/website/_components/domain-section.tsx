'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Monitor } from 'lucide-react';
import { domainRegistrars } from './constants';

interface DomainSectionProps {
    domainName: string;
    onDomainChange: (value: string) => void;
    selectedRegistrar: string;
    onRegistrarChange: (value: string) => void;
    onCopy: (text: string, label: string) => void;
}

export function DomainSection({ domainName, onDomainChange, selectedRegistrar, onRegistrarChange, onCopy }: DomainSectionProps) {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="domain-name">Alan Adınız</Label>
                    <Input
                        id="domain-name"
                        placeholder="kurulusunuz.org"
                        value={domainName}
                        onChange={(e) => onDomainChange(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Domain Sağlayıcı</Label>
                    <Select value={selectedRegistrar} onValueChange={onRegistrarChange}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                        <SelectContent>
                            {domainRegistrars.map(reg => <SelectItem key={reg} value={reg}>{reg}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="p-4 border rounded-xl bg-indigo-50/50">
                <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-2 mb-3">
                    <Monitor className="h-4 w-4" /> DNS (NameServer) Bilgileri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                        <code className="text-[10px] font-bold font-mono">ns1.hangel.org</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCopy('ns1.hangel.org', 'NS1')} aria-label="NS1 kopyala">
                            <Copy className="h-4 w-4 text-indigo-600" />
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                        <code className="text-[10px] font-bold font-mono">ns2.hangel.org</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCopy('ns2.hangel.org', 'NS2')} aria-label="NS2 kopyala">
                            <Copy className="h-4 w-4 text-indigo-600" />
                        </Button>
                    </div>
                </div>
                <p className="mt-3 text-xs text-indigo-900/80 leading-relaxed">
                    Lütfen Domain sağlayıcınıza DNS bilgilerimizi kaydediniz. Yayına alma işlemi için NS kayıtlarının yukarıdaki değerlerle eşleşmesi gerekir.
                </p>
            </div>
        </>
    );
}
