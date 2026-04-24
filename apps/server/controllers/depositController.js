const DepositRequest = require("../models/DepositRequest");
const AppSettings = require("../models/AppSettings");
const User = require("../models/User");

function normalizePlanCode(value) {
    return String(value || "").trim().toLowerCase();
}

function toDepositPayload(deposit) {
    const hasPopulatedUser = Boolean(deposit?.user && typeof deposit.user === "object" && deposit.user._id);
    return {
        id: deposit._id,
        userId: hasPopulatedUser ? deposit.user._id : deposit.user,
        user: hasPopulatedUser
            ? {
                id: deposit.user._id,
                username: deposit.user.username,
                fullName: deposit.user.fullName,
                email: deposit.user.email,
            }
            : null,
        walletAddress: String(deposit.walletAddress || ""),
        kind: String(deposit.kind || "wallet_deposit"),
        amountUsd: Number(deposit.amountUsd || 0),
        creditedAmountUsd: Number(deposit.creditedAmountUsd || 0),
        txReference: String(deposit.txReference || ""),
        planCode: String(deposit.planCode || ""),
        planName: String(deposit.planName || ""),
        status: String(deposit.status || "pending"),
        adminNote: String(deposit.adminNote || ""),
        reviewedAt: deposit.reviewedAt || null,
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt,
    };
}

exports.createDeposit = async (req, res) => {
    try {
        const settings = await AppSettings.getSingleton();
        const walletAddress = String(settings.btcWalletAddress || "").trim();
        const kind = req.body?.kind === "plan_payment" ? "plan_payment" : "wallet_deposit";
        const txReference = String(req.body?.txReference || "").trim();

        let amountUsd = Number(req.body?.amountUsd);
        let planCode = "";
        let planName = "";

        if (kind === "wallet_deposit") {
            if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
                return res.status(400).json({ message: "Deposit amount must be greater than 0." });
            }
        } else {
            const selectedPlan = req.user?.selectedPlan || {};
            planCode = normalizePlanCode(selectedPlan.code);
            planName = String(selectedPlan.name || "").trim();
            amountUsd = Number(selectedPlan.feeUsd || 0);

            if (!planCode || !planName || amountUsd <= 0) {
                return res.status(400).json({ message: "Select a paid plan first before submitting payment." });
            }

            if (String(selectedPlan.status || "") === "active") {
                return res.status(409).json({ message: "This plan is already active." });
            }

            const existingPendingPlanPayment = await DepositRequest.findOne({
                user: req.user._id,
                kind: "plan_payment",
                planCode,
                status: "pending",
            });

            if (existingPendingPlanPayment) {
                return res.status(409).json({
                    message: "A pending plan payment already exists for this plan.",
                    deposit: toDepositPayload(existingPendingPlanPayment),
                });
            }
        }

        const deposit = await DepositRequest.create({
            user: req.user._id,
            walletAddress,
            kind,
            amountUsd,
            creditedAmountUsd: amountUsd,
            txReference,
            planCode,
            planName,
            status: "pending",
        });

        if (kind === "plan_payment") {
            req.user.selectedPlan.status = "awaiting_verification";
            await req.user.save();
        }

        return res.status(201).json({
            message: "Deposit submitted. It will reflect after admin verification.",
            deposit: toDepositPayload(deposit),
            selectedPlan: req.user.selectedPlan,
        });
    } catch (err) {
        console.error("CREATE DEPOSIT ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};

exports.myDeposits = async (req, res) => {
    try {
        const deposits = await DepositRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
        return res.json({
            deposits: deposits.map(toDepositPayload),
        });
    } catch (err) {
        console.error("MY DEPOSITS ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};

exports.adminDeposits = async (req, res) => {
    try {
        const status = String(req.query?.status || "").trim().toLowerCase();
        const filter = {};

        if (["pending", "approved", "rejected"].includes(status)) {
            filter.status = status;
        }

        const deposits = await DepositRequest.find(filter)
            .sort({ createdAt: -1 })
            .limit(250)
            .populate("user", "_id username fullName email");

        return res.json({
            deposits: deposits.map(toDepositPayload),
        });
    } catch (err) {
        console.error("ADMIN DEPOSITS ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};

exports.adminReviewDeposit = async (req, res) => {
    try {
        const depositId = String(req.params?.depositId || "").trim();
        const nextStatus = String(req.body?.status || "").trim().toLowerCase();
        const adminNote = String(req.body?.adminNote || "").trim();

        if (!["approved", "rejected"].includes(nextStatus)) {
            return res.status(400).json({ message: "Status must be approved or rejected." });
        }

        const deposit = await DepositRequest.findById(depositId);
        if (!deposit) return res.status(404).json({ message: "Deposit not found." });

        if (deposit.status !== "pending") {
            return res.status(409).json({ message: "Only pending deposits can be reviewed." });
        }

        const user = await User.findById(deposit.user);
        if (!user) {
            return res.status(404).json({ message: "Deposit user no longer exists." });
        }

        if (nextStatus === "approved") {
            const requestedCredit = Number(req.body?.creditedAmountUsd);
            const creditedAmountUsd =
                Number.isFinite(requestedCredit) && requestedCredit >= 0 ? requestedCredit : Number(deposit.amountUsd || 0);

            deposit.status = "approved";
            deposit.creditedAmountUsd = creditedAmountUsd;
            user.portfolioUsd = Number(user.portfolioUsd || 0) + creditedAmountUsd;

            if (deposit.kind === "plan_payment") {
                const selectedPlanCode = normalizePlanCode(user.selectedPlan?.code);
                if (selectedPlanCode && selectedPlanCode === normalizePlanCode(deposit.planCode)) {
                    user.selectedPlan.status = "active";
                    user.selectedPlan.activatedAt = new Date();
                }
            }
        } else {
            deposit.status = "rejected";
            if (deposit.kind === "plan_payment") {
                const selectedPlanCode = normalizePlanCode(user.selectedPlan?.code);
                if (
                    selectedPlanCode &&
                    selectedPlanCode === normalizePlanCode(deposit.planCode) &&
                    String(user.selectedPlan?.status || "") === "awaiting_verification"
                ) {
                    user.selectedPlan.status = "awaiting_payment";
                }
            }
        }

        deposit.reviewedBy = req.user._id;
        deposit.reviewedAt = new Date();
        deposit.adminNote = adminNote;

        await Promise.all([deposit.save(), user.save()]);

        return res.json({
            message: `Deposit ${nextStatus}.`,
            deposit: toDepositPayload(deposit),
            user: {
                id: user._id,
                portfolioUsd: Number(user.portfolioUsd || 0),
                selectedPlan: user.selectedPlan,
            },
        });
    } catch (err) {
        console.error("ADMIN REVIEW DEPOSIT ERROR:", err);
        return res.status(500).json({ message: "Server error." });
    }
};
