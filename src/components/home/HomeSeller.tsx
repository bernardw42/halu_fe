"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../Navbar";
import toast from "react-hot-toast";

type Product = {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  quantity: number;
};

type SortMode = "default" | "desc" | "asc";

export default function HomeSeller() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [defaultOrder, setDefaultOrder] = useState<Product[]>([]);
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:8080/api/products/seller/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        // Sort by latest/highest id by default
        const sortedById = [...data].sort((a, b) => b.id - a.id);
        setProducts(sortedById);
        setFiltered(sortedById);
        setDefaultOrder(sortedById);
        setSortMode("default");
      });
  }, [userId]);

  // 3-mode sort handler
  const handleSort = () => {
    let nextMode: SortMode;
    if (sortMode === "default") nextMode = "desc";
    else if (sortMode === "desc") nextMode = "asc";
    else nextMode = "default";

    setSortMode(nextMode);

    if (nextMode === "default") {
      setFiltered([...defaultOrder]);
    } else if (nextMode === "desc") {
      setFiltered([...filtered].sort((a, b) => b.price - a.price));
    } else if (nextMode === "asc") {
      setFiltered([...filtered].sort((a, b) => a.price - b.price));
    }
  };

  const handleDelete = (productId: number) => {
    if (!userId) {
      toast.error("User not identified.");
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to delete this product?</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const res = await fetch(
                    `http://localhost:8080/api/products/${userId}/${productId}`,
                    {
                      method: "DELETE",
                    }
                  );

                  const text = await res.text();

                  if (res.ok) {
                    const updated = products.filter((p) => p.id !== productId);
                    setProducts(updated);
                    setFiltered(updated);
                    setDefaultOrder(updated);
                    toast.success(text || "Product deleted successfully.");
                  } else {
                    toast.error(text || "Failed to delete product.");
                  }
                } catch (err) {
                  console.error("Delete error:", err);
                  toast.error("An error occurred while deleting.");
                }
              }}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 text-black px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  // Update filtered when searching
  const handleSearch = (query: string) => {
    const filteredList = products.filter((p) =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );
    setFiltered(filteredList);
    setDefaultOrder(filteredList);
    setSortMode("default");
  };

  // Button label
  const sortLabel =
    sortMode === "default"
      ? "Default"
      : sortMode === "desc"
      ? "Highest"
      : "Lowest";

  return (
    <main className="p-4 min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
      <Navbar role="SELLER" onSearch={handleSearch} />

      <div className="mb-4 flex gap-2">
        <Link
          href="/create-product"
          className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded shadow transition-all duration-150"
        >
          Create Product
        </Link>
        <button
          onClick={handleSort}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded shadow transition-all duration-150"
        >
          {sortLabel}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-lg p-4 flex flex-col hover:shadow-2xl transition-all duration-200 border border-blue-100"
          >
            <img
              src={product.imageUrl}
              className="w-full h-40 object-cover mb-3 rounded-lg border border-blue-100"
              alt={product.title}
            />
            <h2 className="font-bold text-lg text-blue-700 mb-1">
              {product.title}
            </h2>
            <p className="text-sm text-gray-500 mb-1">{product.description}</p>
            <p className="text-blue-500 font-semibold mb-1">
              {product.price} IDR
            </p>
            <p className="text-xs text-blue-700 mb-2">
              Stock: <span className="font-bold">{product.quantity}</span>
            </p>
            <div className="flex gap-2 mt-auto">
              <Link
                href={`/edit-product/${product.id}`}
                className="bg-blue-400 hover:bg-blue-500 text-white px-3 py-1 rounded transition-all duration-150"
              >
                Edit
              </Link>
              <button
                className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded transition-all duration-150"
                onClick={() => handleDelete(product.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
