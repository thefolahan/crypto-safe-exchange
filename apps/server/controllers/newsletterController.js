const NewsletterSubscriber = require("../models/NewsletterSubscriber");

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.subscribe = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email) return res.status(400).json({ message: "Email is required." });
        if (!isValidEmail(email)) return res.status(400).json({ message: "Enter a valid email address." });

        const existing = await NewsletterSubscriber.findOne({ email });

        if (existing && existing.status === "subscribed") {
            return res.status(200).json({ message: "You're already subscribed." });
        }

        if (existing && existing.status === "unsubscribed") {
            existing.status = "subscribed";
            existing.subscribedAt = new Date();
            existing.unsubscribedAt = null;
            existing.ip = req.ip || "";
            existing.userAgent = req.headers["user-agent"] || "";
            await existing.save();

            return res.status(200).json({ message: "Welcome back! You’re subscribed again." });
        }

        await NewsletterSubscriber.create({
            email,
            status: "subscribed",
            subscribedAt: new Date(),
            ip: req.ip || "",
            userAgent: req.headers["user-agent"] || "",
        });

        return res.status(201).json({ message: "Subscribed successfully!" });
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(200).json({ message: "You're already subscribed." });
        }

        console.error("NEWSLETTER SUBSCRIBE ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email) return res.status(400).json({ message: "Email is required." });

        const existing = await NewsletterSubscriber.findOne({ email });
        if (!existing || existing.status === "unsubscribed") {
            return res.status(200).json({ message: "You’re already unsubscribed." });
        }

        existing.status = "unsubscribed";
        existing.unsubscribedAt = new Date();
        await existing.save();

        return res.status(200).json({ message: "Unsubscribed successfully." });
    } catch (err) {
        console.error("NEWSLETTER UNSUBSCRIBE ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};
