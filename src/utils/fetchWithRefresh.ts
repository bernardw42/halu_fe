export async function fetchWithRefresh(
  input: RequestInfo,
  init: RequestInit = {}
) {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 && refreshToken) {
    console.log("🔄 Token expired — attempting refresh...");

    const refreshRes = await fetch("http://localhost:8080/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      console.log("✅ Got new token from refresh");
      localStorage.setItem("token", data.token);

      headers.set("Authorization", `Bearer ${data.token}`);

      // Retry original request with new token
      return fetch(input, { ...init, headers });
    } else {
      console.log("❌ Refresh failed — logging out");
      localStorage.clear();
      window.location.href = "/";
      throw new Error("Session expired — please log in again");
    }
  }

  return res;
}
