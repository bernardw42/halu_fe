"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type CartItem = {
  id: number;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

export default function Cart() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setCart([]);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:8080/api/carts/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCart(data);
          } else if (Array.isArray(data.items)) {
            setCart(data.items);
          } else if (Array.isArray(data.cartItems)) {
            setCart(data.cartItems);
          } else {
            setCart([]);
          }
        } else {
          setCart([]);
        }
      } catch {
        setCart([]);
      }
      setLoading(false);
    };

    fetchCart();
    const handler = () => fetchCart();
    window.addEventListener("cartUpdated", handler);
    return () => window.removeEventListener("cartUpdated", handler);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleClearCart = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    const res = await fetch(`http://localhost:8080/api/carts/${userId}/clear`, {
      method: "POST",
    });
    if (res.ok) {
      setCart([]);
      toast.success("Cart cleared!");
      window.dispatchEvent(new Event("cartUpdated"));
    } else {
      toast.error("Failed to clear cart.");
    }
  };

  const handleCheckout = async () => {
    toast.success("Checkout is not implemented.");
    setOpen(false);
  };

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 bottom-8 right-8 bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white rounded-full shadow-2xl w-16 h-16 flex items-center justify-center border-4 border-white transition-all"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)" }}
        aria-label="Open cart"
      >
        {/* Cart Icon (Heroicons outline style) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.2}
          stroke="currentColor"
          className="w-9 h-9"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .96.343 1.09.835l.272 1.017m0 0L6.75 9.75m-1.752-4.898h15.254c.668 0 1.18.632 1.03 1.283l-1.5 6.75a1.125 1.125 0 01-1.09.867H7.5m-2.502-8.9L7.5 15.75m0 0A2.25 2.25 0 109.75 18a2.25 2.25 0 00-2.25-2.25zm0 0H17.25m0 0A2.25 2.25 0 1019.5 18a2.25 2.25 0 00-2.25-2.25z"
          />
        </svg>
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
            {cart.length}
          </span>
        )}
      </button>

      {/* Cart Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative bg-white/95 rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-blue-100">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-blue-500 hover:text-blue-700 bg-blue-50 rounded-full p-2 shadow transition-all"
              aria-label="Close cart"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
              Your Cart
            </h2>
            {loading ? (
              <div className="text-center text-blue-500 py-8">Loading...</div>
            ) : cart.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Your cart is empty.
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 bg-blue-50 rounded-xl p-3 shadow-sm"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg border border-blue-100 bg-gray-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/no-image.png";
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-blue-700">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        x{item.quantity}
                      </div>
                    </div>
                    <div className="font-bold text-blue-600">
                      {item.price * item.quantity} IDR
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-between items-center">
              <span className="font-bold text-blue-700 text-lg">Total:</span>
              <span className="font-bold text-blue-700 text-lg">
                {total} IDR
              </span>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="w-1/2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-xl shadow transition-all"
                onClick={handleCheckout}
              >
                Checkout
              </button>
              <button
                className="w-1/2 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-xl shadow transition-all"
                onClick={handleClearCart}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
