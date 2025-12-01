"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const [name, setName] = useState('');
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    // NOTE: The backend will derive owner from CurrentUserID(r) (recommended).
    // If you can't set X-User-Id header from the client, implement a server-side proxy that injects it.
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    router.push('/events');
  }

  return (
    <div>
      <h1>Create event</h1>
      <form onSubmit={submit}>
        <div>
          <label>Event name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <button>Create</button>
      </form>
    </div>
  );
}
