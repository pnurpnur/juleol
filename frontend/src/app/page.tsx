import { auth, signOut } from "@/auth";
import Link from "next/link";
import EventSelector from "@/components/EventSelector";
import LoginButton from "@/components/LoginButton";
import styles from "./page.module.css";

export default async function Home() {
  const session = await auth();

  const loggedIn = !!session;

  return (
    <div className={styles.pageBackground}>

      {/* Logo */}
      <Link href="/">
        <img src="/logo.png" alt="Logo" className={styles.logo} />
      </Link>

      {/* Event selector */}
      {loggedIn && (
        <>
          <EventSelector userId={session?.user?.id} />
        </>
      )}

      {/* Login button — only when not logged in */}
      {!loggedIn && (
        <div className={styles.middleSection}>
          <LoginButton />
        </div>
      )}

      {/* Logg ut — always at the very bottom if logged in */}
      {loggedIn && (
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
          className={styles.logoutWrapper}
        >
          <button className={`${styles.button} ${styles.logoutButton}`}>
            Logg ut
          </button>
        </form>
      )}
    </div>
  );
}
