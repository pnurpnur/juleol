"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface BeerForm {
  beer_option_id: string | number;
  abv_range_id: string | number;
  beer_type_id: string | number;
}

interface Option {
  id: number;
  name: string;
}
interface Abv {
  id: number;
  label: string;
}
interface BeerType {
  id: number;
  name: string;
}

export default function EventBeers() {
  const params = useParams();
  const eventId = Number(params.id);

  const [beers, setBeers] = useState<any[]>([]);

  // Event pools (what is selectable as fasit for this event)
  const [options, setOptions] = useState<Option[]>([]);
  const [abvs, setAbvs] = useState<Abv[]>([]);
  const [types, setTypes] = useState<BeerType[]>([]);

  // Global catalogs (for attaching existing entries to the pool)
  const [allOptions, setAllOptions] = useState<Option[]>([]);
  const [allAbvs, setAllAbvs] = useState<Abv[]>([]);

  // Add-beer (fasit) form
  const [beerOptionId, setBeerOptionId] = useState("");
  const [abvRangeId, setAbvRangeId] = useState("");
  const [beerTypeId, setBeerTypeId] = useState("");

  // Pool-management inputs
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionUntappd, setNewOptionUntappd] = useState("");
  const [attachOptionId, setAttachOptionId] = useState("");
  const [newAbvLabel, setNewAbvLabel] = useState("");
  const [attachAbvId, setAttachAbvId] = useState("");
  const [newTypeLabel, setNewTypeLabel] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BeerForm>({
    beer_option_id: "",
    abv_range_id: "",
    beer_type_id: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Coerce any API response (which may be JSON `null` for an empty list) to an array.
  const asArray = (d: any) => (Array.isArray(d) ? d : []);

  const refreshPools = useCallback(() => {
    fetch(`/api/events/${eventId}/beer-options`).then((r) => r.json()).then((d) => setOptions(asArray(d))).catch(console.error);
    fetch(`/api/events/${eventId}/abv-options`).then((r) => r.json()).then((d) => setAbvs(asArray(d))).catch(console.error);
    fetch(`/api/types`).then((r) => r.json()).then((d) => setTypes(asArray(d))).catch(console.error);
    fetch(`/api/beer-options`).then((r) => (r.ok ? r.json() : [])).then((d) => setAllOptions(asArray(d))).catch(console.error);
    fetch(`/api/abv-ranges`).then((r) => (r.ok ? r.json() : [])).then((d) => setAllAbvs(asArray(d))).catch(console.error);
  }, [eventId]);

  const refreshBeers = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/beers`);
    setBeers(asArray(await res.json()));
  }, [eventId]);

  useEffect(() => {
    refreshBeers();
    refreshPools();
  }, [refreshBeers, refreshPools]);

  async function post(url: string, body: any) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.text()) || "Feil");
    return res;
  }

  function guard(fn: () => Promise<void>) {
    return async () => {
      setError(null);
      try {
        await fn();
      } catch (e: any) {
        setError(e.message);
      }
    };
  }

  // ---- Pool: beer options ----
  const createOption = guard(async () => {
    if (!newOptionName.trim()) throw new Error("Skriv inn ølnavn");
    await post(`/api/beer-options`, {
      name: newOptionName.trim(),
      untappd_link: newOptionUntappd.trim() || null,
      event_id: eventId,
    });
    setNewOptionName("");
    setNewOptionUntappd("");
    refreshPools();
  });

  const attachOption = guard(async () => {
    if (!attachOptionId) throw new Error("Velg et øl");
    await post(`/api/events/${eventId}/beer-options`, { beer_option_id: Number(attachOptionId) });
    setAttachOptionId("");
    refreshPools();
  });

  // ---- Pool: ABV ranges ----
  const createAbv = guard(async () => {
    if (!newAbvLabel.trim()) throw new Error("Skriv inn ABV-etikett");
    await post(`/api/abv-ranges`, { label: newAbvLabel.trim(), event_id: eventId });
    setNewAbvLabel("");
    refreshPools();
  });

  const attachAbv = guard(async () => {
    if (!attachAbvId) throw new Error("Velg et ABV-område");
    await post(`/api/events/${eventId}/abv-options`, { abv_range_id: Number(attachAbvId) });
    setAttachAbvId("");
    refreshPools();
  });

  // ---- Types ----
  const createType = guard(async () => {
    if (!newTypeLabel.trim()) throw new Error("Skriv inn typenavn");
    await post(`/api/beer-types`, { label: newTypeLabel.trim() });
    setNewTypeLabel("");
    refreshPools();
  });

  // ---- Beers (fasit) ----
  const add = guard(async () => {
    if (!beerOptionId) throw new Error("Velg et øl");
    if (!abvRangeId) throw new Error("Velg ABV (fasit)");
    if (!beerTypeId) throw new Error("Velg type (fasit)");
    await post(`/api/events/${eventId}/beers`, {
      beer_option_id: Number(beerOptionId),
      abv_range_id: Number(abvRangeId),
      beer_type_id: Number(beerTypeId),
    });
    setBeerOptionId("");
    setAbvRangeId("");
    setBeerTypeId("");
    refreshBeers();
  });

  async function remove(bid: number) {
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/beers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beerId: bid }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Kunne ikke slette");
      refreshBeers();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function startEdit(beer: any) {
    setEditingId(beer.id);
    setEditForm({
      beer_option_id: beer.beer_option_id ?? "",
      abv_range_id: beer.abv_range_id ?? "",
      beer_type_id: beer.beer_type_id ?? "",
    });
  }

  async function saveEdit(bid: number) {
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/beers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beer_option_id: editForm.beer_option_id === "" ? null : Number(editForm.beer_option_id),
          abv_range_id: editForm.abv_range_id === "" ? null : Number(editForm.abv_range_id),
          beer_type_id: editForm.beer_type_id === "" ? null : Number(editForm.beer_type_id),
          beer_id: bid,
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Kunne ikke lagre");
      setEditingId(null);
      refreshBeers();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ beer_option_id: "", abv_range_id: "", beer_type_id: "" });
  }

  const box: React.CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "1rem",
    marginBottom: "1.25rem",
  };

  const optionsNotInPool = allOptions.filter((o) => !options.some((p) => p.id === o.id));
  const abvsNotInPool = allAbvs.filter((a) => !abvs.some((p) => p.id === a.id));

  return (
    <div style={{ padding: "1.5rem", maxWidth: 760 }}>
      <h1>Øl, ABV og fasit – event #{eventId}</h1>

      {error && (
        <p style={{ color: "red", whiteSpace: "pre-wrap" }}>{error}</p>
      )}

      {/* ------- ØL-POOL ------- */}
      <section style={box}>
        <h2>Øl-pool for eventet</h2>
        <p style={{ color: "#666" }}>
          Dette er ølene deltakerne kan gjette blant. Lag nytt øl eller hent inn et som finnes fra før.
        </p>
        <ul>
          {options.map((o) => (
            <li key={o.id}>{o.name}</li>
          ))}
        </ul>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
          <input
            placeholder="Nytt ølnavn"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
          />
          <input
            placeholder="Untappd-lenke (valgfritt)"
            value={newOptionUntappd}
            onChange={(e) => setNewOptionUntappd(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <button onClick={createOption}>Lag øl + legg i pool</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <select value={attachOptionId} onChange={(e) => setAttachOptionId(e.target.value)}>
            <option value="">Hent inn eksisterende øl…</option>
            {optionsNotInPool.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <button onClick={attachOption}>Legg i pool</button>
        </div>
      </section>

      {/* ------- ABV-POOL ------- */}
      <section style={box}>
        <h2>ABV-pool for eventet</h2>
        <ul>
          {abvs.map((a) => (
            <li key={a.id}>{a.label}</li>
          ))}
        </ul>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
          <input
            placeholder="Ny ABV-etikett, f.eks. 4,5–5,5%"
            value={newAbvLabel}
            onChange={(e) => setNewAbvLabel(e.target.value)}
          />
          <button onClick={createAbv}>Lag ABV + legg i pool</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <select value={attachAbvId} onChange={(e) => setAttachAbvId(e.target.value)}>
            <option value="">Hent inn eksisterende ABV…</option>
            {abvsNotInPool.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          <button onClick={attachAbv}>Legg i pool</button>
        </div>
      </section>

      {/* ------- TYPER ------- */}
      <section style={box}>
        <h2>Øltyper (globale)</h2>
        <ul>
          {types.map((t) => (
            <li key={t.id}>{t.name}</li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            placeholder="Ny type, f.eks. IPA"
            value={newTypeLabel}
            onChange={(e) => setNewTypeLabel(e.target.value)}
          />
          <button onClick={createType}>Lag type</button>
        </div>
      </section>

      {/* ------- FASIT / ØL I EVENTET ------- */}
      <section style={box}>
        <h2>Øl i eventet (med fasit)</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <select value={beerOptionId} onChange={(e) => setBeerOptionId(e.target.value)}>
            <option value="">Velg øl</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select value={abvRangeId} onChange={(e) => setAbvRangeId(e.target.value)}>
            <option value="">Velg ABV</option>
            {abvs.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          <select value={beerTypeId} onChange={(e) => setBeerTypeId(e.target.value)}>
            <option value="">Velg type</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button onClick={add}>Legg til øl</button>
        </div>

        <ul>
          {beers.map((b) => {
            const optName = options.find((o) => o.id === b.beer_option_id)?.name ?? `option ${b.beer_option_id}`;
            const abvLabel = abvs.find((a) => a.id === b.abv_range_id)?.label ?? String(b.abv_range_id);
            const typeName = types.find((t) => t.id === b.beer_type_id)?.name ?? String(b.beer_type_id);
            return (
              <li key={b.id} style={{ marginBottom: "0.35rem" }}>
                {editingId === b.id ? (
                  <>
                    <select
                      value={editForm.beer_option_id}
                      onChange={(e) => setEditForm({ ...editForm, beer_option_id: e.target.value })}
                    >
                      <option value="">Velg øl</option>
                      {options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editForm.abv_range_id}
                      onChange={(e) => setEditForm({ ...editForm, abv_range_id: e.target.value })}
                    >
                      <option value="">Velg ABV</option>
                      {abvs.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editForm.beer_type_id}
                      onChange={(e) => setEditForm({ ...editForm, beer_type_id: e.target.value })}
                    >
                      <option value="">Velg type</option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => saveEdit(b.id)}>Lagre</button>
                    <button onClick={cancelEdit}>Avbryt</button>
                  </>
                ) : (
                  <>
                    #{b.id} — <strong>{optName}</strong> · {abvLabel} · {typeName}{" "}
                    <button onClick={() => startEdit(b)}>Endre</button>
                    <button onClick={() => remove(b.id)}>Slett</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
