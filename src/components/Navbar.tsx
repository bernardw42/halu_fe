"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar({
  role,
  onSearch,
}: {
  role: "BUYER" | "SELLER";
  onSearch: (query: string) => void;
}) {
  const [search, setSearch] = useState("");

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    // If you have a refresh token, call logout API
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

    // Clear local storage regardless
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");

    window.location.href = "/";
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-400 border-b border-blue-800 shadow-sm flex flex-col md:flex-row items-center justify-between px-6 py-4 mb-6 rounded-xl mx-2 mt-2">
      <Link
        href="/home"
        className="text-2xl font-extrabold text-white tracking-tight hover:text-blue-100 transition-all duration-150"
      >
        HaluApp
      </Link>

      <input
        className="mt-3 md:mt-0 md:ml-6 p-2 w-full md:w-1/3 rounded border border-white bg-white text-black placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
        placeholder={
          role === "BUYER"
            ? "Search all products..."
            : "Search your products..."
        }
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onSearch(e.target.value);
        }}
      />

      <div className="mt-3 md:mt-0 md:ml-6 flex gap-2 items-center">
        {/* 🧾 Buyer: Payment | 📦 Seller: Sales */}
        {role === "BUYER" && (
          <Link href="/payment">
            <button className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-100 transition-all">
              Payment
            </button>
          </Link>
        )}
        {role === "SELLER" && (
          <Link href="/sales">
            <button className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-100 transition-all">
              Sales
            </button>
          </Link>
        )}

        {/* 🚪 Logout */}
        <button
          onClick={handleLogout}
          className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-100 transition-all"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
