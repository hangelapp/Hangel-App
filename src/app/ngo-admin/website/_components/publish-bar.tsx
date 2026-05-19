'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Loader2 } from 'lucide-react';

interface PublishBarProps {
    lastUpdated: string | null;
    isSaving: boolean;
    isVerifying: boolean;
    onPublish: () => void | Promise<void>;
}

export function PublishBar({ lastUpdated, isSaving, isVerifying, onPublish }: PublishBarProps) {
    return (
        <div className="fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none">
            <Card className="bg-background/90 backdrop-blur-xl border-primary/20 shadow-2xl max-w-lg w-full pointer-events-auto">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="text-left hidden sm:block">
                        <p className="font-bold text-sm">Site Yayınlanmaya Hazır</p>
                        <p className="text-[10px] text-muted-foreground">Son güncelleme: {lastUpdated || '--:--:--'}</p>
                    </div>
                    <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl"
                        disabled={isSaving || isVerifying}
                        onClick={onPublish}
                    >
                        {isVerifying ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> DNS doğrulanıyor…</>
                        ) : isSaving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yayınlanıyor…</>
                        ) : (
                            <><Globe className="mr-2 h-4 w-4" /> Siteyi Yayınla ve Görüntüle</>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
