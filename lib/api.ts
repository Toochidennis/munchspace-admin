const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_MUNCHSPACE_API_KEY || "";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const item = JSON.parse(token);
    if (Date.now() > item.expiry) {
      localStorage.removeItem("accessToken");
      return null;
    }
    return item.value;
  } catch {
    localStorage.removeItem("accessToken");
    return null;
  }
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("refreshToken");
  if (!token) return null;

  try {
    const item = JSON.parse(token);
    if (Date.now() > item.expiry) {
      localStorage.removeItem("refreshToken");
      return null;
    }
    return item.value;
  } catch {
    localStorage.removeItem("refreshToken");
    return null;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (!data?.accessToken) return false;

    // Store new tokens with same TTL (60 days)
    const TTL_MS = 60 * 60 * 24 * 60 * 1000;
    localStorage.setItem(
      "accessToken",
      JSON.stringify({
        value: data.accessToken,
        expiry: Date.now() + TTL_MS,
      }),
    );

    if (data.refreshToken) {
      localStorage.setItem(
        "refreshToken",
        JSON.stringify({
          value: data.refreshToken,
          expiry: Date.now() + TTL_MS,
        }),
      );
    }

    return true;
  } catch {
    return false;
  }
}

export interface ApiError {
  success: false;
  message?: string;
  error?: string;
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  let token = getAccessToken();

  // If no token, try to refresh
  if (!token) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      // Token expired and refresh failed - redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("admin");
        localStorage.removeItem("customer");
        window.location.href = "/login";
      }
      throw new Error("Authentication required");
    }
    token = getAccessToken();
  }

  const headers: HeadersInit = {
    ...options.headers,
    "x-api-key": API_KEY,
  };

  if (!(options.headers as Record<string, string>)?.["Content-Type"]) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // If 401, try to refresh token once and retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = getAccessToken();
      return fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`,
        },
      });
    }
    // Refresh failed - clear auth
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("admin");
      localStorage.removeItem("customer");
      window.location.href = "/login";
    }
  }

  return response;
}

// Helper to parse JSON response
export async function parseApiResponse(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
