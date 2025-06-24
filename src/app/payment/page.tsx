"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";

type Order = {
  id: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
  createdAt?: string;
  expiresAt: string;
  items: {
    product: {
      title: string;
      price: number;
      imageUrl: string;
    };
    quantity: number;
  }[];
};

type TimingInfo = {
  orderId: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
  expiresAt: string;
  secondsRemaining: number;
  timerType: "payment" | "shipment" | "none";
};

export default function PaymentPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [timing, setTiming] = useState<TimingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  // Force hardcoded orderId for testing
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("orderId")) {
      localStorage.setItem("orderId", "1");
      console.log("✅ Forced orderId = 1 into localStorage for testing");
    }
  }, []);

  const orderId =
    typeof window !== "undefined" ? localStorage.getItem("orderId") : null;

  const fetchOrderAndTiming = async () => {
    console.log("📦 orderId from localStorage:", orderId);

    if (!orderId) {
      console.warn("⚠️ No orderId found");
      setLoading(false);
      return;
    }

    try {
      const timingRes = await fetch(
        `http://localhost:8080/api/orders/${orderId}/timing`
      );
      const timingData = await timingRes.json();
      console.log("⏰ Timing data:", timingData);
      if (!timingRes.ok) throw new Error("Failed to fetch timing");
      setTiming(timingData);

      const orderRes = await fetch(
        `http://localhost:8080/api/checkout/${orderId}`
      );
      const orderData = await orderRes.json();
      console.log("📦 Order data raw:", orderData);
      if (!orderRes.ok) throw new Error("Failed to fetch order");

      const normalizedOrder: Order = {
        id: orderData.orderId,
        status: orderData.status,
        expiresAt: orderData.expiresAt,
        items: orderData.items.map((item: any) => ({
          product: {
            title: item.productTitle,
            price: item.unitPrice,
            imageUrl: item.imageUrl || "", // ✅ now mapped correctly
          },
          quantity: item.quantity,
        })),
      };

      console.log("✅ Normalized Order:", normalizedOrder);
      setOrder(normalizedOrder);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      toast.error("Failed to load order or timing.");
      setOrder(null);
      setTiming(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrderAndTiming();
  }, [orderId]);

  // Live countdown timer updater
  useEffect(() => {
    if (!timing) return;

    const update = () => {
      const ms = new Date(timing.expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft("Expired");
      } else {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timing]);

  const handlePay = async () => {
    if (!order) return;

    console.log("💸 Paying for order ID:", order.id);
    const res = await fetch(
      `http://localhost:8080/api/orders/${order.id}/pay`,
      {
        method: "POST",
      }
    );
    const text = await res.text();

    if (res.ok) {
      toast.success(text || "Payment successful!");
      console.log("✅ Payment success, refreshing order & timer...");
      await fetchOrderAndTiming();
    } else {
      console.error("❌ Payment failed:", text);
      toast.error(text || "Payment failed.");
    }
  };

  return (
    <>
      <Navbar role="BUYER" onSearch={() => {}} />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-blue-800 mb-4">Your Orders</h1>

        {loading ? (
          <p className="text-gray-500">Loading order...</p>
        ) : !order ? (
          <p className="text-gray-600 text-lg">
            You haven&apos;t bought anything yet.
          </p>
        ) : (
          <div className="bg-white border border-blue-200 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4 text-sm text-gray-700">
              <span>
                <strong className="text-blue-700">Order #{order.id}</strong>{" "}
                &bull;{" "}
                <span className="font-semibold capitalize">{order.status}</span>
              </span>

              {timing?.timerType === "payment" && (
                <span className="text-red-600 font-medium">
                  Pay in: {timeLeft}
                </span>
              )}
              {timing?.timerType === "shipment" && (
                <span className="text-yellow-600 font-medium">
                  Seller ships in: {timeLeft}
                </span>
              )}
            </div>

            <ul className="divide-y divide-blue-100 mb-4">
              {order.items.map((item, idx) => (
                <li key={idx} className="py-3 flex items-center gap-4">
                  <img
                    src={
                      item.product.imageUrl?.startsWith("http")
                        ? item.product.imageUrl
                        : "/placeholder.png"
                    }
                    alt={item.product.title}
                    className="w-16 h-16 object-cover border rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">
                      {item.product.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × {item.product.price} IDR
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {order.status === "PENDING" && (
              <button
                onClick={handlePay}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"
              >
                Pay Now
              </button>
            )}
          </div>
        )}
      </main>
    </>
  );
}
