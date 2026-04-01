"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppImage from "./ui/AppImage";
import { fetchWithRefresh } from "../utils/fetchWithRefresh";

type ProfileState = {
  username: string;
  profileImageUrl: string;
};

const PROFILE_FALLBACK_URL =
  "https://ui-avatars.com/api/?name=User&background=e8f0ff&color=1b5cff&bold=true";
const profileCache = new Map<string, ProfileState>();
const inFlightProfileRequests = new Map<string, Promise<ProfileState>>();

function getDefaultProfile(role: "BUYER" | "SELLER"): ProfileState {
  return {
    username: role === "SELLER" ? "Seller" : "Buyer",
    profileImageUrl: PROFILE_FALLBACK_URL,
  };
}

async function loadProfile(userId: string, role: "BUYER" | "SELLER") {
  const cached = profileCache.get(userId);
  if (cached) {
    return cached;
  }

  const inFlight = inFlightProfileRequests.get(userId);
  if (inFlight) {
    return inFlight;
  }

  const request = fetchWithRefresh(`http://localhost:8080/api/users/${userId}`)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error("Failed to load profile");
      }

      const user = await res.json();
      return {
        username: user.username || (role === "SELLER" ? "Seller" : "Buyer"),
        profileImageUrl: user.profileImageUrl || PROFILE_FALLBACK_URL,
      } satisfies ProfileState;
    })
    .catch(() => getDefaultProfile(role))
    .then((profile) => {
      profileCache.set(userId, profile);
      return profile;
    })
    .finally(() => {
      inFlightProfileRequests.delete(userId);
    });

  inFlightProfileRequests.set(userId, request);
  return request;
}

function readSearchQuery() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("q") ?? "";
}

export default function Navbar({
  role,
  onSearch,
}: {
  role: "BUYER" | "SELLER";
  onSearch: (query: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(readSearchQuery);
  const [profile, setProfile] = useState<ProfileState>(() => {
    if (typeof window !== "undefined") {
      const userId = window.localStorage.getItem("userId");
      if (userId) {
        return profileCache.get(userId) ?? getDefaultProfile(role);
      }
    }

    return getDefaultProfile(role);
  });

  useEffect(() => {
    const query = readSearchQuery();
    setSearch(query);
    onSearch(query);
  }, [onSearch, pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const query = readSearchQuery();
      setSearch(query);
      onSearch(query);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onSearch]);

  useEffect(() => {
    let isActive = true;
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setProfile(getDefaultProfile(role));
      return () => {
        isActive = false;
      };
    }

    const cached = profileCache.get(userId);
    if (cached) {
      setProfile(cached);
      return () => {
        isActive = false;
      };
    }

    void loadProfile(userId, role).then((nextProfile) => {
      if (isActive) {
        setProfile(nextProfile);
      }
    });

    return () => {
      isActive = false;
    };
  }, [role]);

  const updateSearchQuery = (query: string) => {
    setSearch(query);
    onSearch(query);

    const params = new URLSearchParams(window.location.search);
    if (query.trim()) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.replaceState(window.history.state, "", nextUrl);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    }

    profileCache.clear();
    inFlightProfileRequests.clear();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    router.replace("/");
  };

  const primaryLink =
    role === "BUYER"
      ? { href: "/payment", label: "Orders" }
      : { href: "/sales", label: "Sales" };

  return (
    <header className="content-shell sticky top-4 z-30 mb-5">
      <div className="panel-strong px-4 py-4 sm:px-5">
        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_auto] xl:items-center">
          <div className="flex items-center gap-3">
            <Link href="/home" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1b5cff] text-lg font-bold text-white shadow-[0_14px_28px_rgba(27,92,255,0.22)]">
                H
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-950">Halu</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {role === "BUYER" ? "Marketplace" : "Seller Center"}
                </p>
              </div>
            </Link>
          </div>

          <label className="relative block w-full">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              className="input-field pl-11"
              placeholder={
                role === "BUYER"
                  ? "Search products, stores, or categories"
                  : "Search your products"
              }
              value={search}
              onChange={(event) => {
                updateSearchQuery(event.target.value);
              }}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <Link
              href={primaryLink.href}
              className={
                pathname?.startsWith(primaryLink.href)
                  ? "ghost-button rounded-full bg-[#edf3ff] px-4 text-[#0f43c7]"
                  : "ghost-button rounded-full bg-white px-4"
              }
            >
              {primaryLink.label}
            </Link>
            <div className="min-w-[220px] max-w-[280px] flex-1 rounded-2xl border border-[#d7e3f7] bg-[#f8fbff] px-3 py-2 sm:flex sm:items-center sm:gap-3 xl:flex-none">
              <div className="flex items-center gap-3">
                <AppImage
                  src={profile.profileImageUrl}
                  alt={profile.username}
                  width={42}
                  height={42}
                  className="h-10 w-10 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold leading-5 text-slate-950">
                    {profile.username}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {role === "BUYER" ? "Buyer account" : "Seller account"}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="ghost-button rounded-full px-4">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

