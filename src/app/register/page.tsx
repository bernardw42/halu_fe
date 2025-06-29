"use client";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");

  const handleRegister = async () => {
    const res = await fetch("http://localhost:8080/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });

    if (res.ok) window.location.href = "/"; // ✅ avoids deprecated useRouter
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-blue-700">Register</h1>
        <input
          className="mb-2 border border-blue-200 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="mb-2 border border-blue-200 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          className="mb-2 border border-blue-200 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black"
          value={role}
          onChange={(e) => setRole(e.target.value as "BUYER" | "SELLER")}
        >
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
        </select>
        <button
          onClick={handleRegister}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full transition-all duration-150"
        >
          Register
        </button>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link
            href="/"
            className="text-blue-500 underline hover:text-blue-700 transition-all duration-150"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
