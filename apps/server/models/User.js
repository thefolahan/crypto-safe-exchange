const mongoose = require("mongoose");

const selectedPlanSchema = new mongoose.Schema(
    {
        code: { type: String, trim: true, lowercase: true, default: "" },
        name: { type: String, trim: true, default: "" },
        feeUsd: { type: Number, min: 0, default: 0 },
        status: {
            type: String,
            enum: ["none", "awaiting_payment", "awaiting_verification", "active"],
            default: "none",
        },
        selectedAt: { type: Date, default: null },
        activatedAt: { type: Date, default: null },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        username: { type: String, required: true, unique: true, trim: true, lowercase: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        gender: { type: String, required: true, enum: ["male", "female", "other"] },
        phoneNumber: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        passwordHash: { type: String, required: true },
        secretPhraseDigest: { type: String, required: true, unique: true, sparse: true },
        portfolioUsd: { type: Number, min: 0, default: 0 },
        selectedPlan: { type: selectedPlanSchema, default: () => ({ status: "none", feeUsd: 0 }) },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
