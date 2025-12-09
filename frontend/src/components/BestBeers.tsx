"use client";
import { useEffect, useState } from "react";
import styles from "./ResultsClient.module.css";

interface BeerScore {
  beerOrder: number;
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
            <th className={styles.th}>Nr</th>
            <th className={styles.th}>Snitt</th>
            <th className={styles.th}>Untappd</th>
          </tr>
        </thead>
        <tbody>
          {beers.map((beer) => (
            <tr key={beer.beerName} className={styles.row}>
              <td className={styles.td}>{beer.beerName}</td>
              <td className={styles.td}>{beer.beerOrder}</td>
              <td className={styles.td}>{beer.average.toFixed(2)}</td>
              <td className={styles.td}>
                {beer.untappdLink ? (
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();

                        const appUrl = `untappd://beer/${beer.untappdLink}`;
                        const webUrl = `https://untappd.com/beer/${beer.untappdLink}`;

                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                        const start = Date.now();

                        if (!isMobile) {
                        // PC → bare åpne web i ny fane
                        window.open(webUrl, "_blank", "noopener,noreferrer");
                        return;
                        }

                        // --- MOBILE ---
                        // Prøv åpne app
                        window.location.href = appUrl;

                        // fallback til web *i ny fane* dersom app ikke eksisterer
                        setTimeout(() => {
                        const now = Date.now();

                        // Hvis appen ikke åpnet (brukeren fortsatt i browser)
                        if (now - start < 1500) {
                            window.open(webUrl, "_blank", "noopener,noreferrer");
                        }
                        }, 700);
                    }}
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