import { auth } from "@/auth";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

export function isAdminEmail(email?: string | null): boolean {
  const admin = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  return !!admin && !!email && email.toLowerCase().trim() === admin;
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** True when the logged-in user is the super-admin. */
export async function currentIsAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return isAdminEmail(user?.email);
}

/**
 * Call the Go backend, forwarding the verified session identity (and the shared
 * internal secret) so the backend can authorize admin/host actions. Use this
 * for every privileged / mutating call.
 */
export async function callBackend(path: string, init: RequestInit = {}) {
  const user = await getSessionUser();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (user?.id != null) headers.set("X-User-Id", String(user.id));
  if (user?.email) headers.set("X-User-Email", user.email);
  if (INTERNAL_SECRET) headers.set("X-Internal-Secret", INTERNAL_SECRET);

  return fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
}
