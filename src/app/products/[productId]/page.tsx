"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../../components/Navbar";
import AppImage from "../../../components/ui/AppImage";
import { fetchWithRefresh } from "../../../utils/fetchWithRefresh";
import { formatCurrency } from "../../../utils/formatCurrency";
import { readApiError } from "../../../utils/readApiError";

type Role = "BUYER" | "SELLER" | null;

type ProductDetail = {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  quantity: number;
  owner?: {
    id?: number;
    username?: string;
    role?: string;
    profileImageUrl?: string;
  };
};

const noop = () => {};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;
  const router = useRouter();

  const [role, setRole] = useState<Role>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("role")?.toUpperCase() as Role;

    if (storedRole === "BUYER" || storedRole === "SELLER") {
      setRole(storedRole);
      setUserId(localStorage.getItem("userId"));
      return;
    }

    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!productId) {
      return;
    }

    let isActive = true;
    setLoading(true);
    setErrorMessage("");

    fetchWithRefresh(`http://localhost:8080/api/products/${productId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await readApiError(res));
        }
        return res.json();
      })
      .then((data) => {
        if (!isActive) {
          return;
        }

        setProduct(data);
      })
      .catch((error: Error) => {
        if (!isActive) {
          return;
        }

        setProduct(null);
        setErrorMessage(error.message || "Unable to load this product right now.");
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [productId]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/home");
  };

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    setAddingToCart(true);
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
    } finally {
      setAddingToCart(false);
    }
  };

  if (!role) {
    return (
      <main className="page-shell flex items-center justify-center">
        <div className="panel flex w-full max-w-xl items-center justify-between gap-6 px-6 py-6 sm:px-8">
          <div>
            <p className="section-kicker">Preparing product view</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Loading product details
            </h1>
          </div>
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#dfe9ff] border-t-[#1b5cff]" />
        </div>
      </main>
    );
  }

  const canEdit =
    role === "SELLER" &&
    userId !== null &&
    product?.owner?.id != null &&
    String(product.owner.id) === userId;

  return (
    <main className="page-shell">
      <Navbar role={role} onSearch={noop} />

      <div className="content-shell space-y-5">
        <button
          onClick={handleBack}
          className="ghost-button inline-flex w-fit rounded-full bg-white px-4"
        >
          Back
        </button>

        {loading ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
            <div className="panel-strong animate-pulse px-5 py-5 sm:px-6">
              <div className="h-[360px] rounded-[28px] bg-slate-300" />
            </div>
            <div className="panel-strong animate-pulse px-5 py-5 sm:px-6">
              <div className="h-4 w-24 rounded bg-slate-300" />
              <div className="mt-4 h-10 w-4/5 rounded bg-slate-300" />
              <div className="mt-5 h-5 w-40 rounded bg-slate-300" />
              <div className="mt-8 h-8 w-32 rounded bg-slate-300" />
              <div className="mt-6 h-24 rounded-[24px] bg-slate-300" />
              <div className="mt-6 h-12 w-40 rounded-full bg-slate-300" />
            </div>
          </section>
        ) : errorMessage ? (
          <section className="panel-strong flex min-h-[320px] flex-col items-center justify-center px-6 py-10 text-center">
            <p className="section-kicker">Product details</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              We could not open this product.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
              {errorMessage}
            </p>
          </section>
        ) : product ? (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
            <div className="panel-strong px-5 py-5 sm:px-6">
              <AppImage
                src={product.imageUrl}
                alt={product.title}
                width={960}
                height={720}
                className="h-[320px] w-full rounded-[28px] object-cover sm:h-[420px]"
              />
            </div>

            <div className="panel-strong px-5 py-5 sm:px-6">
              <p className="section-kicker">{product.category}</p>
              <h1 className="mt-3 line-clamp-2 h-20 text-3xl font-semibold leading-10 tracking-[-0.05em] text-slate-950 sm:h-24 sm:text-4xl sm:leading-[3rem]">
                {product.title}
              </h1>

              {product.owner?.username ? (
                <p className="mt-4 text-sm text-slate-500">
                  Listed by <span className="font-semibold text-slate-700">{product.owner.username}</span>
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <p className="text-3xl font-semibold text-[#0f43c7]">
                  {formatCurrency(product.price)}
                </p>
                <span className="status-chip bg-[#eef4ff] text-[#0f43c7]">
                  Stock {product.quantity}
                </span>
              </div>

              <div className="mt-8 rounded-[24px] border border-[#d7e3f7] bg-[#f8fbff] px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5370a6]">
                  Description
                </p>
                <div className="mt-3 h-72 overflow-y-auto pr-2">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {role === "BUYER" ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="primary-button px-5 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {addingToCart ? "Adding..." : "Add to cart"}
                  </button>
                ) : null}

                {canEdit ? (
                  <Link href={`/edit-product/${product.id}`} className="secondary-button px-5">
                    Edit product
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
