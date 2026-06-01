const BASE_URL = "http://localhost:5001/api";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  // Si le body est un FormData, ne pas mettre Content-Type
  // Le navigateur le met automatiquement avec le bon boundary
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
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