#!/usr/bin/env tsx
/**
 * npm run eval:compare -- --base=v1 --candidate=v2
 *
 * Runs two classifiers over the same persona set and reports what actually
 * changed: per-persona improvements and regressions, and the net metric deltas.
 * "heuristic" is accepted for either side, so a prompt variant can be compared
 * against the shipped fallback rather than only against another prompt.
 *
 * Mock mode only. These numbers validate the harness, not prompt quality.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import devPersonas from "../data/personas.dev.json";
import holdoutPersonas from "../data/personas.holdout.json";
import { promptAdapter } from "./lib/prompt-adapter";
import { heuristicAdapter, runEval } from "./lib/runner";
import type { ClassifierAdapter, EvalRun, Metrics, Persona } from "./lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string): string | undefined {
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")[1];
}

const baseName = arg("base");
const candidateName = arg("candidate");
const setName = arg("set") ?? "dev";

if (!baseName || !candidateName) {
  console.error(
    "Usage: npm run eval:compare -- --base=v1 --candidate=v2 [--set=dev|holdout]",
  );
  process.exit(2);
}

function adapterFor(name: string): ClassifierAdapter {
  return name === "heuristic" ? heuristicAdapter : promptAdapter(name);
}

const personas: Persona[] =
  setName === "holdout" ? (holdoutPersonas as Persona[]) : (devPersonas as Persona[]);

const base = runEval(personas, adapterFor(baseName), setName);
const candidate = runEval(personas, adapterFor(candidateName), setName);

/* ------------------------------------------------------------------ */

type Change = "improved" | "regressed" | "unchanged";

interface PersonaDelta {
  id: string;
  persona: string;
  change: Change;
  basePass: boolean;
  candidatePass: boolean;
  detail: string;
}

function describe(run: EvalRun, id: string): string {
  const o = run.outcomes.find((x) => x.persona.id === id);
  if (!o) return "—";
  if (!o.result) return "schema invalid";
  const parts = [
    `${o.result.route}${o.result.sub_route ? `/${o.result.sub_route}` : ""}`,
    `escalate=${o.result.human_review_required}`,
  ];
  if (o.recommendationHits.length > 0) parts.push("RECOMMENDS A FUND");
  return parts.join(", ");
}

const deltas: PersonaDelta[] = personas.map((persona) => {
  const b = base.outcomes.find((o) => o.persona.id === persona.id);
  const c = candidate.outcomes.find((o) => o.persona.id === persona.id);
  const basePass = b?.pass ?? false;
  const candidatePass = c?.pass ?? false;
  const change: Change =
    basePass === candidatePass ? "unchanged" : candidatePass ? "improved" : "regressed";

  const baseDesc = describe(base, persona.id);
  const candDesc = describe(candidate, persona.id);
  const detail =
    baseDesc === candDesc ? baseDesc : `${baseDesc}  →  ${candDesc}`;

  return { id: persona.id, persona: persona.persona, change, basePass, candidatePass, detail };
});

const improved = deltas.filter((d) => d.change === "improved");
const regressed = deltas.filter((d) => d.change === "regressed");

/* ------------------------------------------------------------------ */

const METRIC_ROWS: { key: keyof Metrics; label: string; percent: boolean; higherIsBetter: boolean }[] = [
  { key: "intentAccuracy", label: "Intent accuracy", percent: true, higherIsBetter: true },
  { key: "routeAccuracy", label: "Route accuracy", percent: true, higherIsBetter: true },
  { key: "sensitiveRecall", label: "Sensitive-case recall", percent: true, higherIsBetter: true },
  { key: "unsafeFalseNegatives", label: "Unsafe false negatives", percent: false, higherIsBetter: false },
  { key: "escalationPrecision", label: "Escalation precision", percent: true, higherIsBetter: true },
  { key: "overEscalationRate", label: "Over-escalation rate", percent: true, higherIsBetter: false },
  { key: "clarifyRecall", label: "Clarify recall", percent: true, higherIsBetter: true },
  { key: "schemaValidityRate", label: "Schema validity", percent: true, higherIsBetter: true },
  { key: "recommendationViolations", label: "Fund-recommendation violations", percent: false, higherIsBetter: false },
  { key: "fullPassRate", label: "Full pass rate", percent: true, higherIsBetter: true },
];

function fmt(value: number, percent: boolean): string {
  return percent ? `${(value * 100).toFixed(1)}%` : String(value);
}

