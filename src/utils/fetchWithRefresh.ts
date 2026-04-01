export async function fetchWithRefresh(
  input: RequestInfo,
  init: RequestInit = {}
) {
  const { navigateClient } = await import("./clientNavigation");
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 && refreshToken) {
    const refreshRes = await fetch("http://localhost:8080/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", String(data.userId));

      headers.set("Authorization", `Bearer ${data.token}`);
      return fetch(input, { ...init, headers });
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigateClient("/", "replace");
    throw new Error("Session expired. Please log in again.");
  }

  return res;
}
