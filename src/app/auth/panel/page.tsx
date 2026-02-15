import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/account-auth/guards";

export default async function AuthPanelRedirectPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?next=/auth/panel");
  }

  if (user.role === "CREATOR") {
    redirect("/creator");
  }

  redirect("/admin");
}
