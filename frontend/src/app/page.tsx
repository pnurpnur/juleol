import { auth, signOut } from "@/auth";
import Link from "next/link";
import EventSelector from "@/components/EventSelector";
import LoginButton from "@/components/LoginButton";
import { isAdminEmail } from "@/lib/authz";
import styles from "./page.module.css";

export default async function Home() {
  const session = await auth();

  const loggedIn = !!session;
  const userId = session?.user?.id; // Dette er intern autoincrement userId
  const admin = isAdminEmail(session?.user?.email);

  console.log("Session userId:", userId); // Skal nå vise et tall

  return (
    <div className={styles.pageBackground}>
      {/* Logo */}
      <Link href="/">
        <img src="/logo.png" alt="Logo" className={styles.logo} />
      </Link>

      {/* Event selector */}
      {loggedIn && userId ? (
        <EventSelector userId={Number(userId)} />
      ) : loggedIn ? (
        <div>Henter brukerinfo…</div>
      ) : (
        <div className={styles.middleSection}>
          <LoginButton />
        </div>
      )}

      {/* Admin-lenke (kun super-admin) */}
      {admin && (
        <div style={{ textAlign: "center", margin: "1rem 0" }}>
          <Link href="/admin/events" className={styles.button}>
            Admin: events
          </Link>
        </div>
      )}

      {/* Logg ut */}
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
