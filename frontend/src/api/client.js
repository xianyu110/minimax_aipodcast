const API_URL = process.env.REACT_APP_API_URL || "";

function getToken() {
  return localStorage.getItem("access_token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  return res;
}

export async function register(email, password, displayName) {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return { ok: res.ok, ...data };
}

export async function login(email, password) {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  return { ok: res.ok, ...data };
}

export async function getMe() {
  const res = await apiFetch("/api/auth/me");
  return { ok: res.ok, user: await res.json().then((d) => d.user) };
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
}

export async function fetchGenerations() {
  const res = await apiFetch("/api/generations");
  return res.json();
}

export async function fetchGeneration(id) {
  const res = await apiFetch(`/api/generations/${id}`);
  return res.json();
}

export { apiFetch };
