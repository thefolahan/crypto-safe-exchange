const mongoose = require("mongoose");

const SETTINGS_KEY = "default";

const DEFAULT_PLANS = [
    {
        code: "basic-safe",
        name: "Basic Safe",
        feeUsd: 0,
        capacity: "Up to $25,000",
        support: "Email support",
    },
    {
        code: "plus-safe",
        name: "Plus Safe",
        feeUsd: 19,
        capacity: "Up to $250,000",
        support: "Priority support",
    },
    {
        code: "premium-safe",
        name: "Premium Safe",
        feeUsd: 79,
        capacity: "Up to $1,000,000",
        support: "24/7 concierge support",
    },
];

const DEFAULT_BTC_WALLET_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

function cloneDefaultPlans() {
    return DEFAULT_PLANS.map((plan) => ({ ...plan }));
}

const planSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, trim: true, lowercase: true },
        name: { type: String, required: true, trim: true },
        feeUsd: { type: Number, required: true, min: 0 },
        capacity: { type: String, trim: true, default: "" },
        support: { type: String, trim: true, default: "" },
    },
    { _id: false }
);

const appSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
        btcWalletAddress: { type: String, required: true, trim: true, default: DEFAULT_BTC_WALLET_ADDRESS },
        plans: { type: [planSchema], default: cloneDefaultPlans },
    },
    { timestamps: true }
);

appSettingsSchema.statics.getSingleton = async function getSingleton() {
    let settings = await this.findOne({ key: SETTINGS_KEY });

    if (!settings) {
        settings = await this.create({
            key: SETTINGS_KEY,
            btcWalletAddress: DEFAULT_BTC_WALLET_ADDRESS,
            plans: cloneDefaultPlans(),
        });
        return settings;
    }

    let changed = false;

    if (!settings.btcWalletAddress) {
        settings.btcWalletAddress = DEFAULT_BTC_WALLET_ADDRESS;
        changed = true;
    }

    if (!Array.isArray(settings.plans) || settings.plans.length === 0) {
        settings.plans = cloneDefaultPlans();
        changed = true;
    }

    if (changed) {
        await settings.save();
    }

    return settings;
};

module.exports = mongoose.model("AppSettings", appSettingsSchema);
module.exports.SETTINGS_KEY = SETTINGS_KEY;
module.exports.DEFAULT_BTC_WALLET_ADDRESS = DEFAULT_BTC_WALLET_ADDRESS;
module.exports.DEFAULT_PLANS = DEFAULT_PLANS;
