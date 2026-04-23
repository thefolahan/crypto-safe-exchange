const mongoose = require("mongoose");
const { ensureDemoUser } = require("../services/seedDemoUser");
const { removeProfilePictureField } = require("../services/removeProfilePictureField");

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");
        await ensureDemoUser();
        const removed = await removeProfilePictureField();
        if (removed.usersModified || removed.pendingUsersModified) {
            console.log(
                `✅ Removed profile pictures from DB (users: ${removed.usersModified}, pending users: ${removed.pendingUsersModified})`
            );
        }
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    }
}

module.exports = connectDB;
