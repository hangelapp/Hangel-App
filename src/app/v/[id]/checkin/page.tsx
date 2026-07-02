import { VolunteerAction } from '../_volunteer-action';

export default async function VolunteeringCheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VolunteerAction volunteeringId={id} />;
}
