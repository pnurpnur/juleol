"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Option {
  id: number;
  name: string;
}
interface CatalogBeer {
  id: number;
  brewery_id: number | null;
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
interface Brewery {
  id: number;
  name: string;
}

type EditBeer = {
  id: number;
  brewery_id: string;
  name: string;
  beer_type_id: string;
  abv: string;
  untappd_link: string;
};

export default function EventBeers() {
  const params = useParams();
  const eventId = Number(params.id);

  const [beers, setBeers] = useState<any[]>([]);

  // Event pools
  const [options, setOptions] = useState<Option[]>([]);
  const [abvs, setAbvs] = useState<Abv[]>([]);
  const [types, setTypes] = useState<BeerType[]>([]);

  // Global catalogs
  const [allOptions, setAllOptions] = useState<CatalogBeer[]>([]);
  const [allAbvs, setAllAbvs] = useState<Abv[]>([]);
  const [breweries, setBreweries] = useState<Brewery[]>([]);

  // Fasit add
  const [beerOptionId, setBeerOptionId] = useState("");

  // New beer inputs
  const [nBreweryId, setNBreweryId] = useState("");
  const [nName, setNName] = useState("");
  const [nType, setNType] = useState("");
  const [nAbv, setNAbv] = useState("");
  const [nUntappd, setNUntappd] = useState("");
  const [attachOptionId, setAttachOptionId] = useState("");

  // Edit beer
  const [editBeer, setEditBeer] = useState<EditBeer | null>(null);

  // ABV inputs
  const [aLabel, setALabel] = useState("");
  const [aMin, setAMin] = useState("");
  const [aMax, setAMax] = useState("");
  const [attachAbvId, setAttachAbvId] = useState("");

  // Brewery inputs
  const [newBreweryName, setNewBreweryName] = useState("");
  const [editingBreweryId, setEditingBreweryId] = useState<number | null>(null);
  const [editBreweryName, setEditBreweryName] = useState("");

  // Type inputs
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editTypeName, setEditTypeName] = useState("");

  const [error, setError] = useState<string | null>(null);

  const asArray = (d: any) => (Array.isArray(d) ? d : []);

  const refreshPools = useCallback(() => {
    fetch(`/api/events/${eventId}/beer-options`).then((r) => r.json()).then((d) => setOptions(asArray(d))).catch(console.error);
    fetch(`/api/events/${eventId}/abv-options`).then((r) => r.json()).then((d) => setAbvs(asArray(d))).catch(console.error);
    fetch(`/api/types`).then((r) => r.json()).then((d) => setTypes(asArray(d))).catch(console.error);
    fetch(`/api/beer-options`).then((r) => (r.ok ? r.json() : [])).then((d) => setAllOptions(asArray(d))).catch(console.error);
    fetch(`/api/abv-ranges`).then((r) => (r.ok ? r.json() : [])).then((d) => setAllAbvs(asArray(d))).catch(console.error);
    fetch(`/api/breweries`).then((r) => (r.ok ? r.json() : [])).then((d) => setBreweries(asArray(d))).catch(console.error);
  }, [eventId]);

