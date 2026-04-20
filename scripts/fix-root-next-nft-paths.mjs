import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const nextDir = path.join(repoRoot, ".next");

function collectNftFiles(dir) {
    const out = [];
    const stack = [dir];

    while (stack.length) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });

        for (const entry of entries) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(full);
                continue;
            }

            if (entry.isFile() && entry.name.endsWith(".nft.json")) {
                out.push(full);
            }
        }
    }

    return out;
}

function shiftTwoLevelsUp(relativePath) {
    let out = relativePath;
    for (let i = 0; i < 2; i += 1) {
        if (out.startsWith("../")) {
            out = out.slice(3);
        }
    }
    return out;
}

if (!fs.existsSync(nextDir)) {
    console.error("Missing .next directory at repository root.");
    process.exit(1);
}

const nftFiles = collectNftFiles(nextDir);
let patchedFiles = 0;
let patchedEntries = 0;

for (const file of nftFiles) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(json.files)) continue;

    let changed = false;
    const nextFiles = json.files.map((item) => {
        if (typeof item !== "string") return item;
        const shifted = shiftTwoLevelsUp(item);
        if (shifted !== item) {
            changed = true;
            patchedEntries += 1;
        }
        return shifted;
    });

    if (changed) {
        json.files = nextFiles;
        fs.writeFileSync(file, JSON.stringify(json));
        patchedFiles += 1;
    }
}

console.log(`Patched ${patchedEntries} trace paths across ${patchedFiles} .nft files.`);
