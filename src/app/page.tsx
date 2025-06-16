"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  // const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const role = username.startsWith("s") ? "SELLER" : "BUYER";
    localStorage.setItem("role", role);
    localStorage.setItem("userId", "1");
    window.location.href = "/home"; // ✅ no useRouter
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <input
        className="mb-2 border p-2"
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="mb-2 border p-2"
        placeholder="Password"
        type="password"
        // onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Login
      </button>
      <p className="mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-500 underline">
          Register
        </Link>
      </p>
    </main>
  );
}
