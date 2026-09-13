import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [inputFile, outputFile = "asset-pool/data/asset-pool-data.js"] = process.argv.slice(2);

if (!inputFile) {
  console.error("Usage: node asset-pool/scripts/build-bundled-data.mjs <backup.json> [output.js]");
  process.exit(1);
}

const inputPath = resolve(inputFile);
const outputPath = resolve(outputFile);
const backup = JSON.parse(readFileSync(inputPath, "utf8"));
const store = backup.store || backup.data || backup;

if (!store || typeof store !== "object" || Array.isArray(store)) {
  throw new Error("The input is not an Asset Pool backup object.");
}

const bundle = {
  version: backup.version || 2,
  exportedAt: backup.exportedAt || new Date().toISOString(),
  store,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `// Generated from ${inputPath.replace(/\\/g, "/")}. Do not edit by hand.\n`
    + `// Run build-bundled-data.mjs again after exporting a newer backup.\n`
    + `globalThis.AssetPoolBundledData = ${JSON.stringify(bundle, null, 2)};\n`,
  "utf8",
);

console.log(`Wrote ${outputPath}`);
