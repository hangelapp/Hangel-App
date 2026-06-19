import { EventAction } from '../_event-action';

export default async function EventRegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventAction eventId={id} mode="kayit" />;
}
