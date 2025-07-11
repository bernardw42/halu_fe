"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchWithRefresh } from "../../utils/fetchWithRefresh"; // ✅ adjust path if needed!

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

  // ✅ GET /api/buyer/carts
  const fetchCart = async () => {
    try {
      const res = await fetchWithRefresh(
        `http://localhost:8080/api/buyer/carts`
      );
      if (!res.ok) throw new Error("Failed to load cart");
      const data = await res.json();
      if (!Array.isArray(data)) {
        toast.error("Cart data is not an array. Check backend response.");
        setCartItems([]);
        return;
      }
      setCartItems(data);
    } catch (err) {
      console.error("Cart fetch error:", err);
      toast.error("Error loading cart. Please refresh.");
      setCartItems([]);
    }
  };

  // ✅ POST /api/buyer/carts/remove/{productId}
  const handleRemoveItem = async (productId: number) => {
    try {
      const res = await fetchWithRefresh(
        `http://localhost:8080/api/buyer/carts/remove/${productId}`,
        { method: "POST" }
      );

      const text = await res.text();

      if (!res.ok) {
        toast.error(text || "Failed to remove item.");
      } else {
        toast.success(text || "Item removed.");
        fetchCart();
      }
    } catch (err) {
      console.error("Remove item error:", err);
      toast.error("Network error while removing item.");
    }
  };

  // ✅ POST /api/buyer/carts/clear
  const handleClearCart = async () => {
    try {
      const res = await fetchWithRefresh(
        `http://localhost:8080/api/buyer/carts/clear`,
        { method: "POST" }
      );

      const text = await res.text();

      if (!res.ok) {
        toast.error(text || "Failed to clear cart.");
      } else {
        toast.success(text || "Cart cleared.");
        fetchCart();
      }
    } catch (err) {
      console.error("Clear cart error:", err);
      toast.error("Network error while clearing cart.");
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  useEffect(() => {
    fetchCart();
    const listener = () => fetchCart();
    window.addEventListener("cartUpdated", listener);
    return () => window.removeEventListener("cartUpdated", listener);
  }, []);

  // ✅ POST /api/buyer/checkout
  const handleCheckout = async () => {
    try {
      const res = await fetchWithRefresh(
        `http://localhost:8080/api/buyer/checkout`,
        { method: "POST" }
      );

      let text = "";
      let productNames = "";
      try {
        const data = await res.json();
        // If backend returns an order object with items array
        if (data && Array.isArray(data.items)) {
          productNames = data.items
            .map((item: any) => item.productTitle || item.product?.title)
            .filter(Boolean)
            .join(", ");
        } else if (Array.isArray(data) && data.length > 0 && data[0].product) {
          productNames = data.map((item: any) => item.product.title).join(", ");
        } else if (data.product) {
          productNames = data.product.title;
        } else {
          text = JSON.stringify(data);
        }
      } catch {
        text = await res.text();
      }

      if (!res.ok) {
        toast.error(text || "Failed to start checkout.");
      } else {
        if (productNames) {
          toast.success(
            `Checkout started for: ${productNames} with a total of ${totalPrice} IDR.`
          );
        } else {
          toast.success(text || "Checkout started.");
        }
        window.location.href = "/payment";
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Network error during checkout.");
    }
  };

  return (
    <>
      {/* Floating Cart Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-40 bottom-8 right-8 bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white rounded-full shadow-2xl w-16 h-16 flex items-center justify-center border-4 border-white transition-all"
          aria-label="Open cart"
        >
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

      {/* Slide-in Cart */}
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
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </>
  );
}
