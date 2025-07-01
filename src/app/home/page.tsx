"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HomeBuyer = dynamic(() => import("../../components/home/HomeBuyer"));
const HomeSeller = dynamic(() => import("../../components/home/HomeSeller"));

export default function HomePage() {
  const [role, setRole] = useState<"BUYER" | "SELLER" | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role")?.toUpperCase() as
      | "BUYER"
      | "SELLER"
      | null;

    if (storedRole === "BUYER" || storedRole === "SELLER") {
      setRole(storedRole);
    } else {
      setRole(null);
    }
  }, []);

  if (!role) return <p className="p-4">Loading...</p>;

  return role === "SELLER" ? <HomeSeller /> : <HomeBuyer />;
}
