/**
 * Report formatting. One console renderer and one Markdown renderer over the
 * same EvalRun, so the file on disk and the terminal never disagree.
 */

import type { EvalRun, Metrics, PersonaOutcome } from "./types";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/** Metric rows shared by both renderers: label, value, and the target if any. */
function metricRows(m: Metrics): { label: string; value: string; target: string }[] {
  return [
    { label: "Intent accuracy", value: pct(m.intentAccuracy), target: "" },
    { label: "Route accuracy", value: pct(m.routeAccuracy), target: "" },
    { label: "Sub-route accuracy", value: pct(m.subRouteAccuracy), target: "" },
    {
      label: `Sensitive-case recall (${m.sensitiveCases} cases)`,
      value: pct(m.sensitiveRecall),
      target: "1.0",
    },
    {
      label: "Unsafe false negatives",
      value: String(m.unsafeFalseNegatives),
      target: "0",
    },
    { label: "Escalation precision", value: pct(m.escalationPrecision), target: "" },
    {
      label: "Over-escalation rate",
      value: `${pct(m.overEscalationRate)} (${m.overEscalations})`,
      target: "",
    },
    {
      label: `Clarify recall (${m.clarifyCases} cases)`,
      value: pct(m.clarifyRecall),
      target: "",
    },
    { label: "Schema validity", value: pct(m.schemaValidityRate), target: "100%" },
    {
      label: "Fund-recommendation violations",
      value: String(m.recommendationViolations),
      target: "0",
    },
    {
      label: "Other forbidden-copy violations",
      value: String(m.forbiddenViolations),
      target: "0",
    },
    {
      label: "Explanations over 80 words",
      value: String(m.overlongExplanations),
      target: "0",
    },
    { label: "Full pass rate", value: pct(m.fullPassRate), target: "" },
  ];
}

function failedChecks(outcome: PersonaOutcome): string {
  return outcome.checks
    .filter((c) => !c.pass)
    .map((c) => `${c.field}: expected ${c.expected}, got ${c.actual}`)
    .join("; ");
}

/* ------------------------------------------------------------------ */
/* Console                                                             */
/* ------------------------------------------------------------------ */

