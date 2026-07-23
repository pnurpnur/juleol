"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserRow {
  id: number;
  name: string;
  email: string;
}

export default function NewEventPage() {
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/users")
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(setUsers)
      .catch((e) => setError("Kunne ikke hente brukere (er du admin?): " + e.message));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Skriv inn et eventnavn");
      return;
    }
    if (!ownerId) {
      setError("Velg en arrangør");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), owner_id: Number(ownerId) }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/admin/events");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 600 }}>
      <h1>Nytt event</h1>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontWeight: 600 }}>Eventnavn</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. Sommerøltest 2026"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600 }}>Arrangør (host)</label>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          >
            <option value="">Velg arrangør…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          <small>Arrangøren styrer sitt eget event. Du kan velge deg selv eller en annen bruker.</small>
        </div>

        <button disabled={saving} style={{ padding: "0.6rem 1.2rem", width: "fit-content" }}>
          {saving ? "Oppretter…" : "Opprett event"}
        </button>
      </form>

      {error && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>{error}</p>}
    </div>
  );
}
