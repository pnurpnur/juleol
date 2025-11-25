"use client";

import { signIn } from "next-auth/react";
import styles from "./LoginButton.module.css";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className={styles.googleButton}
    >
      <img src="/google-icon.png" alt="" className={styles.icon} />
      <span>Logg inn med Google</span>
    </button>
  );
}
