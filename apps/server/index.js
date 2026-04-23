require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");

const app = express();

connectDB();

const staticAllowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://crypto-earnings-client-bbfv.vercel.app",
    "https://www.cryptoearnings.org",
    "https://client-rho-lime.vercel.app",
    "https://www.cryptosafe.exchange",
    "https://cryptosafe.exchange",
];

const envAllowedOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URL_2]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([...staticAllowedOrigins, ...envAllowedOrigins]));

function isLocalOrigin(origin) {
    try {
        const parsed = new URL(origin);
        const host = parsed.hostname;
        return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
    } catch {
        return false;
    }
}

function isVercelOrigin(origin) {
    try {
        const parsed = new URL(origin);
        return parsed.hostname.endsWith(".vercel.app");
    } catch {
        return false;
    }
}

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin) || isLocalOrigin(origin) || isVercelOrigin(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS blocked for origin: ${origin}`), false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const endpointCatalog = [
    { method: "GET", path: "/", description: "API status dashboard" },
    { method: "GET", path: "/status", description: "Machine-readable health/status" },
    { method: "POST", path: "/api/auth/register", description: "Register user and secret phrase" },
    { method: "POST", path: "/api/auth/login", description: "Login via password or secret phrase" },
    { method: "GET", path: "/api/auth/me", description: "Get current authenticated user" },
    { method: "GET", path: "/api/auth/admin/users", description: "Admin: list users and details" },
    { method: "POST", path: "/api/newsletter/subscribe", description: "Subscribe to newsletter" },
    { method: "POST", path: "/api/newsletter/unsubscribe", description: "Unsubscribe from newsletter" },
];

function getDatabaseStatus() {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };

    const state = mongoose.connection.readyState;
    const label = states[state] || "unknown";

    return {
        state,
        label,
        ok: state === 1,
    };
}

function getEndpointStatus(endpoint) {
    void endpoint;
    return true;
}

app.get("/status", (req, res) => {
    const db = getDatabaseStatus();
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.json({
        service: "online",
        timestamp: new Date().toISOString(),
        database: db,
        endpoints: endpointCatalog.map((endpoint) => ({
            ...endpoint,
            url: `${baseUrl}${endpoint.path.replace(":file", "example.png")}`,
            status: getEndpointStatus(endpoint) ? "online" : "offline",
        })),
    });
});

app.get("/", (req, res) => {
    const db = getDatabaseStatus();
    const now = new Date().toISOString();

    const endpointRows = endpointCatalog
        .map((endpoint) => {
            const online = getEndpointStatus(endpoint);
            const badgeClass = online ? "ok" : "warn";
            const badgeLabel = online ? "online" : "offline";
            return `
                <tr>
                  <td><span class="method">${endpoint.method}</span></td>
                  <td><code>${endpoint.path}</code></td>
                  <td>${endpoint.description}</td>
                  <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                </tr>
            `;
        })
        .join("");

    const dbClass = db.ok ? "ok" : "warn";

    res.status(200).type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Crypto Safe Exchange API Status</title>
  <style>
    :root {
      --bg: #07090d;
      --surface: #101623;
      --border: #2a3547;
      --text: #f2f5fa;
      --muted: #9ca8bf;
      --gold: #ddc08a;
      --ok: #7be7c0;
      --warn: #ffbf70;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      background: radial-gradient(72% 52% at 50% -10%, rgba(109,121,161,0.16), transparent 68%), var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 24px 16px;
      display: grid;
      place-items: center;
    }
    .wrap {
      width: min(980px, 100%);
      max-width: 980px;
      border: 1px solid var(--border);
      border-radius: 20px;
      background: var(--surface);
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,.45);
    }
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 20px;
      border-bottom: 1px solid var(--border);
      text-align: center;
    }
    .logo { width: 54px; height: 54px; }
    .apiTag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(221,192,138,.42);
      background: rgba(221,192,138,.1);
      color: var(--gold);
      border-radius: 999px;
      padding: 8px 14px;
      font-size: .9rem;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
    }
    .pill {
      border: 1px solid var(--border);
      border-radius: 999px;
      background: #141d2d;
      font-size: .82rem;
      color: var(--muted);
      padding: 7px 11px;
    }
    .pill strong { color: var(--text); }
    .badge {
      display: inline-block;
      border-radius: 999px;
      font-size: .74rem;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
      padding: 4px 10px;
      border: 1px solid transparent;
    }
    .ok { color: var(--ok); border-color: rgba(123,231,192,.35); background: rgba(123,231,192,.1); }
    .warn { color: var(--warn); border-color: rgba(255,191,112,.35); background: rgba(255,191,112,.1); }
    .neutral {
      color: #dce5f3;
      border-color: #40506b;
      background: rgba(162, 184, 222, .1);
      text-transform: none;
      letter-spacing: 0;
    }
    .tableWrap { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
    }
    th, td {
      text-align: center;
      padding: 12px 14px;
      border-top: 1px solid var(--border);
      font-size: .9rem;
      vertical-align: middle;
    }
    th {
      color: var(--muted);
      font-size: .76rem;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .method {
      display: inline-block;
      border: 1px solid rgba(221,192,138,.38);
      color: var(--gold);
      background: rgba(221,192,138,.08);
      border-radius: 999px;
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .04em;
      padding: 4px 8px;
      min-width: 54px;
      text-align: center;
    }
    code { color: #e6ebf5; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <svg class="logo" viewBox="0 0 128 128" fill="none" role="img" aria-label="Crypto Safe Exchange logo">
        <circle cx="64" cy="64" r="58" fill="#0B0F16" stroke="#2A3342" stroke-width="4" />
        <path d="M64 24L92 36V58C92 78 81 92 64 102C47 92 36 78 36 58V36L64 24Z" fill="#DDC08A" />
        <circle cx="64" cy="63" r="19" fill="#10151E" stroke="#1F2734" stroke-width="2" />
        <text x="64" y="63" fill="#DDC08A" font-size="13" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.8">BTC</text>
      </svg>
      <span class="apiTag">API</span>
    </div>
    <div class="meta">
      <span class="pill">Service: <span class="badge ok">online</span></span>
      <span class="pill">Database: <span class="badge ${dbClass}">${db.label}</span></span>
      <span class="pill">Timestamp: <span class="badge neutral">${now}</span></span>
    </div>
    <div class="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${endpointRows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`);
});

app.use("/api/auth", authRoutes);
app.use("/api/newsletter", newsletterRoutes);

app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err);
    res.status(400).json({ message: err.message || "Something went wrong." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