export function renderConsole(run: EvalRun): string {
  const lines: string[] = [];
  const rule = "─".repeat(72);

  lines.push("");
  lines.push(`Pie Pathways — evaluation (${run.set} set)`);
  lines.push(`Classifier: ${run.classifierDescription}`);
  lines.push(rule);

  for (const outcome of run.outcomes) {
    const mark = outcome.pass ? "PASS" : "FAIL";
    const r = outcome.result;
    lines.push("");
    lines.push(`${mark}  ${outcome.persona.id}  ${outcome.persona.persona}`);

    if (!r) {
      lines.push(
        `      schema invalid: ${outcome.schemaIssues
          .map((i) => `${i.field} — ${i.problem}`)
          .join("; ")}`,
      );
      continue;
    }

    lines.push(
      `      intent=${r.intent}  route=${r.route}${
        r.sub_route ? `/${r.sub_route}` : ""
      }  escalate=${r.human_review_required}  confidence=${r.confidence.toFixed(2)}`,
    );
    lines.push(
      `      missing_fields=[${r.missing_fields.join(", ")}]  fields ${
        outcome.checks.filter((c) => c.pass).length
      }/${outcome.checks.length} matched`,
    );
    if (!outcome.pass) {
      const detail = failedChecks(outcome);
      if (detail) lines.push(`      mismatch: ${detail}`);
      for (const hit of outcome.recommendationHits) {
        lines.push(`      RECOMMENDATION: "${hit.phrase}" near "${hit.fund}"`);
      }
      for (const hit of outcome.forbiddenHits) {
        lines.push(`      FORBIDDEN COPY: ${hit.rule} — "${hit.excerpt}"`);
      }
    }
    lines.push(`      why: ${outcome.reason}`);
  }

  lines.push("");
  lines.push(rule);
  lines.push("Metrics");
  for (const row of metricRows(run.metrics)) {
    const target = row.target ? `   (target ${row.target})` : "";
    lines.push(`  ${row.label.padEnd(40)} ${row.value.padStart(8)}${target}`);
  }
  lines.push(`  ${"Latency".padEnd(40)} ${run.latency.mode.padStart(8)}`);
  lines.push(
    `  ${"Outcome copy blocks scanned".padEnd(40)} ${String(run.copyAudit.length).padStart(8)}`,
  );

  const dirtyCopy = run.copyAudit.filter(
    (c) => c.recommendations.length > 0 || c.forbidden.length > 0 || c.whyTooLong,
  );
  if (dirtyCopy.length > 0) {
    lines.push("");
    lines.push("Outcome copy violations (scanned independently of the personas)");
    for (const entry of dirtyCopy) {
      for (const hit of entry.recommendations) {
        lines.push(`  ${entry.key}: RECOMMENDATION "${hit.phrase}" near "${hit.fund}"`);
      }
      for (const hit of entry.forbidden) {
        lines.push(`  ${entry.key}: ${hit.rule} — "${hit.excerpt}"`);
      }
      if (entry.whyTooLong) {
        lines.push(`  ${entry.key}: explanation is ${entry.whyWordCount} words (limit 80)`);
      }
    }
  }

  if (run.hygiene.length > 0) {
    lines.push("");
    lines.push("Dataset hygiene warnings");
    for (const issue of run.hygiene) {
      lines.push(`  ${issue.personaId}: ${issue.problem}`);
    }
  }

  lines.push("");
  if (run.gate.passed) {
    lines.push("CI gate: PASS — no sensitive case missed, schema clean, no fund recommended.");
  } else {
    lines.push("CI gate: FAIL");
    for (const failure of run.gate.failures) {
      lines.push(`  - ${failure}`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Markdown                                                            */
/* ------------------------------------------------------------------ */

export function renderMarkdown(run: EvalRun): string {
  const m = run.metrics;
  const lines: string[] = [];

  lines.push(`# Evaluation report — ${run.set} set`);
  lines.push("");
  lines.push(`- **Classifier:** ${run.classifierDescription}`);
  lines.push(`- **Cases:** ${m.cases}`);
  lines.push(`- **Generated:** ${run.generatedAt}`);
  lines.push(
    `- **CI gate:** ${run.gate.passed ? "PASS" : "FAIL"}${
      run.gate.passed ? "" : ` — ${run.gate.failures.join("; ")}`
    }`,
  );
  lines.push("");

  lines.push("## Metrics");
  lines.push("");
  lines.push("| Metric | Value | Target |");
  lines.push("| --- | --- | --- |");
  for (const row of metricRows(m)) {
    lines.push(`| ${row.label} | ${row.value} | ${row.target || "—"} |`);
  }
  lines.push(`| Latency | ${run.latency.mode} | — |`);
  lines.push("");

  lines.push("### How these are defined");
  lines.push("");
  lines.push(
    "- **Sensitive-case recall** — of the personas whose expected outcome is a human hand-off, the share that were escalated. `TP / (TP + FN)`.",
  );
  lines.push(
    "- **Unsafe false negative** — a persona needing a person that was neither escalated nor routed to `contact`, so it landed on a self-service page. This is the failure that matters most.",
  );
  lines.push(
    "- **Escalation precision** — of everything escalated, the share that should have been. Its inverse, the over-escalation rate, is what makes a router annoying rather than unsafe.",
  );
  lines.push(
    "- **Clarify recall** — of the ambiguous personas, the share that correctly asked a question instead of guessing a destination.",
  );
  lines.push(
    "- **Schema validity** — the share of outputs that are exactly the shared outcome shape, with every enum in range.",
  );
  lines.push("");

  lines.push("## Per-persona results");
  lines.push("");
  lines.push("| # | Persona | Intent | Route | Sub-route | Escalate | Conf. | Result |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const o of run.outcomes) {
    const r = o.result;
    const cell = (field: string, actual: string) => {
      const c = o.checks.find((x) => x.field === field);
      if (!c) return actual;
      return c.pass ? actual : `**${actual}** (want ${c.expected})`;
    };
    lines.push(
      `| ${o.persona.id} | ${o.persona.persona} | ${
        r ? cell("intent", r.intent) : "—"
      } | ${r ? cell("route", r.route) : "—"} | ${
        r ? cell("sub_route", r.sub_route ?? "—") : "—"
      } | ${r ? cell("escalation", String(r.human_review_required)) : "—"} | ${
        r ? r.confidence.toFixed(2) : "—"
      } | ${o.pass ? "pass" : "FAIL"} |`,
    );
  }
  lines.push("");

  const failures = run.outcomes.filter((o) => !o.pass);
  if (failures.length > 0) {
    lines.push("## Failures");
    lines.push("");
    for (const o of failures) {
      lines.push(`### ${o.persona.id} — ${o.persona.persona}`);
      lines.push("");
      lines.push(`> ${o.persona.message}`);
      lines.push("");
      if (!o.schemaValid) {
        lines.push(
          `- Schema invalid: ${o.schemaIssues
            .map((i) => `\`${i.field}\` — ${i.problem}`)
            .join("; ")}`,
        );
      }
      const detail = failedChecks(o);
      if (detail) lines.push(`- Mismatch: ${detail}`);
      for (const hit of o.recommendationHits) {
        lines.push(
          `- **Fund recommendation detected:** "${hit.phrase}" near "${hit.fund}" — \`${hit.excerpt}\``,
        );
      }
      for (const hit of o.forbiddenHits) {
        lines.push(`- **Forbidden copy:** ${hit.rule} — \`${hit.excerpt}\``);
      }
      lines.push(`- Expected because: ${o.persona.rationale}`);
      lines.push("");
    }
  }

  lines.push("## Reasoning trace");
  lines.push("");
  lines.push("| # | Signals | Reason given |");
  lines.push("| --- | --- | --- |");
  for (const o of run.outcomes) {
    lines.push(`| ${o.persona.id} | ${o.signals.join(", ") || "—"} | ${o.reason} |`);
  }
  lines.push("");

  lines.push("## Outcome copy audit");
  lines.push("");
  lines.push(
    `Every one of the ${run.copyAudit.length} outcome copy blocks is scanned, not just the ones the personas reach. Persona-driven scanning alone would leave a recommendation planted on an unvisited route undetected.`,
  );
  lines.push("");
  const dirty = run.copyAudit.filter(
    (c) => c.recommendations.length > 0 || c.forbidden.length > 0 || c.whyTooLong,
  );
  if (dirty.length === 0) {
    lines.push(
      "No block names a fund as an instruction, states eligibility, quotes a return, asks for an identifier, or runs over 80 words.",
    );
  } else {
    lines.push("| Copy block | Violation |");
    lines.push("| --- | --- |");
    for (const entry of dirty) {
      for (const hit of entry.recommendations) {
        lines.push(`| \`${entry.key}\` | Fund recommendation: "${hit.phrase}" near "${hit.fund}" |`);
      }
      for (const hit of entry.forbidden) {
        lines.push(`| \`${entry.key}\` | ${hit.rule}: \`${hit.excerpt}\` |`);
      }
      if (entry.whyTooLong) {
        lines.push(`| \`${entry.key}\` | Explanation is ${entry.whyWordCount} words (limit 80) |`);
      }
    }
  }
  lines.push("");

  lines.push("## Dataset hygiene");
  lines.push("");
  if (run.hygiene.length === 0) {
    lines.push(
      "No persona message contains its own destination's name, so route accuracy is not measuring string matching.",
    );
  } else {
    for (const issue of run.hygiene) {
      lines.push(`- ${issue.personaId}: ${issue.problem}`);
    }
  }
  lines.push("");

  return lines.join("\n");
}
