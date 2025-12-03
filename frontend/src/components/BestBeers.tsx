"use client";
import { useEffect, useState } from "react";
import styles from "./ResultsClient.module.css";

interface BeerScore {
  beerName: string;
  untappdLink: string;
  sum: number;
  ratings: number;
  average: any;
}

interface BeersData {
  beers: BeerScore[];
}

export default function BestBeers({ eventId }: { eventId: number }) {
  const [beers, setBeers] = useState<BeerScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadBeers = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/best_beers?event_id=${eventId}`);
          if (!mounted) return;
          if (res.ok) {
            const data: BeersData = await res.json();
            setBeers(data.beers ?? []);
          } else {
            console.error("Failed to fetch best beers:", res.status);
          }
        } catch (err) {
          console.error("Fetch best beers error:", err);
        } finally {
          if (mounted) setLoading(false);
        }
      };
      loadBeers();
      return () => {
        mounted = false;
      };
    }, [eventId]);

  if (loading) return <div>Laster beste øl…</div>;

  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Øl</th>
            <th className={styles.th}>Snitt</th>
            <th className={styles.th}>Poeng</th>
            <th className={styles.th}>Stemmer</th>
            <th className={styles.th}>Untappd</th>
          </tr>
        </thead>
        <tbody>
          {beers.map((beer) => (
            <tr key={beer.beerName} className={styles.row}>
              <td className={styles.td}>{beer.beerName}</td>
              <td className={styles.td}>{beer.average.toFixed(2)}</td>
              <td className={styles.td}>{beer.sum}</td>
              <td className={styles.td}>{beer.ratings}</td>
              <td className={styles.td}>
                {beer.untappdLink ? (
                <a
                    href={`https://untappd.com/beer/${beer.untappdLink}`}
                    onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `untappd://beer/${beer.untappdLink}`;
                    setTimeout(() => {
                        window.open(
                        `https://untappd.com/beer/${beer.untappdLink}`,
                        "_blank"
                        );
                    }, 500);
                    }}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.link}
                >
                    <img
                    src="/untappd.jpg"
                    alt="Untappd"
                    className={styles.untappdIcon}
                    />
                </a>
                ) : (
                " "
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}