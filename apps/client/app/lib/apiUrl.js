const rawApiBase = process.env.NEXT_PUBLIC_API_URL;

function sanitizeBaseUrl(value) {
    if (!value) return "";
    const cleaned = String(value).trim();
    if (!cleaned || cleaned === "undefined" || cleaned === "null") return "";
    return cleaned.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
    const fromEnv = sanitizeBaseUrl(rawApiBase);
    if (fromEnv) return fromEnv;
    return "https://crypto-safe-exchange.onrender.com";
}

export function buildApiUrl(path = "") {
    const normalizedPath = String(path).startsWith("/") ? path : `/${path}`;
    return `${getApiBaseUrl()}${normalizedPath}`;
}
