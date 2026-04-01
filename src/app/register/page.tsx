"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadImageToCloudinary } from "../create-product/utils/uploadImage";
import AppImage from "../../components/ui/AppImage";
import { readApiError } from "../../utils/readApiError";

const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)\S+$/;
const NATIONAL_ID_PATTERN = /^\d{8,20}$/;
const DEFAULT_PROFILE_IMAGE_URL =
  "https://ui-avatars.com/api/?name=User&background=e8f0ff&color=1b5cff&bold=true&size=256";
const PROFILE_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
    <rect width="200" height="200" rx="100" fill="#E8F0FF"/>
    <circle cx="100" cy="78" r="34" fill="#9BB8FF"/>
    <path d="M44 168c9-28 30-44 56-44s47 16 56 44" fill="#9BB8FF"/>
  </svg>`
)}`;
const PREVIEW_SIZE = 128;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.4;

type CropState = {
  zoom: number;
  x: number;
  y: number;
};

const DEFAULT_CROP: CropState = {
  zoom: 1,
  x: 0,
  y: 0,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getMaxOffset(zoom: number) {
  return Math.round((zoom - 1) * 52);
}

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read the selected image."));
    };

    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

async function loadImage(source: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process the selected image."));
    image.src = source;
  });
}

async function createCircularCroppedFile(source: string, crop: CropState) {
  const image = await loadImage(source);
  const exportSize = 480;
  const canvas = document.createElement("canvas");
  canvas.width = exportSize;
  canvas.height = exportSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not prepare the profile image.");
  }

  const coverScale = Math.max(exportSize / image.width, exportSize / image.height);
  const drawWidth = image.width * coverScale * crop.zoom;
  const drawHeight = image.height * coverScale * crop.zoom;
  const previewScale = exportSize / PREVIEW_SIZE;

  context.clearRect(0, 0, exportSize, exportSize);
  context.save();
  context.beginPath();
  context.arc(exportSize / 2, exportSize / 2, exportSize / 2, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  context.drawImage(
    image,
    (exportSize - drawWidth) / 2 + crop.x * previewScale,
    (exportSize - drawHeight) / 2 + crop.y * previewScale,
    drawWidth,
    drawHeight
  );
  context.restore();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Profile image export failed.");
  }

  return new File([blob], "profile-image.png", { type: "image/png" });
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [nationalId, setNationalId] = useState("");
  const [imageSource, setImageSource] = useState("");
  const [crop, setCrop] = useState<CropState>(DEFAULT_CROP);
  const [draftImageSource, setDraftImageSource] = useState("");
  const [draftCrop, setDraftCrop] = useState<CropState>(DEFAULT_CROP);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
  }, []);

  useEffect(() => {
    if (!isCropModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCropModalOpen]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const closeCropModal = () => {
    setIsCropModalOpen(false);
    setDraftImageSource("");
    setDraftCrop(DEFAULT_CROP);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPG or PNG images are allowed.");
      event.target.value = "";
      return;
    }

    try {
      const nextSource = await readFileAsDataUrl(file);
      setDraftImageSource(nextSource);
      setDraftCrop(DEFAULT_CROP);
      setIsCropModalOpen(true);
    } catch {
      toast.error("Image selection failed.");
    }

    event.target.value = "";
  };

  const handleOpenEditor = () => {
    if (!imageSource) {
      openFilePicker();
      return;
    }

    setDraftImageSource(imageSource);
    setDraftCrop(crop);
    setIsCropModalOpen(true);
  };

  const handleSaveCrop = () => {
    if (!draftImageSource) return;

    setImageSource(draftImageSource);
    setCrop(draftCrop);
    setIsCropModalOpen(false);
    setDraftImageSource("");
    setDraftCrop(DEFAULT_CROP);
    toast.success("Profile photo updated.");
  };

  const validateRegisterForm = () => {
    const trimmedUsername = username.trim();
    const trimmedNationalId = nationalId.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return "Username must be between 3 and 30 characters.";
    }

    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      return "Username can only contain letters, numbers, dots, underscores, and hyphens.";
    }

    if (password.length < 8 || password.length > 72) {
      return "Password must be between 8 and 72 characters.";
    }

    if (!PASSWORD_PATTERN.test(password)) {
      return "Password must contain at least one letter, one number, and no spaces.";
    }

    if (password !== confirmPassword) {
      return "Password confirmation does not match.";
    }

    if (!NATIONAL_ID_PATTERN.test(trimmedNationalId)) {
      return "National ID must be 8 to 20 digits.";
    }

    return null;
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateRegisterForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);

    try {
      let profileImageUrl = DEFAULT_PROFILE_IMAGE_URL;

      if (imageSource) {
        setUploading(true);
        const croppedImage = await createCircularCroppedFile(imageSource, crop);
        profileImageUrl = await uploadImageToCloudinary(croppedImage);
      }

      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          role,
          nationalId: nationalId.trim(),
          profileImageUrl,
        }),
      });

      if (!res.ok) {
        toast.error(await readApiError(res));
        return;
      }

      toast.success("Registration successful.");
      router.replace("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration could not be completed."
      );
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  const draftCropLimit = getMaxOffset(draftCrop.zoom);
  const hasSavedPreview = Boolean(imageSource);

  return (
    <>
      <main className="page-shell flex min-h-[100dvh] items-center justify-center py-3 sm:py-4">
        <div className="content-shell max-w-2xl">
          <section className="panel-strong px-5 py-5 sm:px-6 sm:py-5">
            <div className="text-center">
              <h1 className="text-[23px] font-semibold tracking-[-0.05em] text-slate-950">
                Build your account
              </h1>
              <p className="mt-1.5 text-[13px] text-slate-500">
                One clean form, then you are in.
              </p>
            </div>

            <form onSubmit={handleRegister} className="mt-5 space-y-4">
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
              />

              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={handleOpenEditor}
                  className="group relative rounded-full focus:outline-none focus:ring-4 focus:ring-[#dfe9ff]"
                  aria-label={hasSavedPreview ? "Edit profile image" : "Upload profile image"}
                >
                  <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-[#edf3ff] shadow-[0_14px_28px_rgba(15,67,199,0.16)]">
                    <AppImage
                      src={hasSavedPreview ? imageSource : PROFILE_PLACEHOLDER}
                      alt="Profile preview"
                      fill
                      sizes="128px"
                      className="object-cover"
                      style={{
                        transform: hasSavedPreview
                          ? `translate(${crop.x}px, ${crop.y}px) scale(${crop.zoom})`
                          : undefined,
                        transformOrigin: "center",
                      }}
                    />
                  </div>
                  <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-slate-950 text-white shadow-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4 20h4l10.5-10.5a1.414 1.414 0 000-2L16.5 5.5a1.414 1.414 0 00-2 0L4 16v4z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                <p className="mt-2 text-[13px] font-medium text-slate-900">
                  {username.trim() || "Profile photo"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Username
                  </label>
                  <input
                    className="input-field rounded-xl px-3.5 py-2.5 text-[13px]"
                    placeholder="3 to 30 characters"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    National ID
                  </label>
                  <input
                    className="input-field rounded-xl px-3.5 py-2.5 text-[13px]"
                    placeholder="8 to 20 digits"
                    value={nationalId}
                    onChange={(event) => setNationalId(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Password
                  </label>
                  <input
                    className="input-field rounded-xl px-3.5 py-2.5 text-[13px]"
                    placeholder="Letters and numbers, no spaces"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Confirm password
                  </label>
                  <input
                    className="input-field rounded-xl px-3.5 py-2.5 text-[13px]"
                    placeholder="Repeat your password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Account type
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole("BUYER")}
                    className={
                      role === "BUYER"
                        ? "secondary-button rounded-xl border-[#9cb9ff] bg-[#edf3ff] px-4 py-2.5 text-[13px] text-[#0f43c7]"
                        : "secondary-button rounded-xl px-4 py-2.5 text-[13px]"
                    }
                  >
                    Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("SELLER")}
                    className={
                      role === "SELLER"
                        ? "secondary-button rounded-xl border-[#9cb9ff] bg-[#edf3ff] px-4 py-2.5 text-[13px] text-[#0f43c7]"
                        : "secondary-button rounded-xl px-4 py-2.5 text-[13px]"
                    }
                  >
                    Seller
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="primary-button w-full rounded-xl py-2.5 text-[13px]"
                disabled={uploading || submitting}
              >
                {uploading
                  ? "Uploading profile..."
                  : submitting
                  ? "Creating account..."
                  : "Register"}
              </button>

              <p className="pt-1 text-center text-[13px] text-slate-500">
                Already have an account?{" "}
                <Link href="/" className="font-semibold text-[#0f43c7]">
                  Login instead
                </Link>
              </p>
            </form>
          </section>
        </div>
      </main>

      {isCropModalOpen && draftImageSource ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="panel-strong w-full max-w-sm px-5 py-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-950">Adjust your photo</h2>
              <p className="mt-1.5 text-[13px] text-slate-500">Save to update the preview.</p>
            </div>

            <div className="mt-5 flex flex-col items-center">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-[#edf3ff] shadow-[0_14px_28px_rgba(15,67,199,0.16)]">
                <AppImage
                  src={draftImageSource}
                  alt="Draft profile preview"
                  fill
                  sizes="128px"
                  className="object-cover"
                  style={{
                    transform: `translate(${draftCrop.x}px, ${draftCrop.y}px) scale(${draftCrop.zoom})`,
                    transformOrigin: "center",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={openFilePicker}
                className="mt-4 text-[13px] font-semibold text-[#0f43c7]"
              >
                Choose different photo
              </button>
            </div>

            <div className="mt-5 space-y-3 rounded-[22px] border border-[#d7e3f7] bg-[#f8fbff] px-4 py-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Zoom
                </span>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step="0.05"
                  value={draftCrop.zoom}
                  onChange={(event) => {
                    const nextZoom = Number(event.target.value);
                    const nextLimit = getMaxOffset(nextZoom);
                    setDraftCrop((current) => ({
                      zoom: nextZoom,
                      x: clamp(current.x, -nextLimit, nextLimit),
                      y: clamp(current.y, -nextLimit, nextLimit),
                    }));
                  }}
                  className="w-full accent-[#1b5cff]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Horizontal
                </span>
                <input
                  type="range"
                  min={-draftCropLimit}
                  max={draftCropLimit}
                  step="1"
                  value={draftCrop.x}
                  disabled={!draftCropLimit}
                  onChange={(event) =>
                    setDraftCrop((current) => ({
                      ...current,
                      x: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-[#1b5cff] disabled:opacity-40"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Vertical
                </span>
                <input
                  type="range"
                  min={-draftCropLimit}
                  max={draftCropLimit}
                  step="1"
                  value={draftCrop.y}
                  disabled={!draftCropLimit}
                  onChange={(event) =>
                    setDraftCrop((current) => ({
                      ...current,
                      y: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-[#1b5cff] disabled:opacity-40"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeCropModal}
                className="secondary-button w-full rounded-xl py-2.5 text-[13px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCrop}
                className="primary-button w-full rounded-xl py-2.5 text-[13px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

