const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        username: { type: String, required: true, unique: true, trim: true, lowercase: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        gender: { type: String, required: true, enum: ["male", "female", "other"] },
        phoneNumber: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        profilePictureUrl: { type: String, default: "" },
        passwordHash: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
