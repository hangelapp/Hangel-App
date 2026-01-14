'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

export default function SupportForm() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hangel Yönetimi ile İletişim</CardTitle>
          <CardDescription>
            Aklınıza takılanları, önerilerinizi veya yaşadığınız sorunları bize iletin. Ekibimiz en kısa sürede size geri dönüş yapacaktır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-subject">Konu</Label>
              <Select>
                <SelectTrigger id="support-subject">
                  <SelectValue placeholder="Bir konu seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Teknik Sorun</SelectItem>
                  <SelectItem value="payment">Ödeme ve Bağışlar</SelectItem>
                  <SelectItem value="volunteer">Gönüllülük Süreçleri</SelectItem>
                  <SelectItem value="suggestion">Öneri ve Geri Bildirim</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-message">Mesajınız</Label>
              <Textarea id="support-message" placeholder="Lütfen mesajınızı buraya yazın..." rows={6} />
            </div>
            <Button type="submit" className="w-full">Gönder</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
