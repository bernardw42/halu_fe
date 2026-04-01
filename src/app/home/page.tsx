"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomeBuyer from "../../components/home/HomeBuyer";
import HomeSeller from "../../components/home/HomeSeller";

type Role = "BUYER" | "SELLER" | null;

export default function HomePage() {
  const [role, setRole] = useState<Role>(null);
  const router = useRouter();

  useEffect(() => {
    const storedRole = localStorage.getItem("role")?.toUpperCase() as Role;

    if (storedRole === "BUYER" || storedRole === "SELLER") {
      setRole(storedRole);
      return;
    }

    router.replace("/");
  }, [router]);

  if (!role) {
    return (
      <main className="page-shell flex items-center justify-center">
        <div className="panel flex w-full max-w-xl items-center justify-between gap-6 px-6 py-6 sm:px-8">
          <div>
            <p className="section-kicker">Preparing workspace</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Loading your marketplace view
            </h1>
          </div>
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#dfe9ff] border-t-[#1b5cff]" />
        </div>
      </main>
    );
  }

  return role === "SELLER" ? <HomeSeller /> : <HomeBuyer />;
}
