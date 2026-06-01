// utils/fetchWithRefresh.js
export async function fetchWithRefresh(url, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include", // envoie le cookie refreshToken
  });

  // Si token expiré → on refresh
  if (res.status === 401) {
    const refreshRes = await fetch("http://localhost:5001/api/users/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("token", data.token);

      // Retry la requête originale avec le nouveau token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${data.token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } else {
      // Refresh échoué → logout
      localStorage.clear();
      window.location.href = "/login";
    }
  }

  return res;
}