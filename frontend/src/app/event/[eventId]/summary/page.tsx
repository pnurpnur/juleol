import EventSummary from "@/components/EventSummary";

export default async function EventSummaryPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const eventId = Number(params.eventId);

  return <EventSummary eventId={eventId} />;
}
