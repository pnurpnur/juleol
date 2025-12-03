import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Leaderboard from "@/components/Leaderboard";
import styles from "./page.module.css";

export default async function Page(props: { params: Promise<{ eventId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session) redirect("/");

  const userId = String(session.user.id);
  const eventId = Number(params.eventId);
  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  const res = await fetch(`${API}/results?event_id=${eventId}`, { cache: "no-store" });
  if (!res.ok) {
    return <main><h1>Kunne ikke hente resultater</h1></main>;
  }
  const results = await res.json();

  return (
    <main className={styles.pageBackground}>
      <header className={styles.header}>
        <a href="/" aria-label="Forsiden">
            <img src="/logo.png" alt="logo" className={styles.logo} />
        </a>
      </header>

      <Leaderboard
        standings={results.standings}
        selectedUserId={userId}
      />
    </main>
  );
}