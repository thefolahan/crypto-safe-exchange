const mongoose = require("mongoose");

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
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
