import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// In-memory response cache: Map<cacheKey, { data, timestamp }>
const responseCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes TTL

export const clearApiCache = () => responseCache.clear();

const getCacheKey = (config) => {
  const params = config.params ? JSON.stringify(config.params) : "";
  return `${config.url}?${params}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Serve GET requests from cache if still fresh and not forced to refresh
  if (config.method?.toLowerCase() === "get" && !config.forceRefresh) {
    const key = getCacheKey(config);
    const cached = responseCache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      config.adapter = () =>
      Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: "OK (Cached)",
                      headers: config.headers,
                      config,
                      request: {},
      });
    }
  } else if (["post", "patch", "put", "delete"].includes(config.method?.toLowerCase())) {
    // Any mutation automatically invalidates cached GET queries
    responseCache.clear();
  }

  return config;
});

api.interceptors.response.use((response) => {
  if (response.config.method?.toLowerCase() === "get") {
    const key = getCacheKey(response.config);
    responseCache.set(key, {
      data: response.data,
      timestamp: Date.now(),
    });
  }
  return response;
});

export default api;
