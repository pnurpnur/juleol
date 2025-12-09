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
  selectedUserId: number;
}) {
  return (
    <div style={{ overflowX: "auto"}}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>#</th>
            <th className={styles.th}>Navn</th>
            <th className={[styles.th, styles.center].join(" ")}>P</th>
            <th className={[styles.th, styles.center].join(" ")}>Øl/ABV/Stil</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr
              key={String(s.userId)}
              className={`${styles.row} ${
                selectedUserId === s.userId ? styles.rowSelected : ""
              }`}
            >
              <td className={styles.td}>{s.placement}</td>
              <td className={styles.td}>{s.userName}</td>
              <td className={[styles.td, styles.center].join(" ")}>{s.points}</td>
              <td className={[styles.td, styles.center].join(" ")}>{s.beerPoints}/{s.abvPoints}/{s.typePoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}