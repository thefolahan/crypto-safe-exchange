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
    role: "user",
};

const DEMO_PASSWORD = "fakeuser123";
const ADMIN_ALIAS_USER = {
    fullName: "System Admin",
    username: "admin",
    email: "admin@cryptosafeexchange.com",
    gender: "other",
    phoneNumber: "+10000000001",
    country: "United States",
    role: "admin",
};
const ADMIN_ALIAS_PASSWORD = "admin";
const ADMIN_ALIAS_SECRET_PHRASE = "harbor canyon ember lunar matrix signal garden nectar island radar quartz voyage";

async function ensureAdminAliasUser() {
    const adminPasswordHash = await bcrypt.hash(ADMIN_ALIAS_PASSWORD, 12);
    let adminSecretPhraseDigest = digestSecretPhrase(ADMIN_ALIAS_SECRET_PHRASE);

    const digestOwner = await User.findOne({ secretPhraseDigest: adminSecretPhraseDigest });
    if (digestOwner && digestOwner.username !== ADMIN_ALIAS_USER.username) {
        adminSecretPhraseDigest = digestSecretPhrase(`${ADMIN_ALIAS_SECRET_PHRASE} admin`);
    }

    const existingAdmin = await User.findOne({ username: ADMIN_ALIAS_USER.username });

    if (existingAdmin) {
        existingAdmin.fullName = ADMIN_ALIAS_USER.fullName;
        existingAdmin.email = ADMIN_ALIAS_USER.email;
        existingAdmin.gender = ADMIN_ALIAS_USER.gender;
        existingAdmin.phoneNumber = ADMIN_ALIAS_USER.phoneNumber;
        existingAdmin.country = ADMIN_ALIAS_USER.country;
        existingAdmin.role = "admin";
        existingAdmin.passwordHash = adminPasswordHash;
        existingAdmin.secretPhraseDigest = adminSecretPhraseDigest;
        await existingAdmin.save();
        console.log("✅ Admin alias user ensured");
        return existingAdmin;
    }

    const createdAdmin = await User.create({
        ...ADMIN_ALIAS_USER,
        passwordHash: adminPasswordHash,
        secretPhraseDigest: adminSecretPhraseDigest,
    });

    console.log("✅ Admin alias user created");
    return createdAdmin;
}

async function ensureDemoUser() {
    const secretPhraseDigest = digestSecretPhrase(DEMO_SECRET_PHRASE);
    const existingByPhrase = await User.findOne({ secretPhraseDigest });
    if (existingByPhrase) {
        if (existingByPhrase.role !== "user") {
            existingByPhrase.role = "user";
            await existingByPhrase.save();
            console.log("✅ Demo user role updated to user");
        }
        await ensureAdminAliasUser();
        return existingByPhrase;
    }

    const existingByIdentity = await User.findOne({
        $or: [{ username: DEMO_USER.username }, { email: DEMO_USER.email }],
    });

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    if (existingByIdentity) {
        existingByIdentity.passwordHash = passwordHash;
        existingByIdentity.secretPhraseDigest = secretPhraseDigest;
        existingByIdentity.role = "user";
        await existingByIdentity.save();
        console.log("✅ Demo user updated with secret phrase and user role");
        await ensureAdminAliasUser();
        return existingByIdentity;
    }

    const created = await User.create({
        ...DEMO_USER,
        passwordHash,
        secretPhraseDigest,
    });

    console.log("✅ Demo user created with secret phrase");
    await ensureAdminAliasUser();
    return created;
}

module.exports = {
    DEMO_PASSWORD,
    DEMO_SECRET_PHRASE,
    DEMO_USERNAME: DEMO_USER.username,
    ensureDemoUser,
};
