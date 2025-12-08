"use client";
import React, { useEffect, useState } from "react";
import Leaderboard from "./Leaderboard";
import styles from "./ResultsClient.module.css";

interface UserResult {
  eventBeerId: number;
  correctOptionName?: string;
  correctAbvName?: string;
  correctTypeName?: string;
  guessedOptionName?: string;
  guessedAbvName?: string;
  guessedTypeName?: string;
  correct: boolean;
  abvCorrect: boolean;
  typeCorrect: boolean;
  rating?: number;
  untappdScore?: number;
  untappdLink?: string;
}

interface Standing {
  userId: number | string;
  userName: string;
  placement: number;
  points: number;
  beerPoints: number;
  abvPoints: number;
  typePoints: number;
}

interface ResultsData {
  standings: Standing[];
  totalParticipants: number;
}

interface UserResultsData {
  eventId: number;
  userId: string | number;
  items: UserResult[];
}

export default function ResultsClient({
  eventId,
  userId,
  isOwner,
  initialResults,
}: {
  eventId: number;
  userId: number;
  isOwner: boolean;
  initialResults?: ResultsData;
}) {
  const [standings, setStandings] = useState<Standing[]>(
    initialResults?.standings ?? []
  );
  const [userResults, setUserResults] = useState<Map<number, UserResult[]>>(
    new Map()
  );
  const [loading, setLoading] = useState<boolean>(!initialResults);

  useEffect(() => {
    let mounted = true;
    const fetchStandings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?event_id=${eventId}`);
        if (!mounted) return;
        if (res.ok) {
          const data: ResultsData = await res.json();
          setStandings(data.standings);
        } else {
          console.error("Failed to fetch standings:", res.status);
        }
      } catch (err) {
        console.error("Fetch standings error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (!initialResults && !isOwner) fetchStandings();
    else setLoading(false);
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `/api/user_results?event_id=${eventId}&user_id=${userId}`
        );
        if (!mounted) return;
        if (res.ok) {
          const data: UserResultsData = await res.json();
          setUserResults((prev) => {
            const copy = new Map(prev);
            copy.set(userId, data.items);
            return copy;
          });
        } else {
          console.error("Failed to fetch user results:", res.status);
        }
      } catch (err) {
        console.error("Fetch user results error:", err);
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, [eventId, userId]);

  const currentUserItems = userResults.get(userId);
  const currentStanding = standings.find(
    (s) => s.userId === userId
  );

  if (loading) return <div>Laster resultater…</div>;

  return (
    <section className={styles.container}>
        {!isOwner && currentStanding && (
            <>
                <div className={styles.standingsDiv}>
                    <h3>
                        {currentStanding.points} poeng ({currentStanding.placement}. plass)
                    </h3>
                </div>
            </>
        )}

        <div className={styles.tableDiv}>
          <table className={styles.table}>
            <thead>
            <tr>
                <th className={styles.th}>#</th>
                <th className={styles.th}>Øl</th>
                {!isOwner && (
                <>
                    <th className={styles.th}>Gjett</th>
                    <th className={styles.th}>ABV</th>
                    <th className={styles.th}>Gjett</th>
                    <th className={styles.th}>Stil</th>
                    <th className={styles.th}>Gjett</th>
                </>
            )}
                <th className={styles.th}>Rating</th>
                <th className={styles.th}>Untappd</th>
            </tr>
            </thead>
            <tbody>
            {currentUserItems?.map((item) => (
                <tr key={item.eventBeerId} className={styles.row}>
                <td className={styles.td}>{item.eventBeerId}</td>
                <td className={styles.td}>{item.correctOptionName ?? "-"}</td>
                {!isOwner && (
                    <>
                        <td
                        className={`${styles.td} ${
                            item.guessedOptionName
                            ? item.correct
                                ? styles.correct
                                : styles.incorrect
                            : ""
                        }`}
                        >
                        {item.guessedOptionName ?? "-"}
                        </td>

                        <td className={styles.td}>{item.correctAbvName ?? "-"}</td>
                        <td
                        className={`${styles.td} ${
                            item.guessedAbvName
                            ? item.abvCorrect
                                ? styles.correct
                                : styles.incorrect
                            : ""
                        }`}
                        >
                        {item.guessedAbvName ?? "-"}
                        </td>

                        <td className={styles.td}>{item.correctTypeName ?? "-"}</td>
                        <td
                        className={`${styles.td} ${
                            item.guessedTypeName
                            ? item.typeCorrect
                                ? styles.correct
                                : styles.incorrect
                            : ""
                        }`}
                        >
                        {item.guessedTypeName ?? "-"}
                        </td>
                    </>
                )}
                <td className={styles.td}>{item.rating ?? "-"}</td>
                <td className={styles.td}>
                    {item.untappdScore}
                    {item.untappdLink ? (
                    <a
                        href={`https://untappd.com/beer/${item.untappdLink}`}
                        onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `untappd://beer/${item.untappdLink}`;
                        setTimeout(() => {
                            window.open(
                            `https://untappd.com/beer/${item.untappdLink}`,
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
                    "-"
                    )}
                </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
    </section>
  );
}