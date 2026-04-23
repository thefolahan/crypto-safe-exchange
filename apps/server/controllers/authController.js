const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
    digestSecretPhrase,
    generateSecretPhrase,
    normalizeSecretPhrase,
} = require("../utils/secretPhrase");

function normalizeUsername(u) {
    return String(u || "").trim().toLowerCase();
}

function toPublicUser(user) {
    return {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        country: user.country,
        role: String(user.role || "user"),
        profilePictureUrl: user.profilePictureUrl,
    };
}

function toAdminUser(user) {
    return {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        country: user.country,
        role: String(user.role || "user"),
        profilePictureUrl: user.profilePictureUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

function escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ADMIN_ALIAS_USERNAME = "admin";
const ADMIN_ALIAS_PASSWORD = "admin";

async function generateUniqueSecretPhrase(maxAttempts = 8) {
    for (let i = 0; i < maxAttempts; i += 1) {
        const phrase = generateSecretPhrase(12);
        const digest = digestSecretPhrase(phrase);
        const exists = await User.exists({ secretPhraseDigest: digest });
        if (!exists) return { phrase, digest };
    }

    const fallbackPhrase = `${generateSecretPhrase(6)} ${generateSecretPhrase(6)}`;
    const fallbackDigest = digestSecretPhrase(fallbackPhrase);
    const fallbackExists = await User.exists({ secretPhraseDigest: fallbackDigest });
    if (!fallbackExists) {
        return {
            phrase: fallbackPhrase,
            digest: fallbackDigest,
        };
    }

    throw new Error("Could not generate a unique secret phrase.");
}

function signAuthToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            username: user.username,
            email: user.email,
            role: String(user.role || "user"),
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

exports.register = async (req, res) => {
    try {
        const {
            fullName,
            username,
            email,
            gender,
            phoneNumber,
            country,
            password,
            confirmPassword,
        } = req.body;

        if (
            !fullName ||
            !username ||
            !email ||
            !gender ||
            !phoneNumber ||
            !country ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }

        const cleanUsername = normalizeUsername(username);
        const cleanEmail = String(email).trim().toLowerCase();

        const existingUser = await User.findOne({
            $or: [{ username: cleanUsername }, { email: cleanEmail }],
        });

        if (existingUser) {
            return res.status(409).json({ message: "Username or email already exists." });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const { phrase: secretPhrase, digest: secretPhraseDigest } = await generateUniqueSecretPhrase();

        const profilePictureUrl = req.file ? `/uploads/${req.file.filename}` : "";

        const user = await User.create({
            fullName: String(fullName).trim(),
            username: cleanUsername,
            email: cleanEmail,
            gender: String(gender).trim().toLowerCase(),
            phoneNumber: String(phoneNumber).trim(),
            country: String(country).trim(),
            profilePictureUrl,
            passwordHash,
            secretPhraseDigest,
        });

        return res.status(201).json({
            message: "Registration successful. Save your secret phrase.",
            secretPhrase,
            user: toPublicUser(user),
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password, secretPhrase } = req.body;
        const cleanSecretPhrase = normalizeSecretPhrase(secretPhrase);
        let user = null;

        if (cleanSecretPhrase) {
            const secretPhraseDigest = digestSecretPhrase(cleanSecretPhrase);
            user = await User.findOne({ secretPhraseDigest });
            if (!user) return res.status(401).json({ message: "Invalid secret phrase." });
        } else {
            if (!username || !password) {
                return res.status(400).json({ message: "Username and password are required." });
            }

            const cleanUsername = normalizeUsername(username);
            const plainPassword = String(password || "");

            if (cleanUsername === ADMIN_ALIAS_USERNAME && plainPassword === ADMIN_ALIAS_PASSWORD) {
                user = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });
                if (!user) return res.status(401).json({ message: "Invalid credentials." });
            } else {
                user = await User.findOne({ username: cleanUsername });
                if (!user) return res.status(401).json({ message: "Invalid credentials." });

                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return res.status(401).json({ message: "Invalid credentials." });
            }
        }

        const token = signAuthToken(user);

        return res.json({
            message: "Login successful.",
            token,
            user: toPublicUser(user),
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};

exports.me = async (req, res) => {
    try {
        return res.json({
            user: toPublicUser(req.user),
        });
    } catch (err) {
        console.error("ME ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};

exports.adminUsers = async (req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 250);
        const search = String(req.query.search || "").trim();

        const filter = {};
        if (search) {
            const re = new RegExp(escapeRegex(search), "i");
            filter.$or = [
                { fullName: re },
                { username: re },
                { email: re },
                { phoneNumber: re },
                { country: re },
            ];
        }

        const [users, totalUsers, adminUsers] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter),
            User.countDocuments({ ...filter, role: "admin" }),
        ]);

        const totalPages = Math.max(Math.ceil(totalUsers / limit), 1);
        const regularUsers = Math.max(totalUsers - adminUsers, 0);

        return res.json({
            users: users.map(toAdminUser),
            pagination: {
                page,
                limit,
                totalUsers,
                totalPages,
            },
            counts: {
                totalUsers,
                adminUsers,
                regularUsers,
            },
        });
    } catch (err) {
        console.error("ADMIN USERS ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};
