const jwt = require("jsonwebtoken");
const User = require("../models/User");

function readBearerToken(req) {
    const authHeader = String(req.headers.authorization || "");
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) return "";
    return token.trim();
}

async function requireAuth(req, res, next) {
    try {
        const token = readBearerToken(req);
        if (!token) {
            return res.status(401).json({ message: "Authorization token is required." });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.userId);

        if (!user) {
            return res.status(401).json({ message: "Invalid token." });
        }

        req.user = user;
        req.auth = payload;
        return next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || String(req.user.role || "user") !== "admin") {
        return res.status(403).json({ message: "Admin access required." });
    }
    return next();
}

module.exports = {
    requireAuth,
    requireAdmin,
};
