import {redirect} from 'next/navigation';

export default function RootPage() {
  // TODO: Check for authentication and redirect to /timeline if logged in.
  // For now, we'll always start with onboarding.
  redirect('/onboarding');
}
