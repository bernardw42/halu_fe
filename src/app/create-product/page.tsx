"use client";
import { useState } from "react";
import { uploadImageToCloudinary } from "./utils/uploadImage";
import toast from "react-hot-toast";
import Link from "next/link";

export default function CreateProductPage() {
  const [form, setForm] = useState({
    title: "",
    category: "",
    price: "",
    description: "",
    quantity: "", // Add quantity field
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const img = e.target.files?.[0];
    if (img && ["image/jpeg", "image/png"].includes(img.type)) {
      setFile(img);
    } else {
      toast.error("Only PNG or JPG files are allowed.");
    }
  }

  async function handleSubmit() {
    if (
      !form.title ||
      !form.category ||
      !form.price ||
      !form.description ||
      !file
    ) {
      toast.error("Complete all fields and upload an image.");
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p>Submit this product?</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setSubmitting(true);

                let imageUrl: string;
                try {
                  imageUrl = await uploadImageToCloudinary(file);
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (err) {
                  toast.error("Image upload failed.");
                  setSubmitting(false);
                  return;
                }

                const sellerId = localStorage.getItem("userId");
                const quantity =
                  form.quantity && !isNaN(Number(form.quantity))
                    ? parseInt(form.quantity)
                    : 1;

                const res = await fetch(
                  `http://localhost:8080/api/products/${sellerId}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...form,
                      price: parseInt(form.price),
                      imageUrl,
                      quantity,
                    }),
                  }
                );

                if (res.ok) {
                  toast.success("Product created successfully!");
                  setTimeout(() => {
                    window.location.href = "/home";
                  }, 1000);
                } else {
                  const msg = await res.text();
                  toast.error(msg || "Backend error.");
                }

                setSubmitting(false);
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 text-black px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleCancel() {
    const touched = Object.values(form).some((v) => v.trim()) || file;

    if (!touched) {
      window.location.href = "/home";
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p>Discard all changes?</p>
          <div className="flex gap-2 justify-end">
            <Link
              href="/home"
              className="bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center justify-center"
              onClick={() => toast.dismiss(t.id)}
            >
              Discard
            </Link>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 text-black px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden">
      {/* Decorative Accent */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-100 rounded-br-full opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-blue-200 rounded-tl-full opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl bg-white/90 rounded-3xl shadow-2xl p-10 flex flex-col gap-6 border border-blue-100">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-2 text-center tracking-tight">
          Create New Product
        </h1>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <input
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                className="border border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
              />
              <input
                name="category"
                placeholder="Category"
                value={form.category}
                onChange={handleChange}
                className="border border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
              />
              <input
                name="price"
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={handleChange}
                className="border border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
              />
              <input
                name="quantity"
                type="number"
                min={1}
                placeholder="Quantity (default 1)"
                value={form.quantity}
                onChange={handleChange}
                className="border border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
              />
            </div>
            <div className="flex flex-col gap-4">
              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                className="border border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400 min-h-[120px] resize-none"
              />
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="border border-blue-200 p-3 rounded-lg bg-white text-black"
                onChange={handleImageChange}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-4">
            <button
              type="submit"
              disabled={submitting}
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-bold shadow transition-all duration-150 w-full md:w-auto"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <Link
              href="/home"
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-8 py-3 rounded-xl font-bold shadow transition-all duration-150 flex items-center justify-center w-full md:w-auto"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
