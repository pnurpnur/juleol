"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EventBeers() {
  const params = useParams();
  const eventId = Number(params.id);
  const [beers, setBeers] = useState([]);
  const [beerOptionId, setBeerOptionId] = useState("");
  const [abvRangeId, setAbvRangeId] = useState("");
  const [beerTypeId, setBeerTypeId] = useState("");
  const [options, setOptions] = useState([]);
  const [abvs, setAbvs] = useState([]);
  const [types, setTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetch(`/api/events/${eventId}/beers`).then(r=>r.json()).then(setBeers).catch(console.error);
    fetch(`/api/events/${eventId}/beer-options`).then(r=>r.json()).then(setOptions).catch(console.error);
    fetch(`/api/events/${eventId}/abv-options`).then(r=>r.json()).then(setAbvs).catch(console.error);
    fetch('/api/types').then(r=>r.json()).then(setTypes).catch(console.error);
  }, [eventId]);

  async function add() {
    await fetch(`/api/events/${eventId}/beers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beer_option_id: beerOptionId === '' ? null : Number(beerOptionId),
        abv_range_id: abvRangeId === '' ? null : Number(abvRangeId),
        beer_type_id: beerTypeId === '' ? null : Number(beerTypeId),
      }),
    });
    setBeerOptionId("");
    setAbvRangeId("");
    setBeerTypeId("");
    const res = await fetch(`/api/events/${eventId}/beers`);
    setBeers(await res.json());
  }

  async function remove(bid) {
    await fetch(`/api/events/${eventId}/beers`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beerId: bid,
      }),
    });
    setBeers(await (await fetch(`/api/events/${eventId}/beers`)).json());
  }

  function startEdit(beer) {
    setEditingId(beer.id);
    setEditForm({
      beer_option_id: beer.beer_option_id ?? '',
      abv_range_id: beer.abv_range_id ?? '',
      beer_type_id: beer.beer_type_id ?? '',
    });
  }

  async function saveEdit(bid) {
    await fetch(`/api/events/${eventId}/beers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        beer_option_id: editForm.beer_option_id === '' ? null : Number(editForm.beer_option_id),
        abv_range_id: editForm.abv_range_id === '' ? null : Number(editForm.abv_range_id),
        beer_type_id: editForm.beer_type_id === '' ? null : Number(editForm.beer_type_id),
        beer_id: bid,
      }),
    });
    setEditingId(null);
    const res = await fetch(`/api/events/${eventId}/beers`);
    setBeers(await res.json());
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  return (
    <div>
      <h2>Beers in event {eventId}</h2>
      <div>
        <select value={beerOptionId} onChange={e=>setBeerOptionId(e.target.value)}>
          <option value="">Select beer option</option>
          {options.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={abvRangeId} onChange={e=>setAbvRangeId(e.target.value)}>
          <option value="">Select ABV</option>
          {abvs.map(a=> <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <select value={beerTypeId} onChange={e=>setBeerTypeId(e.target.value)}>
          <option value="">Select Type</option>
          {types.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={add}>Add beer</button>
      </div>

      <ul>
        {beers.map(b=>(
          <li key={b.id}>
            {editingId === b.id ? (
              <>
                <select
                  value={editForm.beer_option_id}
                  onChange={e=>setEditForm({...editForm, beer_option_id: e.target.value})}
                >
                  <option value="">Select beer option</option>
                  {options.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <select
                  value={editForm.abv_range_id}
                  onChange={e=>setEditForm({...editForm, abv_range_id: e.target.value})}
                >
                  <option value="">Select ABV</option>
                  {abvs.map(a=> <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
                <select
                  value={editForm.beer_type_id}
                  onChange={e=>setEditForm({...editForm, beer_type_id: e.target.value})}
                >
                  <option value="">Select Type</option>
                  {types.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button onClick={() => saveEdit(b.id)}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
              </>
            ) : (
              <>
                #{b.id} option {b.beer_option_id} abv {String(b.abv_range_id)} type {String(b.beer_type_id)}
                <button onClick={() => startEdit(b)}>Edit</button>
                <button onClick={()=>remove(b.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
