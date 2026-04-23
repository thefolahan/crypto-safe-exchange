const User = require("../models/User");
const PendingUser = require("../models/PendingUser");

async function removeProfilePictureField() {
    const unset = { $unset: { profilePictureUrl: 1 } };
    const [usersResult, pendingUsersResult] = await Promise.all([
        User.collection.updateMany({}, unset),
        PendingUser.collection.updateMany({}, unset),
    ]);

    return {
        usersModified: Number(usersResult?.modifiedCount || 0),
        pendingUsersModified: Number(pendingUsersResult?.modifiedCount || 0),
    };
}

module.exports = {
    removeProfilePictureField,
};
