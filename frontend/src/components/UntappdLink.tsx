"use client";
import React from "react";
import { useOpenUntappd } from "../lib/hooks/useOpenUntappd";
import styles from "./UntappdLink.module.css"; // eller bruk ditt eksisterende styles

export function UntappdLink({ beerId }: { beerId: string | number }) {
  const { openBeer } = useOpenUntappd();

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        openBeer(beerId);
      }}
      className={styles.link}
    >
      <img
        src="/untappd.jpg"
        alt="Untappd"
        className={styles.untappdIcon}
      />
    </a>
  );
}
