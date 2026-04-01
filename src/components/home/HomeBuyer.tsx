"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../Navbar";
import Cart from "./Cart";
import { fetchWithRefresh } from "../../utils/fetchWithRefresh";
import { formatCurrency } from "../../utils/formatCurrency";
import { readApiError } from "../../utils/readApiError";
import AppImage from "../ui/AppImage";

type Product = {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  quantity: number;
};

type CartItem = {
  id: number;
  product: {
    id: number;
    title: string;
    price: number;
  };
  quantity: number;
};

type SortMode = "latest" | "price-desc" | "price-asc";

const PRODUCT_SKELETON_COUNT = 5;

const LOADING_FALLBACK_DELAY_MS = 5000;

export default function HomeBuyer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [cartLoading, setCartLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("latest");

  useEffect(() => {
    let isActive = true;
    const loadingFallbackTimer = window.setTimeout(() => {
      if (isActive) {
        setLoading(false);
      }
    }, LOADING_FALLBACK_DELAY_MS);

    setLoading(true);

    fetchWithRefresh("http://localhost:8080/api/products")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load products");
        }
        return res.json();
      })
      .then((data) => {
        if (!isActive) {
          return;
        }

        const productList = Array.isArray(data) ? data : [];
        const sortedProducts = [...productList].sort((a, b) => b.id - a.id);
        setProducts(sortedProducts);


        if (sortedProducts.length > 0) {
          window.clearTimeout(loadingFallbackTimer);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setProducts([]);

      });

    return () => {
      isActive = false;
      window.clearTimeout(loadingFallbackTimer);
    };
  }, []);

  useEffect(() => {
    const fetchCartSummary = async () => {
      setCartLoading(true);
      try {
        const res = await fetchWithRefresh("http://localhost:8080/api/buyer/carts");
        if (!res.ok) {
          throw new Error("Failed to load cart");
        }
        const data = await res.json();
        setCartItems(Array.isArray(data) ? data : []);
      } catch {
        setCartItems([]);
      } finally {
        setCartLoading(false);
      }
    };

    void fetchCartSummary();

    const listener = () => {
      void fetchCartSummary();
    };

    window.addEventListener("cartUpdated", listener);
    return () => {
      window.removeEventListener("cartUpdated", listener);
    };
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((product) => product.category.trim()))),
    ],
    [products]
  );

  const displayedProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesQuery =
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      return matchesQuery && matchesCategory;
    });

    if (sortMode === "price-desc") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    if (sortMode === "price-asc") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    return [...filtered].sort((a, b) => b.id - a.id);
  }, [activeCategory, products, searchQuery, sortMode]);

  const totalCartItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    [cartItems]
  );
  const cartPreviewItems = useMemo(() => cartItems.slice(0, 2), [cartItems]);

  const normalizedSearchQuery = searchQuery.trim();
  const isSearchMode = normalizedSearchQuery.length > 0;
  const spotlight = displayedProducts[0] ?? products[0] ?? null;
  const recommended = displayedProducts.slice(0, 12);
  const trendingCategories = categories.slice(1, 9);

  const handleAddToCart = async (product: Product) => {
    try {
      const response = await fetchWithRefresh(
        `http://localhost:8080/api/buyer/carts/add/${product.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: 1 }),
        }
      );

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      window.dispatchEvent(new Event("cartUpdated"));
      toast.success(`${product.title} added to cart.`);
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  const handleOpenCart = () => {
    window.dispatchEvent(new Event("openCart"));
  };

  const handleBrowseProducts = () => {
    document.getElementById("buyer-products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <>
      <Cart />
      <main className="page-shell">
        <Navbar role="BUYER" onSearch={setSearchQuery} />

        <div className="content-shell space-y-5">
          {!isSearchMode ? (
            <section className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
              <div className="overflow-hidden rounded-[30px] bg-gradient-to-r from-[#1b5cff] via-[#2a69ff] to-[#6d9cff] px-6 py-7 text-white shadow-[0_30px_70px_rgba(27,92,255,0.24)] sm:px-8 sm:py-9">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                  Today&apos;s picks
                </p>
                <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div>
                    <h1 className="text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
                      Everyday shopping, cleaner and faster.
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/78 sm:text-base">
                      Search, explore by category, and jump straight to products that feel relevant.
                    </p>
                    <div className="mt-6 flex min-h-10 flex-wrap gap-2">
                      {trendingCategories.slice(0, 4).map((category) => (
                        <button
                          key={category}
                          onClick={() => setActiveCategory(category)}
                          className="rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[28px] bg-white/12 p-4 backdrop-blur-sm">
                    <div className="min-h-[372px] rounded-[24px] bg-white p-4 text-slate-950">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5370a6]">
                        Spotlight product
                      </p>
                      {spotlight ? (
                        <Link
                          href={`/products/${spotlight.id}`}
                          className="group block rounded-[22px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9cb9ff] focus-visible:ring-offset-2"
                        >
                          <AppImage
                            src={spotlight.imageUrl}
                            alt={spotlight.title}
                            width={520}
                            height={360}
                            className="mt-4 h-52 w-full rounded-[22px] object-cover"
                          />
                          <h2 className="mt-4 line-clamp-2 h-14 text-xl font-semibold leading-7 transition group-hover:text-[#0f43c7]">
                            {spotlight.title}
                          </h2>
                        </Link>
                      ) : (
                        <div className="mt-4 flex h-[308px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d7e3f7] bg-[#fafcff] px-6 text-center">
                          <div className="h-16 w-16 rounded-[22px] bg-[#edf3ff]" />
                          <p className="mt-5 text-lg font-semibold text-slate-950">
                            Your spotlight slot stays here.
                          </p>
                          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                            Once products are available, the featured card will fill this same space.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="panel-strong min-h-[190px] px-5 py-5">
                  <p className="section-kicker">Popular categories</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {trendingCategories.slice(0, 6).length > 0
                      ? trendingCategories.slice(0, 6).map((category) => (
                          <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className="rounded-[22px] border border-[#d7e3f7] bg-[#f8fbff] px-4 py-4 text-left hover:border-[#9cb9ff] hover:bg-[#edf3ff]"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dfe9ff] text-sm font-semibold text-[#0f43c7]">
                              {category.slice(0, 2).toUpperCase()}
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-950">{category}</p>
                          </button>
                        ))
                      : Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={`shortcut-empty-${index}`}
                            className="rounded-[22px] border border-dashed border-[#d7e3f7] bg-[#f8fbff] px-4 py-4"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf3ff] text-sm font-semibold text-[#0f43c7]">
                              --
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-400">Waiting</p>
                          </div>
                        ))}
                  </div>
                </div>
                <div className="panel-strong min-h-[190px] px-5 py-5">
                  <p className="section-kicker">Cart preview</p>
                  {cartLoading ? (
                    <div className="mt-4 animate-pulse">
                      <div className="h-6 w-40 rounded bg-slate-100" />
                      <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                      <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
                      <div className="mt-5 h-14 rounded-[22px] bg-slate-100" />
                      <div className="mt-4 h-11 w-32 rounded-full bg-slate-100" />
                    </div>
                  ) : totalCartItems === 0 ? (
                    <div className="mt-3 flex min-h-[136px] flex-col">
                      <h2 className="text-xl font-semibold text-slate-950">
                        Your cart is empty right now.
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Give it something fun to hold. Pick a few finds and they will wait here for checkout.
                      </p>
                      <button
                        onClick={handleBrowseProducts}
                        className="primary-button mt-auto self-start px-4 py-2.5"
                      >
                        Start browsing
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex min-h-[136px] flex-col">
                      <h2 className="text-xl font-semibold text-slate-950">
                        Your items are waiting.
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {totalCartItems} item{totalCartItems === 1 ? "" : "s"} ready with a subtotal of {formatCurrency(cartSubtotal)}.
                      </p>
                      <div className="mt-4 space-y-2 rounded-[22px] border border-[#d7e3f7] bg-[#f8fbff] px-4 py-3">
                        {cartPreviewItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate font-medium text-slate-700">{item.product.title}</span>
                            <span className="shrink-0 text-slate-500">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleOpenCart}
                        className="primary-button mt-4 self-start px-4 py-2.5"
                      >
                        Open cart
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <section id="buyer-products" className="panel-strong px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="section-kicker">
                  {isSearchMode ? "Search results" : "Browse products"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {isSearchMode ? `Results for "${normalizedSearchQuery}"` : "Recommended for you"}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={
                    sortMode === "latest"
                      ? "secondary-button border-[#9cb9ff] bg-[#edf3ff] text-[#0f43c7]"
                      : "ghost-button rounded-full border border-[#d7e3f7] bg-white px-4"
                  }
                  onClick={() => setSortMode("latest")}
                >
                  Latest
                </button>
                <button
                  className={
                    sortMode === "price-desc"
                      ? "secondary-button border-[#9cb9ff] bg-[#edf3ff] text-[#0f43c7]"
                      : "ghost-button rounded-full border border-[#d7e3f7] bg-white px-4"
                  }
                  onClick={() => setSortMode("price-desc")}
                >
                  Highest price
                </button>
                <button
                  className={
                    sortMode === "price-asc"
                      ? "secondary-button border-[#9cb9ff] bg-[#edf3ff] text-[#0f43c7]"
                      : "ghost-button rounded-full border border-[#d7e3f7] bg-white px-4"
                  }
                  onClick={() => setSortMode("price-asc")}
                >
                  Lowest price
                </button>
              </div>
            </div>

            <div className="mt-5 flex min-h-10 flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={
                    activeCategory === category
                      ? "rounded-full border border-[#9cb9ff] bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#0f43c7]"
                      : "rounded-full border border-[#d7e3f7] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#f8fbff]"
                  }
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          <section>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: PRODUCT_SKELETON_COUNT }).map((_, index) => (
                  <div key={index} className="panel-strong animate-pulse px-4 py-4">
                    <div className="h-44 rounded-[24px] bg-slate-300" />
                    <div className="mt-4 h-4 w-24 rounded bg-slate-300" />
                    <div className="mt-3 h-5 w-2/3 rounded bg-slate-300" />
                    <div className="mt-3 h-4 w-full rounded bg-slate-300" />
                  </div>
                ))}
              </div>
            ) : recommended.length === 0 ? (
              <div className="panel-strong flex min-h-[326px] items-center justify-center px-6 py-10 text-center">
                <p className="max-w-md text-sm font-medium leading-6 text-slate-500">
                  {isSearchMode
                    ? `No products match "${normalizedSearchQuery}" yet.`
                    : "No products at the current time."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {recommended.map((product) => (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-[26px] border border-[#d7e3f7] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9cb9ff] focus-visible:ring-offset-2"
                    >
                      <AppImage
                        src={product.imageUrl}
                        width={420}
                        height={320}
                        className="h-44 w-full object-cover"
                        alt={product.title}
                      />
                    </Link>
                    <div className="px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5370a6]">
                        {product.category}
                      </p>
                      <Link href={`/products/${product.id}`} className="group mt-2 block">
                        <h3 className="line-clamp-2 h-12 text-base font-semibold leading-6 text-slate-950 transition group-hover:text-[#0f43c7]">
                          {product.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 h-12 text-sm leading-6 text-slate-500">
                          {product.description}
                        </p>
                      </Link>
                      <p className="mt-4 text-lg font-semibold text-[#0f43c7]">
                        {formatCurrency(product.price)}
                      </p>
                      <div className="mt-1 text-xs text-slate-500">
                        Stock {product.quantity}
                      </div>
                      <button
                        className="mt-4 w-full rounded-full bg-[#1b5cff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f43c7]"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to cart
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}