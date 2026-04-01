export async function readApiError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();

    if (data?.fieldErrors && typeof data.fieldErrors === "object") {
      return Object.values(data.fieldErrors).join(" ");
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  const text = await response.text();
  return text.trim() || "Request failed.";
}
