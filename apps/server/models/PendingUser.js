const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        username: { type: String, required: true, trim: true, lowercase: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        gender: { type: String, required: true, enum: ["male", "female", "other"] },
        phoneNumber: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        profilePictureUrl: { type: String, default: "" },
        passwordHash: { type: String, required: true },
        status: { type: String, enum: ["pending", "confirmed", "denied"], default: "pending" },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

pendingUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PendingUser", pendingUserSchema);
