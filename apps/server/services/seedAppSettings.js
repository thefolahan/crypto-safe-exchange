const AppSettings = require("../models/AppSettings");

async function ensureAppSettings() {
    const settings = await AppSettings.getSingleton();
    return settings;
}

module.exports = {
    ensureAppSettings,
};
