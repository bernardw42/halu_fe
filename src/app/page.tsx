"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const role = username.startsWith("s") ? "SELLER" : "BUYER";
    localStorage.setItem("role", role);
    localStorage.setItem("userId", "1");
    window.location.href = "/home"; // ✅ no useRouter
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-blue-700 text-center">
          Login
        </h1>
        <input
          className="mb-3 border border-blue-200 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="mb-3 border border-blue-200 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white px-4 py-2 rounded-lg w-full font-semibold shadow transition-all"
        >
          Login
        </button>
        <p className="mt-4 text-center text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-500 underline hover:text-blue-700 transition-all duration-150"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
