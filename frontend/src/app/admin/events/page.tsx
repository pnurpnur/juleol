"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function EventsList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(setEvents)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Events</h1>
      <Link href="/admin/events/new"><button>New event</button></Link>
      <ul>
        {events.map(e => (
          <li key={e.id}>
            <Link href={`/admin/events/${e.id}`}>{e.name}</Link>
            {" "} (owner: {e.owner_id}) {e.is_open ? "OPEN" : "CLOSED"}
          </li>
        ))}
      </ul>
    </div>
  );
}
