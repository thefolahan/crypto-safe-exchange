const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { DEMO_SECRET_PHRASE, digestSecretPhrase } = require("../utils/secretPhrase");

const DEMO_USER = {
    fullName: "Demo Trader",
    username: "fakeuser",
    email: "fakeuser@cryptosafeexchange.com",
    gender: "other",
    phoneNumber: "+10000000000",
    country: "United States",
    role: "admin",
    profilePictureUrl: "",
};

const DEMO_PASSWORD = "fakeuser123";

async function ensureDemoUser() {
    const secretPhraseDigest = digestSecretPhrase(DEMO_SECRET_PHRASE);
    const existingByPhrase = await User.findOne({ secretPhraseDigest });
    if (existingByPhrase) {
        if (existingByPhrase.role !== "admin") {
            existingByPhrase.role = "admin";
            await existingByPhrase.save();
            console.log("✅ Demo user role updated to admin");
        }
        return existingByPhrase;
    }

    const existingByIdentity = await User.findOne({
        $or: [{ username: DEMO_USER.username }, { email: DEMO_USER.email }],
    });

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    if (existingByIdentity) {
        existingByIdentity.passwordHash = passwordHash;
        existingByIdentity.secretPhraseDigest = secretPhraseDigest;
        existingByIdentity.role = "admin";
        await existingByIdentity.save();
        console.log("✅ Demo user updated with secret phrase and admin role");
        return existingByIdentity;
    }

    const created = await User.create({
        ...DEMO_USER,
        passwordHash,
        secretPhraseDigest,
    });

    console.log("✅ Demo user created with secret phrase");
    return created;
}

module.exports = {
    DEMO_PASSWORD,
    DEMO_SECRET_PHRASE,
    DEMO_USERNAME: DEMO_USER.username,
    ensureDemoUser,
};
