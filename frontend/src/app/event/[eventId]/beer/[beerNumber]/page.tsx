import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BeerClientPage from "./BeerClientPage";

export default async function Page(props: { params: Promise<{ eventId: string; beerNumber: string }>}) {
  // ⭐ Params is now a Promise and must be awaited
  const params = await props.params;

  const session = await auth();
  if (!session) redirect("/");

  const eventId = Number(params.eventId);
  const beerId = Number(params.beerNumber);
  const userId = session.user.id;

  return (
    <BeerClientPage
      eventId={eventId}
      beerId={beerId}
      userId={userId}
    />
  );
}
