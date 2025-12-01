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
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [eventId]);

    const save = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`/api/events/${eventId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    is_open: isOpen,
                }),
            });

            if (!res.ok) {
                throw new Error("Kunne ikke lagre");
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
                    ➤ Administrer øl i dette eventet
                </Link>

                <Link
                    href={`/admin/events/${eventId}/abv`}
                    style={{
                        padding: "0.6rem",
                        background: "#eee",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontWeight: 600,
                    }}
                >
                    ➤ Administrer ABV-områder for eventet
                </Link>
            </div>
        </div>
    );
}
