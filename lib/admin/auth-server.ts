import "server-only";

import { redirect } from "next/navigation";
import { isMasterEmail } from "@/lib/admin/master";
import { createServerSupabaseForAuth } from "@/lib/supabase/cookie-server";

export async function getMasterUser() {
  const supabase = await createServerSupabaseForAuth();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email || !isMasterEmail(user.email)) return null;
  return user;
}

export async function assertMasterOrRedirect() {
  const supabase = await createServerSupabaseForAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/admin/login");
  if (!isMasterEmail(user.email)) {
    redirect("/admin/login?error=forbidden");
  }
  return user;
}
