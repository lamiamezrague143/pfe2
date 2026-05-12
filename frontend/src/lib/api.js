const BASE_URL = "http://localhost:5001/api";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/";
    return null;
  }

  return res.json();
}