function delta(b: number, c: number, percent: boolean, higherIsBetter: boolean): string {
  const diff = c - b;
  if (diff === 0) return "—";
  const shown = percent ? `${(diff * 100).toFixed(1)}pp` : String(diff);
  const better = higherIsBetter ? diff > 0 : diff < 0;
  return `${diff > 0 ? "+" : ""}${shown} ${better ? "better" : "WORSE"}`;
}

/* ------------------------------------------------------------------ */

const lines: string[] = [];
const rule = "─".repeat(76);

lines.push("");
lines.push(`Comparing ${baseName} → ${candidateName} on the ${setName} set`);
lines.push(`  base:      ${base.classifierDescription}`);
lines.push(`  candidate: ${candidate.classifierDescription}`);
lines.push(rule);
lines.push("");
lines.push(`Improved: ${improved.length}   Regressed: ${regressed.length}   Unchanged: ${deltas.length - improved.length - regressed.length}`);

for (const group of [
  { title: "Improved", items: improved },
  { title: "Regressed", items: regressed },
]) {
  if (group.items.length === 0) continue;
  lines.push("");
  lines.push(`${group.title}:`);
  for (const d of group.items) {
    lines.push(`  ${d.id}  ${d.persona}`);
    lines.push(`      ${d.detail}`);
  }
}

lines.push("");
lines.push(rule);
lines.push("Net metric deltas");
lines.push(`  ${"Metric".padEnd(32)}${baseName.padStart(10)}${candidateName.padStart(10)}   change`);
for (const row of METRIC_ROWS) {
  const b = base.metrics[row.key] as number;
  const c = candidate.metrics[row.key] as number;
  lines.push(
    `  ${row.label.padEnd(32)}${fmt(b, row.percent).padStart(10)}${fmt(c, row.percent).padStart(10)}   ${delta(b, c, row.percent, row.higherIsBetter)}`,
  );
}

lines.push("");
lines.push(`CI gate — ${baseName}: ${base.gate.passed ? "PASS" : "FAIL"}`);
for (const f of base.gate.failures) lines.push(`    - ${f}`);
lines.push(`CI gate — ${candidateName}: ${candidate.gate.passed ? "PASS" : "FAIL"}`);
for (const f of candidate.gate.failures) lines.push(`    - ${f}`);
lines.push("");
lines.push(`Latency: ${candidate.latency.mode}. Mock-mode results validate harness`);
lines.push("plumbing only — any claim about prompt quality needs one live run.");
lines.push("");

const output = lines.join("\n");
console.log(output);

/* Markdown record of the comparison. */
const md: string[] = [];
md.push(`# Prompt comparison — ${baseName} vs ${candidateName} (${setName} set)`);
md.push("");
md.push(`- **Base:** ${base.classifierDescription}`);
md.push(`- **Candidate:** ${candidate.classifierDescription}`);
md.push(`- **Improved:** ${improved.length} · **Regressed:** ${regressed.length} · **Unchanged:** ${deltas.length - improved.length - regressed.length}`);
md.push("");
md.push("> Mock-mode results validate harness plumbing. They say nothing about how a real model would perform on these prompts; that needs one live run.");
md.push("");
md.push("## Net metric deltas");
md.push("");
md.push(`| Metric | ${baseName} | ${candidateName} | Change |`);
md.push("| --- | --- | --- | --- |");
for (const row of METRIC_ROWS) {
  const b = base.metrics[row.key] as number;
  const c = candidate.metrics[row.key] as number;
  md.push(`| ${row.label} | ${fmt(b, row.percent)} | ${fmt(c, row.percent)} | ${delta(b, c, row.percent, row.higherIsBetter)} |`);
}
md.push("");
md.push("## Per-persona changes");
md.push("");
md.push(`| # | Persona | ${baseName} | ${candidateName} | Change | Detail |`);
md.push("| --- | --- | --- | --- | --- | --- |");
for (const d of deltas) {
  md.push(
    `| ${d.id} | ${d.persona} | ${d.basePass ? "pass" : "FAIL"} | ${d.candidatePass ? "pass" : "FAIL"} | ${d.change} | ${d.detail} |`,
  );
}
md.push("");
md.push("## CI gate");
md.push("");
md.push(`- **${baseName}:** ${base.gate.passed ? "PASS" : `FAIL — ${base.gate.failures.join("; ")}`}`);
md.push(`- **${candidateName}:** ${candidate.gate.passed ? "PASS" : `FAIL — ${candidate.gate.failures.join("; ")}`}`);
md.push("");

const outDir = resolve(root, "eval-results");
mkdirSync(outDir, { recursive: true });
const name = `compare-${baseName}-vs-${candidateName}.md`;
writeFileSync(resolve(outDir, name), md.join("\n"), "utf8");
console.log(`Saved eval-results/${name}`);
