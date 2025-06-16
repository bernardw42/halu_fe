"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [carousel, setCarousel] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        // Pick 5 random carousel items
        const random5 = data.sort(() => 0.5 - Math.random()).slice(0, 5);
        setCarousel(random5);
      });
  }, []);

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="p-4">
      {/* 🔍 Search Bar */}
      <input
        className="w-full border p-2 mb-4"
        placeholder="Search products..."
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 🎠 Carousel */}
      <div className="overflow-x-auto whitespace-nowrap mb-6">
        {carousel.map((product) => (
          <div
            key={product.id}
            className="inline-block w-64 mr-4 border rounded shadow-sm"
          >
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-2">
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-gray-600">{product.price} IDR</p>
            </div>
          </div>
        ))}
      </div>

      {/* 🛒 Product Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="border rounded p-2 shadow-sm">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-40 object-cover mb-2"
            />
            <h2 className="font-bold">{product.title}</h2>
            <p className="text-sm text-gray-600">{product.description}</p>
            <p className="text-green-600 font-semibold">{product.price} IDR</p>
            <button
              className="mt-2 bg-yellow-400 px-3 py-1 rounded text-white w-full"
              onClick={() => alert(`Added product ${product.id} to cart!`)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
