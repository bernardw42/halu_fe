"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { uploadImageToCloudinary } from "../create-product/utils/uploadImage";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [nationalId, setNationalId] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // ✅ Auto logout on page load
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    console.log("✅ Cleared local storage on RegisterPage load");
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Only JPG or PNG images are allowed.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setImageUrl(url);
    } catch {
      alert("Image upload failed.");
      setImageUrl("");
    }
    setUploading(false);
  };

  const handleRegister = async () => {
    if (!nationalId) {
      toast.error("National ID is required!");
      return;
    }
    if (!imageUrl) {
      toast.error("Image upload is required!");
      return;
    }
    const res = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        role,
        nationalId,
        profileImageUrl: imageUrl,
      }),
    });

    if (res.ok) {
      toast.success("Registration successful!");
      window.location.href = "/";
    } else {
      toast.error("Registration failed!");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-blue-700">Register</h1>
        <input
          className="mb-2 border border-blue-200 p-2 rounded w-full text-black"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="mb-2 border border-blue-200 p-2 rounded w-full text-black"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="mb-2 border border-blue-200 p-2 rounded w-full text-black"
          placeholder="National ID"
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
        />
        <input
          className="mb-2 border border-blue-200 p-2 rounded w-full text-black"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
        />
        {uploading && (
          <div className="mb-2 text-blue-500">Uploading image...</div>
        )}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Uploaded"
            className="mb-2 rounded max-h-32 mx-auto"
          />
        )}
        <select
          className="mb-2 border border-blue-200 p-2 rounded w-full text-black"
          value={role}
          onChange={(e) => setRole(e.target.value as "BUYER" | "SELLER")}
        >
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
        </select>
        <button
          onClick={handleRegister}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full transition-all duration-150"
          disabled={uploading}
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
