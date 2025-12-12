import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Fasit from "@/components/Fasit";

export default async function FasitPage(props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  const eventId = Number(params.eventId);

  const session = await auth();
  if (!session) redirect("/");
  const userId = Number(session.user.id);

  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const eventRes = await fetch(`${API}/event?event_id=${eventId}`);
  if (!eventRes.ok) {
    return <main><h1>Kunne ikke hente event</h1></main>;
  }
  const event = await eventRes.json();
  const isOwner = event.owner_id === userId;
  if (!isOwner) {
    return <main><h1>Du er ikke eier av eventet</h1></main>;
  }

  return <Fasit eventId={eventId} />;
}
