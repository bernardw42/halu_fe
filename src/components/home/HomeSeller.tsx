"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Navbar from "../Navbar";
import AppImage from "../ui/AppImage";
import { fetchWithRefresh } from "../../utils/fetchWithRefresh";
import { formatCurrency } from "../../utils/formatCurrency";
import { readApiError } from "../../utils/readApiError";

type Product = {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  quantity: number;
};

type SortMode = "latest" | "price-desc" | "price-asc";

const SELLER_SKELETON_ROWS = 5;
const LOADING_FALLBACK_DELAY_MS = 5000;

export default function HomeSeller() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [loading, setLoading] = useState(true);
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    let isActive = true;

    if (!userId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const loadingFallbackTimer = window.setTimeout(() => {
      if (isActive) {
        setLoading(false);
      }
    }, LOADING_FALLBACK_DELAY_MS);

    setLoading(true);
    fetchWithRefresh(`http://localhost:8080/api/products/seller/${userId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load seller products");
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
  }, [userId]);

  const displayedProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = products.filter((product) =>
      [product.title, product.category, product.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );

    if (sortMode === "price-desc") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    if (sortMode === "price-asc") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    return [...filtered].sort((a, b) => b.id - a.id);
  }, [products, searchQuery, sortMode]);

  const lowStockCount = products.filter((product) => product.quantity <= 5).length;
  const totalValue = products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );
  const normalizedSearchQuery = searchQuery.trim();
  const isSearchMode = normalizedSearchQuery.length > 0;

  const handleDelete = (productId: number) => {
    toast(
      (toastInstance) => (
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold text-slate-950">Delete this listing?</p>
          <p className="text-slate-500">
            The product will be removed from your seller catalog.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={async () => {
                toast.dismiss(toastInstance.id);
                try {
                  const res = await fetchWithRefresh(
                    `http://localhost:8080/api/seller/products/${productId}`,
                    { method: "DELETE" }
                  );

                  if (!res.ok) {
                    toast.error(await readApiError(res));
                    return;
                  }

                  setProducts((current) =>
                    current.filter((product) => product.id !== productId)
                  );
                  toast.success("Product deleted.");
                } catch {
                  toast.error("Unable to delete the product.");
                }
              }}
              className="rounded-full bg-[#1b5cff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f43c7]"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(toastInstance.id)}
              className="rounded-full border border-[#d7e3f7] bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Keep
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  return (
    <main className="page-shell">
      <Navbar role="SELLER" onSearch={setSearchQuery} />

      <div className="content-shell grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="panel-strong min-h-[238px] px-5 py-5">
            <p className="section-kicker">Seller center</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Manage products with less clutter.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Keep your catalog updated, watch low stock items, and move straight into sales actions.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/create-product" className="primary-button w-full">
                Add new product
              </Link>
              <Link href="/sales" className="secondary-button w-full">
                Open sales queue
              </Link>
            </div>
          </div>

          <div className="panel-strong min-h-[198px] px-5 py-5">
            <p className="section-kicker">Quick view</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span className="text-slate-500">Products</span>
                <span className="font-semibold text-slate-950">{products.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span className="text-slate-500">Low stock</span>
                <span className="font-semibold text-slate-950">{lowStockCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
                <span className="text-slate-500">Catalog value</span>
                <span className="font-semibold text-slate-950">
                  {formatCurrency(totalValue)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="panel-strong px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="section-kicker">{isSearchMode ? "Search results" : "Catalog"}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {isSearchMode ? `Results for "${normalizedSearchQuery}"` : "Your product listings"}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={
                    sortMode === "latest"
                      ? "rounded-full border border-[#9cb9ff] bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#0f43c7]"
                      : "rounded-full border border-[#d7e3f7] bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  }
                  onClick={() => setSortMode("latest")}
                >
                  Latest
                </button>
                <button
                  className={
                    sortMode === "price-desc"
                      ? "rounded-full border border-[#9cb9ff] bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#0f43c7]"
                      : "rounded-full border border-[#d7e3f7] bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  }
                  onClick={() => setSortMode("price-desc")}
                >
                  Highest price
                </button>
                <button
                  className={
                    sortMode === "price-asc"
                      ? "rounded-full border border-[#9cb9ff] bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#0f43c7]"
                      : "rounded-full border border-[#d7e3f7] bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  }
                  onClick={() => setSortMode("price-asc")}
                >
                  Lowest price
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: SELLER_SKELETON_ROWS }).map((_, index) => (
                <div key={index} className="panel-strong animate-pulse px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="h-24 w-24 rounded-[24px] bg-slate-300" />
                    <div className="flex-1">
                      <div className="h-4 w-24 rounded bg-slate-300" />
                      <div className="mt-3 h-5 w-2/5 rounded bg-slate-300" />
                      <div className="mt-3 h-4 w-full rounded bg-slate-300" />
                      <div className="mt-2 h-4 w-4/5 rounded bg-slate-300" />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="h-9 w-20 rounded-full bg-slate-300" />
                        <div className="h-9 w-24 rounded-full bg-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="panel-strong flex min-h-[220px] items-center justify-center px-6 py-10 text-center">
              <p className="max-w-md text-sm font-medium leading-6 text-slate-500">
                {isSearchMode
                  ? `No products match "${normalizedSearchQuery}" right now.`
                  : "No products at the current time."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedProducts.map((product) => {
                const stockLabel =
                  product.quantity <= 0
                    ? "Out of stock"
                    : product.quantity <= 5
                      ? "Low stock"
                      : "Active";

                const stockClassName =
                  product.quantity <= 0
                    ? "status-chip bg-[#fff1f1] text-[#d64545]"
                    : product.quantity <= 5
                      ? "status-chip bg-[#fff7e9] text-[#b7791f]"
                      : "status-chip bg-[#eefbf5] text-[#0f8a5f]";

                return (
                  <article
                    key={product.id}
                    className="panel-strong px-4 py-4 sm:px-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <Link
                        href={`/products/${product.id}`}
                        className="shrink-0 self-start rounded-[24px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9cb9ff] focus-visible:ring-offset-2"
                      >
                        <AppImage
                          src={product.imageUrl}
                          width={120}
                          height={120}
                          alt={product.title}
                          className="h-24 w-24 rounded-[24px] object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5370a6]">
                              {product.category}
                            </p>
                            <Link href={`/products/${product.id}`} className="group mt-2 block">
                              <h3 className="line-clamp-2 h-14 text-lg font-semibold leading-7 text-slate-950 transition group-hover:text-[#0f43c7]">
                                {product.title}
                              </h3>
                              <p className="mt-2 line-clamp-2 h-12 text-sm leading-6 text-slate-500">
                                {product.description}
                              </p>
                            </Link>
                          </div>
                          <span className={stockClassName}>{stockLabel}</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span>Stock {product.quantity}</span>
                            <span className="font-semibold text-[#0f43c7]">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/edit-product/${product.id}`}
                              className="rounded-full border border-[#d7e3f7] bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="rounded-full border border-[#ffd2d2] bg-[#fff6f6] px-4 py-2 text-sm font-semibold text-[#d64545]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
