const AppSettings = require("../models/AppSettings");

function normalizePlanCode(value) {
    return String(value || "").trim().toLowerCase();
}

function toPlanPayload(plan) {
    return {
        code: normalizePlanCode(plan?.code),
        name: String(plan?.name || "").trim(),
        feeUsd: Number(plan?.feeUsd || 0),
        capacity: String(plan?.capacity || "").trim(),
        support: String(plan?.support || "").trim(),
    };
}

function toSettingsPayload(settings) {
    return {
        id: settings._id,
        btcWalletAddress: String(settings.btcWalletAddress || "").trim(),
        plans: (Array.isArray(settings.plans) ? settings.plans : []).map(toPlanPayload),
        updatedAt: settings.updatedAt,
    };
}

exports.publicSettings = async (req, res) => {
    try {
        const settings = await AppSettings.getSingleton();
        return res.json(toSettingsPayload(settings));
    } catch (err) {
        console.error("PUBLIC SETTINGS ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};

exports.adminSettings = async (req, res) => {
    try {
        const settings = await AppSettings.getSingleton();
        return res.json(toSettingsPayload(settings));
    } catch (err) {
        console.error("ADMIN SETTINGS ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};

exports.updateAdminSettings = async (req, res) => {
    try {
        const settings = await AppSettings.getSingleton();
        const nextWalletAddress = String(req.body?.btcWalletAddress || "").trim();
        const nextPlansInput = Array.isArray(req.body?.plans) ? req.body.plans : null;

        if (!nextWalletAddress) {
            return res.status(400).json({ message: "BTC wallet address is required." });
        }

        if (!nextPlansInput || nextPlansInput.length === 0) {
            return res.status(400).json({ message: "At least one plan is required." });
        }

        const seenCodes = new Set();
        const nextPlans = [];

        for (const plan of nextPlansInput) {
            const code = normalizePlanCode(plan?.code);
            const name = String(plan?.name || "").trim();
            const capacity = String(plan?.capacity || "").trim();
            const support = String(plan?.support || "").trim();
            const feeUsd = Number(plan?.feeUsd);

            if (!code || !name) {
                return res.status(400).json({ message: "Each plan must include a code and name." });
            }

            if (seenCodes.has(code)) {
                return res.status(400).json({ message: "Plan codes must be unique." });
            }
            seenCodes.add(code);

            if (!Number.isFinite(feeUsd) || feeUsd < 0) {
                return res.status(400).json({ message: `Invalid fee for plan "${name}".` });
            }

            nextPlans.push({
                code,
                name,
                capacity,
                support,
                feeUsd,
            });
        }

        settings.btcWalletAddress = nextWalletAddress;
        settings.plans = nextPlans;
        await settings.save();

        return res.json({
            message: "Settings updated.",
            settings: toSettingsPayload(settings),
        });
    } catch (err) {
        console.error("UPDATE SETTINGS ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};
