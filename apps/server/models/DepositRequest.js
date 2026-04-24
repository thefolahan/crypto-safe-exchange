const mongoose = require("mongoose");

const depositRequestSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        walletAddress: { type: String, required: true, trim: true },
        kind: { type: String, enum: ["wallet_deposit", "plan_payment"], default: "wallet_deposit", index: true },
        amountUsd: { type: Number, required: true, min: 0 },
        creditedAmountUsd: { type: Number, required: true, min: 0, default: 0 },
        txReference: { type: String, trim: true, default: "" },
        planCode: { type: String, trim: true, lowercase: true, default: "" },
        planName: { type: String, trim: true, default: "" },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        reviewedAt: { type: Date, default: null },
        adminNote: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("DepositRequest", depositRequestSchema);
