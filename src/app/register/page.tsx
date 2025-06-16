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
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <input
        className="mb-2 border p-2"
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="mb-2 border p-2"
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <select
        className="mb-2 border p-2"
        value={role}
        onChange={(e) => setRole(e.target.value as "BUYER" | "SELLER")}
      >
        <option value="BUYER">Buyer</option>
        <option value="SELLER">Seller</option>
      </select>
      <button
        onClick={handleRegister}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Register
      </button>
      <p className="mt-4">
        Already have an account?{" "}
        <Link href="/" className="text-blue-500 underline">
          Login
        </Link>
      </p>
    </main>
  );
}
