'use client';
import { notFound, useRouter } from 'next/navigation';
import { events } from '@/lib/data';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Users, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const event = events.find(e => e.id === params.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="animate-in fade-in-0">
      <div className="relative h-48 w-full bg-muted">
        <Image src={event.imageUrl} alt={`${event.name} Cover`} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="-mt-12 relative z-10">
          <h1 className="text-3xl font-bold font-headline text-white drop-shadow-md">{event.name}</h1>
          <p className="text-lg font-medium text-white/90 drop-shadow-sm">{event.organizer}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Etkinlik Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-base">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-3 text-base">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-3 text-base">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>Kapasite: {event.capacity.current} / {event.capacity.max}</span>
            </div>
            <div className="flex items-start gap-3 text-base">
              <Tag className="h-5 w-5 text-muted-foreground mt-1" />
              <div className="flex flex-wrap gap-2">
                {event.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Açıklama</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{event.description}</p>
          </CardContent>
        </Card>

        <Button size="lg" className="w-full">
          Etkinliğe Katıl
        </Button>
      </div>
    </div>
  );
}
