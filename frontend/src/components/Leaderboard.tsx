"use client";
import React from "react";
import styles from "./ResultsClient.module.css";

interface Standing {
  userId: number | string;
  userName: string;
  placement: number;
  points: number;
  beerPoints: number;
  abvPoints: number;
  typePoints: number;
}

export default function Leaderboard({
  standings,
  selectedUserId,
}: {
  standings: Standing[];
  selectedUserId: string;
}) {
  return (
    <div style={{ overflowX: "auto"}}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Plass</th>
            <th className={styles.th}>Deltaker</th>
            <th className={styles.th}>Poeng</th>
            <th className={styles.th}>Øl</th>
            <th className={styles.th}>ABV</th>
            <th className={styles.th}>Stil</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr
              key={String(s.userId)}
              className={`${styles.row} ${
                selectedUserId === String(s.userId) ? styles.rowSelected : ""
              }`}
            >
              <td className={styles.td}>{s.placement}</td>
              <td className={styles.td}>{s.userName}</td>
              <td className={styles.td} style={{ fontWeight: 700 }}>
                {s.points}
              </td>
              <td className={styles.td}>{s.beerPoints}</td>
              <td className={styles.td}>{s.abvPoints}</td>
              <td className={styles.td}>{s.typePoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}