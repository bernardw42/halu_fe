"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { uploadImageToCloudinary } from "../../create-product/utils/uploadImage";
import toast from "react-hot-toast";
import Link from "next/link";
import { fetchWithRefresh } from "../../../utils/fetchWithRefresh";

export default function EditProductPage() {
  const { productId } = useParams();
  const [form, setForm] = useState({
    title: "",
    category: "",
    price: "",
    description: "",
    imageUrl: "",
    quantity: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setSellerId] = useState<string | null>(null);

  // Get sellerId after hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSellerId(localStorage.getItem("userId"));
    }
  }, []);

  // Fetch product data when productId is available
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetchWithRefresh(`http://localhost:8080/api/seller/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          ...data,
          quantity: data.quantity?.toString() ?? "",
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error("Failed to load product data.");
      });
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const img = e.target.files?.[0];
    if (img && ["image/jpeg", "image/png"].includes(img.type)) {
      setFile(img);
    } else {
      toast.error("Only PNG and JPG files are allowed.");
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.price || !form.description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p>Update this product?</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setSubmitting(true);

                let imageUrl = form.imageUrl;

                if (file) {
                  try {
                    imageUrl = await uploadImageToCloudinary(file);
                  } catch (err) {
                    toast.error("Image upload failed.");
                    setSubmitting(false);
                    return;
                  }
                }

                const quantity =
                  form.quantity && !isNaN(Number(form.quantity))
                    ? parseInt(form.quantity)
                    : 1;

                // Use fetchWithRefresh and correct endpoint
                const res = await fetchWithRefresh(
                  `http://localhost:8080/api/seller/products/${productId}`,
                  {
                    method: "PUT",
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
                  toast.success("Product updated successfully!");
                  setTimeout(() => {
                    window.location.href = "/home";
                  }, 1000);
                } else {
                  try {
                    const contentType = res.headers.get("content-type");
                    const errorMessage = contentType?.includes(
                      "application/json"
                    )
                      ? (await res.json()).message
                      : await res.text();

                    toast.error(errorMessage || "Update failed.");
                  } catch (err) {
                    toast.error("An error occurred while updating.");
                  }
                }

                setSubmitting(false);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-all duration-150"
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
  };

  if (loading) {
    return (
      <main className="p-6 max-w-xl mx-auto min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-100">
        <p className="text-blue-700 text-lg">Loading...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden">
      {/* Decorative Accent */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-100 rounded-br-full opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-blue-200 rounded-tl-full opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl bg-white/90 rounded-3xl shadow-2xl p-10 flex flex-col gap-6 border border-blue-100">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-2 text-center tracking-tight">
          Edit Product
        </h1>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <input
                name="title"
                value={form.title}
                placeholder="Title"
                onChange={handleChange}
                className="border border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
              />
              <input
                name="category"
                value={form.category}
                placeholder="Category"
                onChange={handleChange}
                className="border border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
              />
              <input
                name="price"
                type="number"
                value={form.price}
                placeholder="Price"
                onChange={handleChange}
                className="border border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
              />
              <input
                name="quantity"
                type="number"
                min={1}
                placeholder="Quantity"
                value={form.quantity}
                onChange={handleChange}
                className="border border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-black placeholder-gray-400"
              />
            </div>
            <div className="flex flex-col gap-4">
              <textarea
                name="description"
                value={form.description}
                placeholder="Description"
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
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-bold shadow transition-all duration-150 w-full md:w-auto"
            >
              {submitting ? "Updating..." : "Save Changes"}
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
