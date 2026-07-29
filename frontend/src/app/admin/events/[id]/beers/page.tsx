"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Option {
  id: number;
  name: string;
}
interface CatalogBeer {
  id: number;
  brewery: string | null;
  name: string;
  display_name: string;
  beer_type_id: number | null;
  abv: number | null;
  untappd_link: string | null;
}
interface Abv {
  id: number;
  label: string;
  min_abv: number | null;
  max_abv: number | null;
}
interface BeerType {
  id: number;
  name: string;
}

export default function EventBeers() {
  const params = useParams();
  const eventId = Number(params.id);

  const [beers, setBeers] = useState<any[]>([]);

  // Event pools
  const [options, setOptions] = useState<Option[]>([]); // beers attached to this event
  const [abvs, setAbvs] = useState<Abv[]>([]); // abv intervals for this event
  const [types, setTypes] = useState<BeerType[]>([]);

  // Global catalogs (for attaching existing)
  const [allOptions, setAllOptions] = useState<CatalogBeer[]>([]);
  const [allAbvs, setAllAbvs] = useState<Abv[]>([]);

  // Add-beer-to-event (fasit): only pick the beer; type + abv are auto-derived
  const [beerOptionId, setBeerOptionId] = useState("");

  // New beer (catalog) inputs
  const [nBrewery, setNBrewery] = useState("");
  const [nName, setNName] = useState("");
  const [nType, setNType] = useState("");
  const [nAbv, setNAbv] = useState("");
  const [nUntappd, setNUntappd] = useState("");
  const [attachOptionId, setAttachOptionId] = useState("");

  // ABV interval inputs
  const [aLabel, setALabel] = useState("");
  const [aMin, setAMin] = useState("");
  const [aMax, setAMax] = useState("");
  const [attachAbvId, setAttachAbvId] = useState("");

  // New type
  const [newTypeLabel, setNewTypeLabel] = useState("");

  const [error, setError] = useState<string | null>(null);

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

  // ---- Catalog: create a beer (brewery, name, type, abv) and attach to event ----
  const createBeer = guard(async () => {
    if (!nName.trim()) throw new Error("Skriv inn ølnavn");
    if (!nType) throw new Error("Velg type");
    if (!nAbv.trim() || isNaN(Number(nAbv.replace(",", ".")))) throw new Error("Skriv inn ABV (tall)");
    await post(`/api/beer-options`, {
      brewery: nBrewery.trim() || null,
      name: nName.trim(),
      beer_type_id: Number(nType),
      abv: Number(nAbv.replace(",", ".")),
      untappd_link: nUntappd.trim() || null,
      event_id: eventId,
    });
    setNBrewery("");
    setNName("");
    setNType("");
    setNAbv("");
    setNUntappd("");
    refreshPools();
  });

  const attachBeer = guard(async () => {
    if (!attachOptionId) throw new Error("Velg et øl");
    await post(`/api/events/${eventId}/beer-options`, { beer_option_id: Number(attachOptionId) });
    setAttachOptionId("");
    refreshPools();
  });

  // ---- ABV intervals ----
  const createAbv = guard(async () => {
    if (!aLabel.trim()) throw new Error("Skriv inn etikett");
    const min = aMin.trim() === "" ? null : Number(aMin.replace(",", "."));
    const max = aMax.trim() === "" ? null : Number(aMax.replace(",", "."));
    if (min === null || max === null || isNaN(min) || isNaN(max)) throw new Error("Skriv inn min og maks (tall) for auto-plassering");
    await post(`/api/abv-ranges`, { label: aLabel.trim(), min_abv: min, max_abv: max, event_id: eventId });
    setALabel("");
    setAMin("");
    setAMax("");
    refreshPools();
  });

  const attachAbv = guard(async () => {
    if (!attachAbvId) throw new Error("Velg et intervall");
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

  // ---- Fasit: add a beer to the event (type + abv-interval auto-derived) ----
  const addBeer = guard(async () => {
    if (!beerOptionId) throw new Error("Velg et øl");
    await post(`/api/events/${eventId}/beers`, { beer_option_id: Number(beerOptionId) });
    setBeerOptionId("");
    refreshBeers();
  });

  async function changeBeer(bid: number, optionId: string) {
    if (!optionId) return;
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/beers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beer_id: bid, beer_option_id: Number(optionId) }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Kunne ikke endre");
      refreshBeers();
    } catch (e: any) {
      setError(e.message);
    }
  }

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

  const box: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 8, padding: "1rem", marginBottom: "1.25rem" };
  const optionsNotInPool = allOptions.filter((o) => !options.some((p) => p.id === o.id));
  const abvsNotInPool = allAbvs.filter((a) => !abvs.some((p) => p.id === a.id));
  const typeName = (id: number | null) => types.find((t) => t.id === id)?.name ?? "?";

  return (
    <div style={{ padding: "1.5rem", maxWidth: 820 }}>
      <h1>Øl, ABV og fasit – event #{eventId}</h1>
      {error && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>{error}</p>}

      {/* ------- ØL-POOL ------- */}
      <section style={box}>
        <h2>Øl-pool for eventet</h2>
        <p style={{ color: "#666" }}>Et øl = bryggeri, navn, type og ABV. ABV brukes til å plassere ølet automatisk i riktig intervall.</p>
        <ul>
          {allOptions
            .filter((o) => options.some((p) => p.id === o.id))
            .map((o) => (
              <li key={o.id}>
                {o.display_name} — {typeName(o.beer_type_id)}
                {o.abv != null ? `, ${o.abv}%` : " (mangler ABV)"}
              </li>
            ))}
        </ul>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <input placeholder="Bryggeri" value={nBrewery} onChange={(e) => setNBrewery(e.target.value)} />
          <input placeholder="Ølnavn" value={nName} onChange={(e) => setNName(e.target.value)} />
          <select value={nType} onChange={(e) => setNType(e.target.value)}>
            <option value="">Velg type</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input placeholder="ABV %, f.eks. 5.2" value={nAbv} onChange={(e) => setNAbv(e.target.value)} />
          <input placeholder="Untappd-lenke (valgfritt)" value={nUntappd} onChange={(e) => setNUntappd(e.target.value)} style={{ gridColumn: "1 / span 2" }} />
        </div>
        <button onClick={createBeer}>Lag øl + legg i pool</button>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginTop: "0.75rem" }}>
          <select value={attachOptionId} onChange={(e) => setAttachOptionId(e.target.value)}>
            <option value="">Hent inn eksisterende øl…</option>
            {optionsNotInPool.map((o) => (
              <option key={o.id} value={o.id}>{o.display_name}</option>
            ))}
          </select>
          <button onClick={attachBeer}>Legg i pool</button>
        </div>
      </section>

      {/* ------- ABV-POOL ------- */}
      <section style={box}>
        <h2>ABV-intervaller for eventet</h2>
        <ul>
          {abvs.map((a) => (
            <li key={a.id}>
              {a.label}
              {a.min_abv != null && a.max_abv != null ? ` (${a.min_abv}–${a.max_abv}%)` : " ⚠️ mangler grenser"}
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
          <input placeholder="Etikett, f.eks. 5,0–7,9%" value={aLabel} onChange={(e) => setALabel(e.target.value)} />
          <input placeholder="min %" value={aMin} onChange={(e) => setAMin(e.target.value)} style={{ width: 90 }} />
          <input placeholder="maks %" value={aMax} onChange={(e) => setAMax(e.target.value)} style={{ width: 90 }} />
          <button onClick={createAbv}>Lag intervall + legg i pool</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <select value={attachAbvId} onChange={(e) => setAttachAbvId(e.target.value)}>
            <option value="">Hent inn eksisterende intervall…</option>
            {abvsNotInPool.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
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
          <input placeholder="Ny type, f.eks. IPA" value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} />
          <button onClick={createType}>Lag type</button>
        </div>
      </section>

      {/* ------- FASIT ------- */}
      <section style={box}>
        <h2>Øl i eventet (fasit)</h2>
        <p style={{ color: "#666" }}>Velg øl – type og ABV-intervall settes automatisk fra ølet.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <select value={beerOptionId} onChange={(e) => setBeerOptionId(e.target.value)}>
            <option value="">Velg øl</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <button onClick={addBeer}>Legg til øl</button>
        </div>

        <ol>
          {beers.map((b) => {
            const abvLabel = abvs.find((a) => a.id === b.abv_range_id)?.label ?? String(b.abv_range_id);
            return (
              <li key={b.id} style={{ marginBottom: "0.4rem" }}>
                <strong>{b.beer_name}</strong> — {typeName(b.beer_type_id)} · {abvLabel}
                {b.abv != null ? ` (${b.abv}%)` : ""}{" "}
                <select
                  defaultValue=""
                  onChange={(e) => changeBeer(b.id, e.target.value)}
                  style={{ marginLeft: 8 }}
                >
                  <option value="">Bytt øl…</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                <button onClick={() => remove(b.id)} style={{ marginLeft: 6 }}>Slett</button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
