import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ResultsPage from "@/components/ResultsPage";

export default async function Page(props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session) redirect("/");

  const eventId = Number(params.eventId);
  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  const res = await fetch(`${API}/results?event_id=${eventId}`, { cache: "no-store" });
  if (!res.ok) {
    return <main><h1>Kunne ikke hente resultater</h1></main>;
  }
  const results = await res.json();

  return (
    <main style={{ padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <a href="/" aria-label="Forsiden"><img src="/logo.png" alt="logo" style={{ height: 150 }} /></a>
      </header>

      <ResultsPage initialResults={results} eventId={eventId} />
    </main>
  );
}