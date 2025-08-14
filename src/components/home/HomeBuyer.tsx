/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useState, useRef } from "react";
import Navbar from "../Navbar";
import Cart from "../home/Cart";
import toast from "react-hot-toast";
import { fetchWithRefresh } from "../../utils/fetchWithRefresh";

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

export default function HomeBuyer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [carousel, setCarousel] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [defaultOrder, setDefaultOrder] = useState<Product[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchWithRefresh("http://localhost:8080/api/products")
      .then((res) => res.json())
      .then((data) => {
        const sortedById = [...data].sort((a, b) => b.id - a.id);
        setProducts(sortedById);
        setFiltered(sortedById);
        setDefaultOrder(sortedById);
        const random5 = [...sortedById]
          .sort(() => 0.5 - Math.random())
          .slice(0, 5);
        setCarousel(random5);
        setSortMode("default");
      });
  }, []);

  useEffect(() => {
    if (carousel.length === 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      handleCarouselChange("right");
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [carousel, carouselIndex]);

  const handleCarouselChange = (dir: "left" | "right") => {
    setFade(false);
    setTimeout(() => {
      setCarouselIndex((prev) =>
        dir === "left"
          ? (prev - 1 + carousel.length) % carousel.length
          : (prev + 1) % carousel.length
      );
      setFade(true);
    }, 200);
  };

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

  const handleSearch = (query: string) => {
    const filteredList = products.filter((p) =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );
    setFiltered(filteredList);
    setDefaultOrder(filteredList);
    setSortMode("default");
  };

  const sortLabel =
    sortMode === "default"
      ? "Default"
      : sortMode === "desc"
      ? "Highest"
      : "Lowest";

  return (
    <>
      <Cart />
      <main className="p-4 min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
        <Navbar role="BUYER" onSearch={handleSearch} />

        {/* Carousel */}
        <div className="relative mb-10 flex items-center justify-center">
          <button
            aria-label="Scroll left"
            className="z-10 bg-white/90 border border-blue-200 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all absolute left-1/2 -translate-x-[220px] sm:-translate-x-[320px] md:-translate-x-[340px] lg:-translate-x-[370px] top-1/2 -translate-y-1/2"
            style={{ display: carousel.length > 1 ? "flex" : "none" }}
            onClick={() => handleCarouselChange("left")}
            type="button"
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="w-[420px] h-[280px] flex items-center justify-center mx-4 relative">
            {carousel.length > 0 && (
              <img
                key={carousel[carouselIndex].id}
                src={carousel[carouselIndex].imageUrl}
                alt={carousel[carouselIndex].title}
                className={`w-[420px] h-[280px] object-cover rounded-2xl border border-blue-100 shadow-lg transition-opacity duration-700 ${
                  fade ? "opacity-100" : "opacity-0"
                }`}
                style={{ background: "#e0e7ef" }}
              />
            )}
            {carousel.length > 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/80 px-4 py-1 rounded-lg shadow text-blue-700 font-semibold text-center text-lg">
                {carousel[carouselIndex].title}
              </div>
            )}
          </div>
          <button
            aria-label="Scroll right"
            className="z-10 bg-white/90 border border-blue-200 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all absolute right-1/2 translate-x-[220px] sm:translate-x-[320px] md:translate-x-[340px] lg:translate-x-[370px] top-1/2 -translate-y-1/2"
            style={{ display: carousel.length > 1 ? "flex" : "none" }}
            onClick={() => handleCarouselChange("right")}
            type="button"
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Sort Button */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={handleSort}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded shadow transition-all duration-150"
          >
            {sortLabel}
          </button>
        </div>

        {/* Product Cards */}
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
              <p className="text-sm text-gray-500 mb-1">
                {product.description}
              </p>
              <p className="text-blue-500 font-semibold mb-1">
                {product.price} IDR
              </p>
              <p className="text-xs text-blue-700 mb-2">
                Stock: <span className="font-bold">{product.quantity}</span>
              </p>
              <button
                className="mt-auto bg-blue-400 hover:bg-blue-500 px-3 py-2 rounded text-white w-full transition-all duration-150"
                onClick={async () => {
                  const buyerId = localStorage.getItem("userId");
                  if (!buyerId) {
                    toast.error("You must be logged in.");
                    return;
                  }

                  try {
                    // Use fetchWithRefresh to ensure Authorization header is set
                    const response = await fetchWithRefresh(
                      `http://localhost:8080/api/buyer/carts/add/${product.id}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ quantity: 1 }),
                      }
                    );

                    const text = await response.text();

                    if (!response.ok) {
                      toast.error(text || "Something went wrong.");
                    } else {
                      window.dispatchEvent(new Event("cartUpdated"));
                      toast.success(`Added ${product.title} to cart!`);
                    }
                  } catch (err) {
                    toast.error("Network error. Please try again.");
                  }
                }}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
