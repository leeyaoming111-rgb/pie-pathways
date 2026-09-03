#!/usr/bin/env node
/**
 * Inlines an optional live scrape into src/lib/knowledge.generated.ts.
 *
 * `data/routes.json` is produced by `npm run build:routes` and is gitignored.
 * When it is absent — the normal case — this writes `null` and the app falls
 * back to the committed fixture. The app must run identically either way.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const livePath = resolve(root, "data/routes.json");
const outPath = resolve(root, "src/lib/knowledge.generated.ts");

const header = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Written by \`scripts/sync-knowledge.mjs\` (npm run sync, and automatically
 * before \`dev\` and \`build\`). It carries the contents of \`data/routes.json\` when
 * a live scrape exists, and \`null\` otherwise. Committed so a fresh clone
 * type-checks before any script has run.
 */

`;

let payload = "null";
let note = "no data/routes.json — the app will use data/routes.fixture.json";

if (existsSync(livePath)) {
  try {
    const parsed = JSON.parse(readFileSync(livePath, "utf8"));
    payload = JSON.stringify(parsed, null, 2);
    note = "inlined data/routes.json — the app will validate it before using it";
  } catch (error) {
    note = `data/routes.json is not valid JSON (${error.message}); falling back to the fixture`;
  }
}

const next = `${header}export const LIVE_KNOWLEDGE: unknown = ${payload};\n`;
const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";

if (current !== next) {
  writeFileSync(outPath, next, "utf8");
}

console.log(`sync-knowledge: ${note}`);
