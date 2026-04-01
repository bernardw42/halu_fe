/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { fetchWithRefresh } from "../../utils/fetchWithRefresh";
import { formatCurrency } from "../../utils/formatCurrency";
import { readApiError } from "../../utils/readApiError";
import AppImage from "../ui/AppImage";

type CartItem = {
  id: number;
  product: {
    id: number;
    title: string;
    price: number;
    imageUrl: string;
  };
  quantity: number;
};

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const router = useRouter();
  const hasRequestedInitialCart = useRef(false);

  const fetchCart = async () => {
    hasRequestedInitialCart.current = true;

    try {
      const res = await fetchWithRefresh("http://localhost:8080/api/buyer/carts");
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Cart fetch error:", error);
      toast.error("Unable to load your cart right now.");
      setCartItems([]);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!hasRequestedInitialCart.current) {
        void fetchCart();
      }
    }, 250);

    const refreshListener = () => {
      void fetchCart();
    };
    const openListener = () => {
      setOpen(true);
      if (!hasRequestedInitialCart.current) {
        void fetchCart();
      }
    };

    window.addEventListener("cartUpdated", refreshListener);
    window.addEventListener("openCart", openListener);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("cartUpdated", refreshListener);
      window.removeEventListener("openCart", openListener);
    };
  }, []);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    [cartItems]
  );

  const handleRemoveItem = async (productId: number) => {
    try {
      const res = await fetchWithRefresh(
        `http://localhost:8080/api/buyer/carts/remove/${productId}`,
        { method: "POST" }
      );

      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }

      toast.success("Item removed from cart.");
      await fetchCart();
    } catch (error) {
      console.error("Remove item error:", error);
      toast.error("Unable to update your cart.");
    }
  };

  const handleClearCart = async () => {
    try {
      const res = await fetchWithRefresh("http://localhost:8080/api/buyer/carts/clear", {
        method: "POST",
      });

      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }

      toast.success("Cart cleared.");
      await fetchCart();
    } catch (error) {
      console.error("Clear cart error:", error);
      toast.error("Unable to clear your cart.");
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await fetchWithRefresh("http://localhost:8080/api/buyer/checkout", {
        method: "POST",
      });

      let startedOrderCount = 0;
      let productNames = "";

      try {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          startedOrderCount = data.length;
          productNames = data
            .flatMap((order: any) =>
              Array.isArray(order.items)
                ? order.items.map((item: any) => item.productTitle)
                : []
            )
            .filter(Boolean)
            .join(", ");
        }
      } catch {
        // ignore parse failures and rely on the status below
      }

      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }

      if (productNames) {
        const orderLabel =
          startedOrderCount > 1
            ? `${startedOrderCount} separate orders`
            : "your order";
        toast.success(`Checkout started for ${orderLabel}: ${productNames}.`);
      } else {
        toast.success("Checkout started.");
      }

      router.push("/payment");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Unable to start checkout right now.");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!hasRequestedInitialCart.current) {
      void fetchCart();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#1b5cff] text-white shadow-[0_24px_50px_rgba(27,92,255,0.28)] hover:-translate-y-1"
          aria-label="Open cart"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-8 w-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .96.343 1.09.835l.272 1.017m0 0L6.75 9.75m-1.752-4.898h15.254c.668 0 1.18.632 1.03 1.283l-1.5 6.75a1.125 1.125 0 01-1.09.867H7.5m-2.502-8.9L7.5 15.75m0 0A2.25 2.25 0 109.75 18a2.25 2.25 0 00-2.25-2.25zm0 0H17.25m0 0A2.25 2.25 0 1019.5 18a2.25 2.25 0 00-2.25-2.25z"
            />
          </svg>
          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-[#d64545] px-2 py-0.5 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </button>
      )}

      {open && (
        <button
          aria-label="Close cart overlay"
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#d7e3f7] bg-[#f9fbff] shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between border-b border-[#d7e3f7] bg-white px-6 py-6">
          <div>
            <p className="section-kicker">Cart overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {totalItems} item{totalItems === 1 ? "" : "s"} ready
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Orders are reviewed on the payment page after checkout.
            </p>
          </div>
          <button onClick={() => setOpen(false)} className="ghost-button">
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {cartItems.length === 0 ? (
            <div className="panel-strong px-5 py-6">
              <p className="text-lg font-semibold text-slate-900">Your cart is empty.</p>
              <p className="mt-2 text-sm text-slate-500">
                Add products from the storefront and they will appear here.
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="panel-strong flex items-center gap-4 px-4 py-4"
              >
                <AppImage
                  src={item.product.imageUrl}
                  width={88}
                  height={88}
                  alt={item.product.title}
                  className="h-20 w-20 rounded-[22px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-950">
                    {item.product.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Qty {item.quantity} x {formatCurrency(item.product.price)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0f43c7]">
                    {formatCurrency(item.quantity * item.product.price)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.product.id)}
                  className="ghost-button text-[#d64545] hover:bg-[#fff1f1]"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#d7e3f7] bg-white px-6 py-6">
          <div className="mb-5 flex items-center justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span className="text-xl font-semibold text-slate-950">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleClearCart}
              className="secondary-button flex-1"
              disabled={cartItems.length === 0}
            >
              Clear cart
            </button>
            <button
              onClick={handleCheckout}
              className="primary-button flex-1"
              disabled={cartItems.length === 0 || checkingOut}
            >
              {checkingOut ? "Starting checkout..." : "Proceed to payment"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

