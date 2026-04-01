"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { readApiError } from "../utils/readApiError";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", String(data.userId));
      toast.success("Login successful.");
      router.replace("/home");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell flex min-h-[100dvh] items-center justify-center py-4">
      <div className="content-shell max-w-md">
        <section className="panel-strong px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-col items-center text-center">
            <Link href="/" className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#1b5cff] text-xl font-bold text-white shadow-[0_18px_36px_rgba(27,92,255,0.26)]">
                H
              </div>
              <div>
                <p className="text-[30px] font-semibold tracking-[-0.06em] text-slate-950">
                  Halu App
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                  Buyer &amp; Seller Access
                </p>
              </div>
            </Link>

            <div className="mt-7 space-y-2">
              <p className="section-kicker">Sign in</p>
              <h1 className="text-xl font-semibold text-slate-950">Welcome back</h1>
              <p className="text-sm text-slate-500">Use your account to continue.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-7 space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                className="input-field"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !username.trim() || !password}
              className="primary-button mt-1 w-full"
            >
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-[#0f43c7]">
              Register here
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

