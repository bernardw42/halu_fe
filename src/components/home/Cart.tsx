"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

  const buyerId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const fetchCart = async () => {
    if (!buyerId) return;
    const res = await fetch(`http://localhost:8080/api/carts/${buyerId}`);
    const data = await res.json();
    setCartItems(data);
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/carts/${buyerId}/remove/${productId}`,
        {
          method: "POST",
        }
      );

      const text = await res.text();

      if (!res.ok) {
        toast.error(text || "Failed to remove item.");
      } else {
        toast.success(text || "Item removed.");
        fetchCart();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Network error while removing item.");
    }
  };

  const handleClearCart = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/carts/${buyerId}/clear`,
        {
          method: "POST",
        }
      );

      const text = await res.text();

      if (!res.ok) {
        toast.error(text || "Failed to clear cart.");
      } else {
        toast.success(text || "Cart cleared.");
        fetchCart();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Network error while clearing cart.");
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  useEffect(() => {
    fetchCart(); // on mount
    const listener = () => fetchCart();
    window.addEventListener("cartUpdated", listener);
    return () => window.removeEventListener("cartUpdated", listener);
  }, []);

  return (
    <>
      {/* 🛒 Floating Cart Button */}
      {!open && (
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

          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow">
              {totalItems}
            </span>
          )}
        </button>
      )}

      {/* 📦 Slide-in Cart Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gray-50 shadow-xl transform transition-transform duration-300 z-40 ${
          open ? "translate-x-0" : "translate-x-full"
        } rounded-l-2xl`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#4361ee] rounded-tl-2xl">
          <h2 className="text-lg font-bold text-white">Your Cart</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-white font-bold hover:text-red-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {cartItems.length === 0 ? (
            <p className="text-gray-700">Your cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 border-b pb-2 border-gray-300"
              >
                <img
                  src={item.product.imageUrl}
                  className="w-16 h-16 object-cover rounded-lg border"
                  alt={item.product.title}
                />
                <div className="flex-1 text-gray-800">
                  <p className="font-semibold">{item.product.title}</p>
                  <p className="text-sm">
                    {item.quantity} × {item.product.price} IDR
                  </p>
                </div>
                <button
                  className="text-red-500 hover:text-red-700 font-bold"
                  onClick={() => handleRemoveItem(item.product.id)}
                  title="Remove one"
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>

        {/* 💰 Total, Clear & Pay */}
        <div className="p-4 border-t border-gray-200 space-y-3 bg-white rounded-bl-2xl">
          <div className="flex justify-between text-gray-800">
            <span className="font-semibold">Total:</span>
            <span className="font-bold">{totalPrice} IDR</span>
          </div>

          {cartItems.length > 0 && (
            <button
              className="bg-red-500 hover:bg-red-600 text-white w-full py-2 rounded-lg"
              onClick={() => {
                toast(
                  (t) => (
                    <div className="flex flex-col gap-2 text-sm text-gray-800">
                      <p>Are you sure you want to clear the cart?</p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            toast.dismiss(t.id);
                            handleClearCart();
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ),
                  { duration: 10000 }
                );
              }}
            >
              Clear Cart
            </button>
          )}

          <button
            className="bg-[#4361ee] hover:bg-blue-700 text-white w-full py-2 rounded-lg font-semibold"
            onClick={() => {
              window.location.href = "/payment";
            }}
            disabled={cartItems.length === 0}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </>
  );
}
