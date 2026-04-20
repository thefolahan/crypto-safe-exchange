const crypto = require("crypto");

const WORD_BANK = [
    "abandon",
    "ability",
    "anchor",
    "aspect",
    "autumn",
    "bamboo",
    "breeze",
    "canvas",
    "canyon",
    "cinder",
    "cobalt",
    "cosmic",
    "crystal",
    "desert",
    "drift",
    "ember",
    "fossil",
    "galaxy",
    "garden",
    "glimmer",
    "gravity",
    "harbor",
    "horizon",
    "island",
    "ivory",
    "jungle",
    "kernel",
    "lunar",
    "matrix",
    "meadow",
    "meteor",
    "monarch",
    "nectar",
    "oasis",
    "ocean",
    "pioneer",
    "plasma",
    "quartz",
    "radar",
    "raven",
    "ripple",
    "signal",
    "shiver",
    "summit",
    "timber",
    "velvet",
    "vibrant",
    "voyage",
    "window",
    "zenith",
];

const DEMO_SECRET_PHRASE_WORDS = [
    "abandon",
    "vibrant",
    "crystal",
    "ocean",
    "timber",
    "gravity",
    "fossil",
    "matrix",
    "pioneer",
    "shiver",
    "window",
    "aspect",
];

function normalizeSecretPhrase(value) {
    const words = String(value || "")
        .trim()
        .toLowerCase()
        .match(/[a-z]+/g);

    return (words || []).join(" ");
}

function digestSecretPhrase(phrase) {
    return crypto.createHash("sha256").update(normalizeSecretPhrase(phrase)).digest("hex");
}

function randomIndex(maxExclusive) {
    return crypto.randomInt(0, maxExclusive);
}

function generateSecretPhrase(wordCount = 12) {
    const pool = [...WORD_BANK];
    const words = [];

    while (words.length < wordCount && pool.length > 0) {
        const idx = randomIndex(pool.length);
        words.push(pool.splice(idx, 1)[0]);
    }

    return words.join(" ");
}

module.exports = {
    DEMO_SECRET_PHRASE: DEMO_SECRET_PHRASE_WORDS.join(" "),
    digestSecretPhrase,
    generateSecretPhrase,
    normalizeSecretPhrase,
};