  const refreshBeers = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/beers`);
    setBeers(asArray(await res.json()));
  }, [eventId]);

  useEffect(() => {
    refreshBeers();
    refreshPools();
  }, [refreshBeers, refreshPools]);

  async function send(url: string, method: string, body: any) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.text()) || "Feil");
    return res;
  }
  const post = (url: string, body: any) => send(url, "POST", body);

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

  // ---- Catalog: create a beer ----
  const createBeer = guard(async () => {
    if (!nName.trim()) throw new Error("Skriv inn ølnavn");
    if (!nType) throw new Error("Velg type");
    if (!nAbv.trim() || isNaN(Number(nAbv.replace(",", ".")))) throw new Error("Skriv inn ABV (tall)");
    await post(`/api/beer-options`, {
      brewery_id: nBreweryId ? Number(nBreweryId) : null,
      name: nName.trim(),
      beer_type_id: Number(nType),
      abv: Number(nAbv.replace(",", ".")),
      untappd_link: nUntappd.trim() || null,
      event_id: eventId,
    });
    setNBreweryId("");
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

  function startEditBeer(o: CatalogBeer) {
    setEditBeer({
      id: o.id,
      brewery_id: o.brewery_id ? String(o.brewery_id) : "",
      name: o.name,
      beer_type_id: o.beer_type_id ? String(o.beer_type_id) : "",
      abv: o.abv != null ? String(o.abv) : "",
      untappd_link: o.untappd_link ?? "",
    });
  }

  const saveEditBeer = guard(async () => {
    if (!editBeer) return;
    if (!editBeer.name.trim()) throw new Error("Skriv inn ølnavn");
    await send(`/api/beer-options`, "PUT", {
      id: editBeer.id,
      brewery_id: editBeer.brewery_id ? Number(editBeer.brewery_id) : null,
      name: editBeer.name.trim(),
      beer_type_id: editBeer.beer_type_id ? Number(editBeer.beer_type_id) : null,
      abv: editBeer.abv.trim() === "" ? null : Number(editBeer.abv.replace(",", ".")),
      untappd_link: editBeer.untappd_link.trim() || null,
      event_id: eventId,
    });
    setEditBeer(null);
    refreshPools();
    refreshBeers();
  });

  async function detachBeer(optionId: number) {
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/beer-options`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beer_option_id: optionId }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Kunne ikke fjerne");
      refreshPools();
    } catch (e: any) {
      setError(e.message);
    }
  }

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

  // ---- Breweries ----
  const createBrewery = guard(async () => {
    if (!newBreweryName.trim()) throw new Error("Skriv inn bryggerinavn");
    await post(`/api/breweries`, { name: newBreweryName.trim() });
    setNewBreweryName("");
    refreshPools();
  });
  const saveBrewery = guard(async () => {
    if (editingBreweryId == null || !editBreweryName.trim()) return;
    await send(`/api/breweries`, "PUT", { id: editingBreweryId, name: editBreweryName.trim() });
    setEditingBreweryId(null);
    setEditBreweryName("");
    refreshPools();
    refreshBeers();
  });

  // ---- Types ----
  const createType = guard(async () => {
    if (!newTypeLabel.trim()) throw new Error("Skriv inn typenavn");
    await post(`/api/beer-types`, { label: newTypeLabel.trim() });
    setNewTypeLabel("");
    refreshPools();
  });
  const saveType = guard(async () => {
    if (editingTypeId == null || !editTypeName.trim()) return;
    await send(`/api/beer-types`, "PUT", { id: editingTypeId, label: editTypeName.trim() });
    setEditingTypeId(null);
    setEditTypeName("");
    refreshPools();
  });

  // ---- Fasit ----
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

  async function removeFasit(bid: number) {
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
  const poolBeers = allOptions.filter((o) => options.some((p) => p.id === o.id));
  const optionsNotInPool = allOptions.filter((o) => !options.some((p) => p.id === o.id));
  const abvsNotInPool = allAbvs.filter((a) => !abvs.some((p) => p.id === a.id));
  const typeName = (id: number | null) => types.find((t) => t.id === id)?.name ?? "?";
  const inFasit = (optId: number) => beers.some((b) => b.beer_option_id === optId);

  const typeOptions = (
    <>
      <option value="">Velg type</option>
      {types.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </>
  );
  const breweryOptions = (
    <>
      <option value="">Velg bryggeri…</option>
      {breweries.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </>
  );

  return (
    <div style={{ padding: "1.5rem", maxWidth: 820 }}>
      <h1>Øl, ABV og fasit – event #{eventId}</h1>
      {error && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>{error}</p>}

      {/* ------- SVAR-ALTERNATIVER (ØL-POOL) ------- */}
      <section style={box}>
        <h2>Svar-alternativer</h2>
        <p style={{ color: "#222" }}>Lag ny eller velg fra liste.</p>

        <h3>Gjeldende alternativer</h3>
        <ul>
          {poolBeers.map((o) => (
            <li key={o.id} style={{ marginBottom: "0.3rem" }}>
              {editBeer && editBeer.id === o.id ? (
                <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                  <select value={editBeer.brewery_id} onChange={(e) => setEditBeer({ ...editBeer, brewery_id: e.target.value })}>
                    {breweryOptions}
                  </select>
                  <input value={editBeer.name} onChange={(e) => setEditBeer({ ...editBeer, name: e.target.value })} placeholder="Ølnavn" />
                  <select value={editBeer.beer_type_id} onChange={(e) => setEditBeer({ ...editBeer, beer_type_id: e.target.value })}>
                    {typeOptions}
                  </select>
                  <input value={editBeer.abv} onChange={(e) => setEditBeer({ ...editBeer, abv: e.target.value })} placeholder="ABV %" style={{ width: 80 }} />
                  <input value={editBeer.untappd_link} onChange={(e) => setEditBeer({ ...editBeer, untappd_link: e.target.value })} placeholder="Untappd" style={{ width: 140 }} />
                  <button onClick={saveEditBeer}>Lagre</button>
                  <button onClick={() => setEditBeer(null)}>Avbryt</button>
                </span>
              ) : (
                <>
                  {o.display_name} — {typeName(o.beer_type_id)}
                  {o.abv != null ? `, ${o.abv}%` : " (mangler ABV)"}{" "}
                  <button onClick={() => startEditBeer(o)}>Endre</button>
                  <button onClick={() => detachBeer(o.id)} disabled={inFasit(o.id)} title={inFasit(o.id) ? "Fjern fra fasit først" : "Fjern fra eventet"} style={{ marginLeft: 4 }}>
                    Fjern
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>

        <h3>Lag nytt øl</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <select value={nBreweryId} onChange={(e) => setNBreweryId(e.target.value)}>{breweryOptions}</select>
          <input placeholder="Ølnavn" value={nName} onChange={(e) => setNName(e.target.value)} />
          <select value={nType} onChange={(e) => setNType(e.target.value)}>{typeOptions}</select>
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

      {/* ------- BRYGGERIER ------- */}
      <section style={box}>
        <h2>Bryggerier (globale)</h2>
        <ul>
          {breweries.map((b) => (
            <li key={b.id} style={{ marginBottom: "0.25rem" }}>
              {editingBreweryId === b.id ? (
                <>
                  <input value={editBreweryName} onChange={(e) => setEditBreweryName(e.target.value)} />
                  <button onClick={saveBrewery}>Lagre</button>
                  <button onClick={() => setEditingBreweryId(null)}>Avbryt</button>
                </>
              ) : (
                <>
                  {b.name}{" "}
                  <button onClick={() => { setEditingBreweryId(b.id); setEditBreweryName(b.name); }}>Endre</button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input placeholder="Nytt bryggeri" value={newBreweryName} onChange={(e) => setNewBreweryName(e.target.value)} />
          <button onClick={createBrewery}>Lag bryggeri</button>
        </div>
      </section>

      {/* ------- ABV-INTERVALLER ------- */}
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
            <li key={t.id} style={{ marginBottom: "0.25rem" }}>
              {editingTypeId === t.id ? (
                <>
                  <input value={editTypeName} onChange={(e) => setEditTypeName(e.target.value)} />
                  <button onClick={saveType}>Lagre</button>
                  <button onClick={() => setEditingTypeId(null)}>Avbryt</button>
                </>
              ) : (
                <>
                  {t.name}{" "}
                  <button onClick={() => { setEditingTypeId(t.id); setEditTypeName(t.name); }}>Endre</button>
                </>
              )}
            </li>
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
                <select defaultValue="" onChange={(e) => changeBeer(b.id, e.target.value)} style={{ marginLeft: 8 }}>
                  <option value="">Bytt øl…</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                <button onClick={() => removeFasit(b.id)} style={{ marginLeft: 6 }}>Slett</button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
