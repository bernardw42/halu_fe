"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import AppImage from "../../components/ui/AppImage";
import { uploadImageToCloudinary } from "./utils/uploadImage";
import { fetchWithRefresh } from "../../utils/fetchWithRefresh";
import { formatCurrency } from "../../utils/formatCurrency";
import { readApiError } from "../../utils/readApiError";

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 2000;

function validateProductInput(form: {
  title: string;
  category: string;
  price: string;
  description: string;
  quantity: string;
}) {
  const title = form.title.trim();
  const category = form.category.trim();
  const description = form.description.trim();
  const price = Number(form.price);
  const quantity = form.quantity ? Number(form.quantity) : 1;

  if (title.length < 3 || title.length > TITLE_MAX_LENGTH) {
    return "Title must be between 3 and 120 characters.";
  }
  if (category.length < 2 || category.length > 50) {
    return "Category must be between 2 and 50 characters.";
  }
  if (!Number.isFinite(price) || price <= 0) {
    return "Price must be greater than zero.";
  }
  if (description.length < 10 || description.length > DESCRIPTION_MAX_LENGTH) {
    return "Description must be between 10 and 2000 characters.";
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return "Quantity must be a whole number of at least 1.";
  }
  return null;
}

export default function CreateProductPage() {
  const [form, setForm] = useState({
    title: "",
    category: "",
    price: "",
    description: "",
    quantity: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    if (!image) return;

    if (["image/jpeg", "image/png"].includes(image.type)) {
      setFile(image);
    } else {
      toast.error("Only PNG or JPG files are allowed.");
    }
  }

  async function handleSubmit() {
    const validationError = validateProductInput(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!file) {
      toast.error("Product image is required.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string;
      try {
        imageUrl = await uploadImageToCloudinary(file);
      } catch {
        toast.error("Image upload failed.");
        return;
      }

      const quantity = form.quantity ? Number(form.quantity) : 1;

      const res = await fetchWithRefresh("http://localhost:8080/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category.trim(),
          price: Number(form.price),
          description: form.description.trim(),
          imageUrl,
          quantity,
        }),
      });

      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }

      toast.success("Product created successfully.");
      router.replace("/home");
    } finally {
      setSubmitting(false);
    }
  }

  const parsedPrice = Number(form.price);

  return (
    <main className="page-shell">
      <Navbar role="SELLER" onSearch={() => {}} />

      <div className="content-shell grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel px-6 py-8 sm:px-8 sm:py-9">
          <p className="section-kicker">Create product</p>
          <h1 className="section-title mt-4">Publish a clean, ready-to-sell listing.</h1>
          <p className="section-copy mt-4 max-w-2xl">
            Add the product details your backend already expects and preview the
            listing before it goes live in the seller catalog.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                name="title"
                placeholder="Product title"
                value={form.title}
                onChange={handleChange}
                maxLength={TITLE_MAX_LENGTH}
                className="input-field"
              />
              <p className="mt-2 text-xs text-slate-500">
                {form.title.length}/{TITLE_MAX_LENGTH} characters
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>
              <input
                name="category"
                placeholder="Category"
                value={form.category}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Price
              </label>
              <input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                name="quantity"
                type="number"
                min={1}
                step={1}
                placeholder="1"
                value={form.quantity}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Describe the product, quality, and use case"
              value={form.description}
              onChange={handleChange}
              maxLength={DESCRIPTION_MAX_LENGTH}
              className="textarea-field"
            />
            <p className="mt-2 text-xs text-slate-500">
              {form.description.length}/{DESCRIPTION_MAX_LENGTH} characters
            </p>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Product image
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#b8ccff] bg-[#f8fbff] px-5 py-8 text-center">
              <span className="text-sm font-semibold text-slate-900">
                Upload PNG or JPG
              </span>
              <span className="mt-2 text-sm text-slate-500">
                {file ? file.name : "Choose one image for the listing cover"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="primary-button"
            >
              {submitting ? "Publishing..." : "Publish product"}
            </button>
            <Link href="/home" className="secondary-button">
              Back to dashboard
            </Link>
          </div>
        </section>

        <aside className="panel-strong px-6 py-8 sm:px-8 sm:py-9">
          <p className="section-kicker">Listing preview</p>
          <div className="mt-4 overflow-hidden rounded-[28px] border border-[#d7e3f7] bg-[#fafcff] p-4">
            <AppImage
              src={previewUrl || undefined}
              alt={form.title || "Preview"}
              width={640}
              height={480}
              className="h-72 w-full rounded-[24px] object-cover"
            />
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5370a6]">
                {form.category.trim() || "Category"}
              </p>
              <h2 className="mt-2 line-clamp-2 h-16 text-2xl font-semibold leading-8 text-slate-950">
                {form.title.trim() || "Your product title"}
              </h2>
              <p className="mt-3 line-clamp-2 h-12 text-sm leading-6 text-slate-500">
                {form.description.trim() ||
                  "A concise product description helps buyers decide quickly."}
              </p>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Stock
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {form.quantity || "1"} units
                  </p>
                </div>
                <p className="text-2xl font-semibold text-[#0f43c7]">
                  {Number.isFinite(parsedPrice) && parsedPrice > 0
                    ? formatCurrency(parsedPrice)
                    : "Set a price"}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

