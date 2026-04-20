const mongoose = require("mongoose");

const NewsletterSubscriberSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
        status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed" },
        subscribedAt: { type: Date, default: Date.now },
        unsubscribedAt: { type: Date, default: null },
        ip: { type: String, default: "" },
        userAgent: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);
