/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import { fetchWithRefresh } from "../../utils/fetchWithRefresh";
import { formatCurrency } from "../../utils/formatCurrency";
import { readApiError } from "../../utils/readApiError";

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

const statusStyles: Record<Order["status"], string> = {
  PENDING: "status-chip bg-[#edf3ff] text-[#0f43c7]",
  PAID: "status-chip bg-[#eefbf5] text-[#0f8a5f]",
  SHIPPED: "status-chip bg-[#e8f7ff] text-[#0369a1]",
  CANCELLED: "status-chip bg-[#fff1f1] text-[#d64545]",
};

function formatDate(value?: string) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

function formatTimeLeft(expiresAt: string, now: number) {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) {
    return "Expired";
  }

  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [
    days > 0 ? `${days}d` : null,
    hours > 0 ? `${hours}h` : null,
    minutes > 0 || (days === 0 && hours === 0) ? `${minutes}m` : null,
  ].filter(Boolean);

  return parts.join(" ");
}

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersRes = await fetchWithRefresh("http://localhost:8080/api/orders/seller");
      if (!ordersRes.ok) throw new Error(await readApiError(ordersRes));
      const ordersData = await ordersRes.json();

      const sortedOrders = [...ordersData]
        .sort((a, b) => (b.orderId ?? b.id) - (a.orderId ?? a.id))
        .map((order: any) => ({
          id: order.orderId ?? order.id,
          status: order.status,
          expiresAt: order.expiresAt,
          items: order.items,
        }));

      setOrders(sortedOrders);
    } catch {
      toast.error("Failed to load sales data.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const summary = useMemo(
    () => ({
      awaitingPayment: orders.filter((order) => order.status === "PENDING").length,
      readyToShip: orders.filter((order) => order.status === "PAID").length,
      shipped: orders.filter((order) => order.status === "SHIPPED").length,
    }),
    [orders]
  );

  const handleShip = async (orderId: number) => {
    const res = await fetchWithRefresh(`http://localhost:8080/api/orders/${orderId}/ship`, {
      method: "POST",
    });

    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }

    toast.success("Order marked as shipped.");
    await fetchOrders();
  };

  const handleCancel = async (orderId: number) => {
    const res = await fetchWithRefresh(
      `http://localhost:8080/api/orders/${orderId}/cancel`,
      { method: "POST" }
    );

    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }

    toast.success("Order cancelled.");
    await fetchOrders();
  };

  return (
    <main className="page-shell">
      <Navbar role="SELLER" onSearch={() => {}} />

      <div className="content-shell space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="panel px-6 py-7 sm:px-8 sm:py-8">
            <p className="section-kicker">Sales operations</p>
            <h1 className="section-title mt-4">Track payment and shipment deadlines from one queue.</h1>
            <p className="section-copy mt-4 max-w-2xl">
              Orders stay grouped by the backend rules already in place. This view makes
              seller actions simpler without changing the shipment or cancellation logic.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="metric-tile">
              <p className="text-sm text-slate-500">Awaiting payment</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {summary.awaitingPayment}
              </p>
            </div>
            <div className="metric-tile">
              <p className="text-sm text-slate-500">Ready to ship</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {summary.readyToShip}
              </p>
            </div>
            <div className="metric-tile">
              <p className="text-sm text-slate-500">Shipped</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {summary.shipped}
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="panel-strong animate-pulse px-6 py-6">
                <div className="h-5 w-32 rounded bg-slate-100" />
                <div className="mt-4 h-24 rounded-[24px] bg-slate-100" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="panel-strong px-6 py-12 text-center">
            <p className="text-lg font-semibold text-slate-950">No sales orders yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              When buyers place orders for your products, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const total = order.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0
              );
              const timeLeft =
                order.status === "PAID" ? formatTimeLeft(order.expiresAt, now) : null;

              return (
                <article key={order.id} className="panel-strong px-6 py-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xl font-semibold text-slate-950">
                          Order #{order.id}
                        </p>
                        <span className={statusStyles[order.status]}>{order.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Expires {formatDate(order.expiresAt)}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500 lg:text-right">
                      {order.status === "PAID" && timeLeft && (
                        <p className="font-semibold text-[#d64545]">
                          Ship within {timeLeft}
                        </p>
                      )}
                      {order.status === "PENDING" && (
                        <p className="font-semibold text-[#b7791f]">
                          Waiting for buyer payment
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${index}`}
                        className="flex items-center gap-4 rounded-[24px] border border-[#e5ecfa] bg-[#fafcff] px-4 py-4"
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-[#e9f0ff] text-2xl font-semibold text-[#0f43c7]">
                          {item.productTitle.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-slate-950">
                            {item.productTitle}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Qty {item.quantity} x {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-[#0f43c7]">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-4 border-t border-[#e5ecfa] pt-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Order total
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {formatCurrency(total)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {order.status === "PAID" && (
                        <>
                          <button onClick={() => handleShip(order.id)} className="primary-button">
                            Mark as shipped
                          </button>
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="secondary-button"
                          >
                            Cancel order
                          </button>
                        </>
                      )}
                      {order.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="secondary-button"
                        >
                          Cancel order
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

