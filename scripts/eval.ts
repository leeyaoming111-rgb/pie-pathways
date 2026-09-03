#!/usr/bin/env tsx
/**
 * npm run eval                      — dev set through the shipped classifier
 * npm run eval -- --set=holdout     — holdout set, run once as final evidence
 * npm run eval -- --prompt=v2       — a versioned prompt variant (Stage 4b)
 * npm run eval:ci                   — same, but exits non-zero if the gate fails
 *
 * Everything runs offline. There are no network calls on any path unless
 * USE_LLM_EVAL=true is set explicitly, and no demo path depends on that.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import devPersonas from "../data/personas.dev.json";
import holdoutPersonas from "../data/personas.holdout.json";
import { promptAdapter } from "./lib/prompt-adapter";
import { renderConsole, renderMarkdown } from "./lib/report";
import { heuristicAdapter, runEval } from "./lib/runner";
import type { Persona } from "./lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string): string | undefined {
  const match = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return match?.split("=")[1];
}

const setName = arg("set") ?? "dev";
const promptVersion = arg("prompt");
const ci = process.argv.includes("--ci");

const personas: Persona[] =
  setName === "holdout" ? (holdoutPersonas as Persona[]) : (devPersonas as Persona[]);

if (setName !== "dev" && setName !== "holdout") {
  console.error(`Unknown persona set "${setName}". Use --set=dev or --set=holdout.`);
  process.exit(2);
}

const adapter = promptVersion ? promptAdapter(promptVersion) : heuristicAdapter;

const run = runEval(personas, adapter, setName);

console.log(renderConsole(run));

if (setName === "holdout") {
  console.log(
    "Holdout discipline: this set is final evidence. If a failure here sends you\n" +
      "back to tune the classifier, the set is spent — replace it before quoting it again.\n",
  );
}

/* Write both machine-readable and human-readable evidence. */
const outDir = resolve(root, "eval-results");
mkdirSync(outDir, { recursive: true });

const slug = promptVersion ? `${setName}-${promptVersion}` : setName;
const jsonName = setName === "dev" && !promptVersion ? "latest.json" : `${slug}.json`;
const mdName = setName === "dev" && !promptVersion ? "report.md" : `${slug}.md`;

writeFileSync(resolve(outDir, jsonName), `${JSON.stringify(run, null, 2)}\n`, "utf8");
writeFileSync(resolve(outDir, mdName), renderMarkdown(run), "utf8");

console.log(`Saved eval-results/${jsonName} and eval-results/${mdName}`);

if (ci && !run.gate.passed) {
  console.error("\nCI gate failed.");
  process.exit(1);
}
