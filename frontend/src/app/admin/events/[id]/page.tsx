"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminEventPage() {
    const params = useParams();
    const eventId = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState("");
    const [isOpen, setIsOpen] = useState(true);
    const [ownerId, setOwnerId] = useState<string>("");

    const [users, setUsers] = useState<{ id: number; name: string; email: string }[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    // Fetch event info
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/events/${eventId}`);
                if (!res.ok) throw new Error("Failed fetching event");

                const data = await res.json();
                setName(data.name);
                setIsOpen(data.is_open);
                setOwnerId(String(data.owner_id ?? ""));
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();

        // Only the admin can list users; use it to detect admin + populate the
        // arrangør selector.
        fetch("/api/users")
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((u) => {
                setUsers(u);
                setIsAdmin(true);
            })
            .catch(() => setIsAdmin(false));
    }, [eventId]);

    const save = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const payload: Record<string, unknown> = { name, is_open: isOpen };
            // Only the admin may reassign the arrangør.
            if (isAdmin && ownerId) {
                payload.owner_id = Number(ownerId);
            }

            const res = await fetch(`/api/events/${eventId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error((await res.text()) || "Kunne ikke lagre");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading…</div>;
    if (error) return <div className="text-red-600">Error: {error}</div>;

    return (
        <div style={{ padding: "1.5rem", maxWidth: "600px" }}>
            <h1 style={{ fontSize: "1.7rem", marginBottom: "1rem" }}>
                Admin – Event #{eventId}
            </h1>

            {/* EDIT EVENT NAME */}
            <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: 600 }}>Eventnavn:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                    }}
                />
            </div>

            {/* OPEN / CLOSE */}
            <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontWeight: 600 }}>
                    <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={(e) => setIsOpen(e.target.checked)}
                        style={{ marginRight: "0.5rem" }}
                    />
                    Event er åpen
                </label>
            </div>

            {/* ARRANGØR (admin only) */}
            {isAdmin && (
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontWeight: 600 }}>Arrangør (host):</label>
                    <select
                        value={ownerId}
                        onChange={(e) => setOwnerId(e.target.value)}
                        style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: 6 }}
                    >
                        <option value="">Velg arrangør…</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* SAVE BUTTON */}
            <button
                onClick={save}
                disabled={saving}
                style={{
                    padding: "0.6rem 1.2rem",
                    background: "#2c6bff",
                    color: "white",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                {saving ? "Lagrer…" : "Lagre endringer"}
            </button>

            {/* STATUS */}
            {success && (
                <div style={{ marginTop: "1rem", color: "green" }}>
                    Lagret!
                </div>
            )}

            {error && (
                <div style={{ marginTop: "1rem", color: "red" }}>
                    {error}
                </div>
            )}

            <hr style={{ margin: "2rem 0" }} />

            {/* LINKS TO EVENT SUBPAGES */}
            <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Event-innhold</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                <Link
                    href={`/admin/events/${eventId}/beers`}
                    style={{
                        padding: "0.6rem",
                        background: "#eee",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontWeight: 600,
                    }}
                >
                    ➤ Administrer øl, ABV og fasit i dette eventet
                </Link>

                <Link
                    href={`/event/${eventId}/fasit`}
                    style={{
                        padding: "0.6rem",
                        background: "#eee",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontWeight: 600,
                    }}
                >
                    ➤ Se fasit
                </Link>

                <Link
                    href={`/admin/events/${eventId}/stats`}
                    style={{
                        padding: "0.6rem",
                        background: "#eee",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontWeight: 600,
                    }}
                >
                    ➤ Se hvor mange har svart
                </Link>
            </div>
        </div>
    );
}
