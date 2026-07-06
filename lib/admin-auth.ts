import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "diagpro_admin_session";

function expectedToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(password).digest("hex");
}

export function tokenMatchesPassword(password: string): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  return createHash("sha256").update(password).digest("hex") === expectedToken();
}

export function sessionToken(): string {
  return expectedToken();
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!value || !process.env.ADMIN_PASSWORD) return false;
  return value === expectedToken();
}
