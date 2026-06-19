import { EventAction } from '../_event-action';

export default async function EventCheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventAction eventId={id} mode="checkin" />;
}
