"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import { fetchWithRefresh } from "../../utils/fetchWithRefresh";

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

type TimingInfo = {
  orderId: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
  expiresAt: string;
  secondsRemaining: number;
  timerType: "payment" | "shipment" | "none";
};

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [timings, setTimings] = useState<Record<number, TimingInfo>>({});
  const [now, setNow] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState<Record<number, string>>({});

  // Fetch all seller orders
  const fetchOrdersAndTimings = async () => {
    try {
      const ordersRes = await fetchWithRefresh(
        "http://localhost:8080/api/orders/seller"
      );
      if (!ordersRes.ok) throw new Error("Failed to fetch sales");
      const ordersData = await ordersRes.json();

      // Sort by id descending (latest first)
      const sortedOrders = [...ordersData]
        .sort((a, b) => {
          const idA = a.orderId ?? a.id;
          const idB = b.orderId ?? b.id;
          return idB - idA;
        })
        .map((o: any) => ({
          id: o.orderId ?? o.id,
          status: o.status,
          expiresAt: o.expiresAt,
          items: o.items,
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
    } catch {
      toast.error("Failed to load sales data.");
      setOrders([]);
      setTimings({});
    }
  };

  useEffect(() => {
    fetchOrdersAndTimings();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      // Update timeLeft for all orders
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
    }, 1000);
    return () => clearInterval(interval);
  }, [timings]);

  const handleShip = async (orderId: number) => {
    const res = await fetchWithRefresh(
      `http://localhost:8080/api/orders/${orderId}/ship`,
      {
        method: "POST",
      }
    );
    const text = await res.text();
    if (res.ok) {
      toast.success(text || "Item shipped!");
      await fetchOrdersAndTimings();
    } else {
      toast.error(text || "Failed to ship.");
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
      toast.success(text || "Order cancelled.");
      await fetchOrdersAndTimings();
    } else {
      toast.error(text || "Failed to cancel.");
    }
  };

  return (
    <>
      <Navbar role="SELLER" onSearch={() => {}} />
      <main className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-800">Sales Orders</h1>

        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded-lg shadow bg-white">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
              <span>
                Order #{order.id} • Status:{" "}
                <span className="font-bold text-blue-600">{order.status}</span>
              </span>
              {timings[order.id]?.timerType === "shipment" && (
                <span className="text-red-500">
                  Ship in: {timeLeft[order.id] || ""}
                </span>
              )}
              {timings[order.id]?.timerType === "payment" && (
                <span className="text-yellow-600">Waiting for payment...</span>
              )}
            </div>

            <ul className="space-y-2 mb-3">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex gap-3 items-center">
                  <img
                    src={"/placeholder.png"}
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

            <div className="flex gap-3">
              {order.status === "PAID" && (
                <>
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
                </>
              )}
              {order.status === "PENDING" && (
                <button
                  onClick={() => handleCancel(order.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
