import { auth } from "@/auth";
import GuessForm from "@/components/GuessForm";

export default async function EventPage({ params }) {
  const { eventId } = await params;
  const session = await auth();

  if (!session) {
    return <div>Du må være innlogget.</div>;
  }

  return <GuessForm eventId={eventId} userId={session.user.id} />;
}
