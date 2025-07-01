"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import { fetchWithRefresh } from "../../utils/fetchWithRefresh";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [timings, setTimings] = useState<Record<number, TimingInfo>>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<Record<number, string>>({});

  // Fetch all buyer orders
  const fetchOrdersAndTimings = async () => {
    setLoading(true);
    try {
      // Fetch all orders for the buyer
      const ordersRes = await fetchWithRefresh(
        "http://localhost:8080/api/orders/buyer"
      );
      if (!ordersRes.ok) throw new Error("Failed to fetch orders");
      const ordersData = await ordersRes.json();

      // Sort by id descending (latest first)
      const sortedOrders = [...ordersData]
        .sort((a, b) => {
          const idA = a.orderId ?? a.id;
          const idB = b.orderId ?? b.id;
          return idB - idA;
        })
        .map((order: any) => ({
          id: order.orderId ?? order.id, // <-- always set .id
          status: order.status,
          createdAt: order.createdAt,
          expiresAt: order.expiresAt,
          items: order.items.map((item: any) => ({
            product: {
              title: item.productTitle,
              price: item.unitPrice,
              imageUrl: item.imageUrl || "",
            },
            quantity: item.quantity,
          })),
        }));

      setOrders(sortedOrders);

      // Fetch timing info for each order
      const timingsObj: Record<number, TimingInfo> = {};
      await Promise.all(
        sortedOrders.map(async (order) => {
          try {
            const timingRes = await fetchWithRefresh(
              `http://localhost:8080/api/orders/${order.id}/timing`
            );
            if (timingRes.ok) {
              const timingData = await timingRes.json();
              timingsObj[order.id] = timingData;
            }
          } catch {
            // ignore timing fetch errors for individual orders
          }
        })
      );
      setTimings(timingsObj);
    } catch (err) {
      toast.error("Failed to load orders.");
      setOrders([]);
      setTimings({});
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrdersAndTimings();
  }, []);

  // Live countdown timer updater for all orders
  useEffect(() => {
    const update = () => {
      const newTimeLeft: Record<number, string> = {};
      Object.entries(timings).forEach(([orderId, timing]) => {
        const ms = new Date(timing.expiresAt).getTime() - Date.now();
        if (ms <= 0) {
          newTimeLeft[Number(orderId)] = "Expired";
        } else {
          const mins = Math.floor(ms / 60000);
          const secs = Math.floor((ms % 60000) / 1000);
          newTimeLeft[Number(orderId)] = `${mins}m ${secs}s`;
        }
      });
      setTimeLeft(newTimeLeft);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timings]);

  const handlePay = async (orderId: number) => {
    const res = await fetchWithRefresh(
      `http://localhost:8080/api/orders/${orderId}/pay`,
      {
        method: "POST",
      }
    );
    const text = await res.text();

    if (res.ok) {
      toast.success(text || "Payment successful!");
      await fetchOrdersAndTimings();
    } else {
      toast.error(text || "Payment failed.");
    }
  };

  const handleCancel = async (orderId: number) => {
    const res = await fetchWithRefresh(
      `http://localhost:8080/api/orders/${orderId}/cancel`,
      {
        method: "POST",
      }
    );
    const text = await res.text();

    if (res.ok) {
      toast.success(text || "Order cancelled!");
      await fetchOrdersAndTimings();
    } else {
      toast.error(text || "Cancel failed.");
    }
  };

  return (
    <>
      <Navbar role="BUYER" onSearch={() => {}} />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-blue-800 mb-4">Your Orders</h1>

        {loading ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-600 text-lg">
            You haven&apos;t bought anything yet.
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-blue-200 rounded-xl shadow-md p-6 mb-6"
            >
              <div className="flex justify-between items-center mb-4 text-sm text-gray-700">
                <span>
                  <strong className="text-blue-700">Order #{order.id}</strong>{" "}
                  &bull;{" "}
                  <span className="font-semibold capitalize">
                    {order.status}
                  </span>
                </span>
                {/* Timer */}
                {timings[order.id]?.timerType === "payment" && (
                  <span className="text-red-600 font-medium">
                    Pay in: {timeLeft[order.id] || ""}
                  </span>
                )}
                {timings[order.id]?.timerType === "shipment" && (
                  <span className="text-yellow-600 font-medium">
                    Seller ships in: {timeLeft[order.id] || ""}
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

              <div className="flex gap-3">
                {order.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handlePay(order.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"
                    >
                      Pay Now
                    </button>
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded font-semibold"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {order.status === "PAID" && (
                  <button
                    onClick={() => {
                      console.log("Cancel order id:", order.id);
                      handleCancel(order.id);
                    }}
                    s
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </>
  );
}
