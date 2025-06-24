"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar"; // ✅ Added navbar import

type Order = {
  id: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
  expiresAt: string;
  items: {
    productTitle: string;
    unitPrice: number;
    quantity: number;
  }[];
};

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(Date.now());

  const sellerId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (!sellerId) return;
    fetch(`http://localhost:8080/api/orders/seller/${sellerId}`)
      .then((res) => res.json())
      .then((data) => {
        const normalized = data.map((o: any) => ({
          id: o.orderId,
          status: o.status,
          expiresAt: o.expiresAt,
          items: o.items,
        }));
        setOrders(normalized);
      })
      .catch(() => toast.error("Failed to load sales data."));
  }, [sellerId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShip = async (orderId: number) => {
    const res = await fetch(
      `http://localhost:8080/api/orders/${orderId}/ship`,
      {
        method: "POST",
      }
    );
    const text = await res.text();
    if (res.ok) {
      toast.success(text || "Item shipped!");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "SHIPPED" } : o))
      );
    } else {
      toast.error(text || "Failed to ship.");
    }
  };

  const handleCancel = async (orderId: number) => {
    const res = await fetch(
      `http://localhost:8080/api/orders/${orderId}/cancel`,
      {
        method: "POST",
      }
    );
    const text = await res.text();
    if (res.ok) {
      toast.success(text || "Order cancelled.");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
      );
    } else {
      toast.error(text || "Failed to cancel.");
    }
  };

  const formatTimeLeft = (end: string) => {
    const ms = new Date(end).getTime() - now;
    if (ms <= 0) return "Expired";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <>
      <Navbar role="SELLER" onSearch={() => {}} /> {/* ✅ Navbar added */}
      <main className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-800">Sales Orders</h1>

        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded-lg shadow bg-white">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
              <span>
                Order #{order.id} • Status:{" "}
                <span className="font-bold text-blue-600">{order.status}</span>
              </span>
              {order.status === "PAID" && (
                <span className="text-red-500">
                  Ship in: {formatTimeLeft(order.expiresAt)}
                </span>
              )}
            </div>

            <ul className="space-y-2 mb-3">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex gap-3 items-center">
                  <img
                    src={"/placeholder.png"} // no image in response
                    alt={item.productTitle}
                    className="w-16 h-16 rounded border object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.productTitle}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × {item.unitPrice} IDR
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {order.status === "PAID" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleShip(order.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Ship
                </button>
                <button
                  onClick={() => handleCancel(order.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </main>
    </>
  );
}
