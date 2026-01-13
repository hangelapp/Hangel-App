'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImagePlus, Send } from 'lucide-react';
import Image from 'next/image';
import { timelinePosts } from '@/lib/data';

export default function PostsPage() {
    const ngoPosts = timelinePosts.filter(p => p.author.name === 'Ahbap Derneği');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gönderi Yönetimi</h1>
        <p className="text-muted-foreground">
          Toplulukla etkileşim kurmak için gönderiler oluşturun ve yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Yeni Gönderi Oluştur</h2>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Neler oluyor?" rows={4} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">
            <ImagePlus className="mr-2 h-4 w-4" />
            Görsel Ekle
          </Button>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Paylaş
          </Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mevcut Gönderiler</h2>
        {ngoPosts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
                <p className="text-sm text-muted-foreground">{post.timestamp}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{post.content}</p>
              {post.imageUrl && (
                <div className="relative aspect-video mt-4">
                  <Image
                    src={post.imageUrl}
                    alt="Post image"
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
              )}
            </CardContent>
             <CardFooter className="gap-2">
                <Button variant="outline" size="sm">Düzenle</Button>
                <Button variant="destructive" size="sm">Sil</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
