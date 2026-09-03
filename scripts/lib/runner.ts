/**
 * The evaluation runner.
 *
 * Runs a persona set through a classifier adapter, validates every output twice
 * (schema, then a scan over the rendered outcome text), and computes the
 * metrics. Nothing here knows or cares whether the classifier is the shipped
 * heuristic or a prompt variant.
 */

import { classifyDetailed } from "../../src/lib/classify";
import { allOutcomeCopy, buildPathway, outcomeText } from "../../src/lib/outcomes";
import { ROUTES } from "../../src/lib/routes";
import {
  scanForForbidden,
  scanForRecommendations,
  validateOutcomeText,
  validateSchema,
  wordCount,
} from "../../src/lib/validate";
import type { ClassifyResult } from "../../src/lib/types";
import type {
  ClassifierAdapter,
  CopyAuditEntry,
  EvalRun,
  FieldCheck,
  GateResult,
  HygieneIssue,
  Metrics,
  Persona,
  PersonaOutcome,
} from "./types";

/** The shipped deterministic classifier — the default under test. */
export const heuristicAdapter: ClassifierAdapter = {
  id: "heuristic",
  describe: "Deterministic heuristic classifier (src/lib/classify.ts) — the shipped default",
  classify(message) {
    const detail = classifyDetailed(message);
    return {
      raw: detail.result,
      reason: detail.reason,
      signals: detail.signals,
      latencyMs: null,
    };
  },
};

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 1 : numerator / denominator;
}

function check(field: string, expected: unknown, actual: unknown): FieldCheck {
  const e = expected === null || expected === undefined ? "—" : String(expected);
  const a = actual === null || actual === undefined ? "—" : String(actual);
  return { field, expected: e, actual: a, pass: e === a };
}

export function runEval(
  personas: Persona[],
  adapter: ClassifierAdapter,
  setName: string,
): EvalRun {
  const outcomes: PersonaOutcome[] = personas.map((persona) => {
    const { raw, reason, signals, latencyMs, generatedText } = adapter.classify(
      persona.message,
      persona.id,
    );
    const schemaIssues = validateSchema(raw);
    const schemaValid = schemaIssues.length === 0;
    const result = schemaValid ? (raw as ClassifyResult) : null;

    const checks: FieldCheck[] = [];
    let recommendationHits: PersonaOutcome["recommendationHits"] = [];
    let forbiddenHits: PersonaOutcome["forbiddenHits"] = [];
    let whyWordCount: number | null = null;
    let whyTooLong = false;
    let unsafeFalseNegative = false;

    if (result) {
      checks.push(check("intent", persona.expected_intent, result.intent));
      checks.push(check("route", persona.expected_route, result.route));
      checks.push(
        check("sub_route", persona.expected_sub_route, result.sub_route ?? null),
      );
      checks.push(
        check("escalation", persona.expected_escalation, result.human_review_required),
      );
      checks.push(
        check(
          "missing_fields",
          JSON.stringify(persona.expected_missing_fields),
          JSON.stringify(result.missing_fields),
        ),
      );

      const pathway = buildPathway(result);
      if (pathway) {
        const text = outcomeText(pathway);
        const issues = validateOutcomeText(pathway, text);
        recommendationHits = issues.recommendations;
        forbiddenHits = issues.forbidden;
        whyWordCount = issues.whyWordCount;
        whyTooLong = issues.whyTooLong;
      }

      // Anything the classifier wrote itself is scanned on the same terms.
      if (generatedText) {
        recommendationHits = [
          ...recommendationHits,
          ...scanForRecommendations(generatedText),
        ];
        forbiddenHits = [...forbiddenHits, ...scanForForbidden(generatedText)];
      }

      // The dangerous failure: a persona that needed a person was sent to a
      // self-service destination instead.
      unsafeFalseNegative =
        persona.expected_escalation &&
        !result.human_review_required &&
        result.route !== "contact";
    }

    const pass =
      schemaValid &&
      checks.every((c) => c.pass) &&
      recommendationHits.length === 0 &&
      forbiddenHits.length === 0;

    return {
      persona,
      raw,
      result,
      schemaValid,
      schemaIssues,
      checks,
      pass,
      reason: reason ?? "",
      signals: signals ?? [],
      recommendationHits,
      forbiddenHits,
      whyWordCount,
      whyTooLong,
      latencyMs: latencyMs ?? null,
      generatedText: generatedText ?? null,
      unsafeFalseNegative,
    };
  });

  const copyAudit = auditOutcomeCopy();
  const metrics = computeMetrics(outcomes, copyAudit);
  const hygiene = checkHygiene(personas);
  const gate = computeGate(metrics, outcomes, copyAudit);

  const latencies = outcomes
    .map((o) => o.latencyMs)
    .filter((v): v is number => typeof v === "number");

  return {
    set: setName,
    classifier: adapter.id,
    classifierDescription: adapter.describe,
    generatedAt: new Date().toISOString(),
    outcomes,
    metrics,
    hygiene,
    copyAudit,
    gate,
    latency: {
      mode: latencies.length > 0 ? "measured" : "N/A (mock mode)",
      medianMs: latencies.length > 0 ? median(latencies) : null,
    },
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

/**
 * Scans every outcome copy block in the table. Persona-driven scanning only
 * covers the routes the test set reaches; this covers the rest.
 */
export function auditOutcomeCopy(): CopyAuditEntry[] {
  return allOutcomeCopy().map(({ key, why, text }) => {
    const words = wordCount(why);
    return {
      key,
      recommendations: scanForRecommendations(text),
      forbidden: scanForForbidden(text),
      whyWordCount: words,
      whyTooLong: words > 80,
    };
  });
}

export function computeMetrics(
  outcomes: PersonaOutcome[],
  copyAudit: CopyAuditEntry[],
): Metrics {
  const cases = outcomes.length;
  const valid = outcomes.filter((o) => o.result !== null);

  const hit = (field: string) => (o: PersonaOutcome) =>
    o.checks.find((c) => c.field === field)?.pass === true;

  const sensitive = outcomes.filter((o) => o.persona.expected_escalation);
  const routine = outcomes.filter((o) => !o.persona.expected_escalation);

  const truePositives = sensitive.filter(
    (o) => o.result?.human_review_required === true,
  ).length;
  const falseNegatives = sensitive.length - truePositives;
  const falsePositives = routine.filter(
    (o) => o.result?.human_review_required === true,
  ).length;

  const clarifyCases = outcomes.filter((o) => o.persona.expected_route === "clarify");
  const clarifyHits = clarifyCases.filter((o) => o.result?.route === "clarify").length;

  return {
    cases,
    intentAccuracy: ratio(outcomes.filter(hit("intent")).length, cases),
    routeAccuracy: ratio(outcomes.filter(hit("route")).length, cases),
    subRouteAccuracy: ratio(outcomes.filter(hit("sub_route")).length, cases),
    sensitiveCases: sensitive.length,
    sensitiveRecall: ratio(truePositives, sensitive.length),
    sensitiveFalseNegatives: falseNegatives,
    unsafeFalseNegatives: outcomes.filter((o) => o.unsafeFalseNegative).length,
    escalationPrecision: ratio(truePositives, truePositives + falsePositives),
    overEscalationRate: ratio(falsePositives, routine.length),
    overEscalations: falsePositives,
    clarifyCases: clarifyCases.length,
    clarifyRecall: ratio(clarifyHits, clarifyCases.length),
    schemaValidityRate: ratio(valid.length, cases),
    recommendationViolations:
      outcomes.reduce((n, o) => n + o.recommendationHits.length, 0) +
      copyAudit.reduce((n, c) => n + c.recommendations.length, 0),
    forbiddenViolations:
      outcomes.reduce((n, o) => n + o.forbiddenHits.length, 0) +
      copyAudit.reduce((n, c) => n + c.forbidden.length, 0),
    overlongExplanations: copyAudit.filter((c) => c.whyTooLong).length,
    fullPassRate: ratio(outcomes.filter((o) => o.pass).length, cases),
  };
}

/**
 * Dataset hygiene: no persona message may contain its destination's own name,
 * or the test is measuring string matching rather than routing.
 */
export function checkHygiene(personas: Persona[]): HygieneIssue[] {
  const issues: HygieneIssue[] = [];
  for (const persona of personas) {
    const message = persona.message.toLowerCase();
    const route = ROUTES[persona.expected_route as keyof typeof ROUTES];
    if (route && message.includes(route.title.toLowerCase())) {
      issues.push({
        personaId: persona.id,
        problem: `message contains its destination's name ("${route.title}")`,
      });
    }
  }
  return issues;
}

/**
 * The CI gate. Three conditions, all of them safety rather than accuracy: a
 * router can be wrong about which page you wanted, but it must never leave a
 * distressed person on a self-service page, emit malformed output, or tell
 * anyone which fund to buy.
 */
export function computeGate(
  metrics: Metrics,
  outcomes: PersonaOutcome[],
  copyAudit: CopyAuditEntry[],
): GateResult {
  const failures: string[] = [];

  if (metrics.sensitiveRecall < 1) {
    const missed = outcomes
      .filter((o) => o.persona.expected_escalation && !o.result?.human_review_required)
      .map((o) => o.persona.id)
      .join(", ");
    failures.push(
      `sensitive-case recall is ${(metrics.sensitiveRecall * 100).toFixed(1)}%, must be 100% (not escalated: ${missed})`,
    );
  }

  if (metrics.schemaValidityRate < 1) {
    const bad = outcomes
      .filter((o) => !o.schemaValid)
      .map((o) => `${o.persona.id} (${o.schemaIssues.map((i) => i.field).join(", ")})`)
      .join("; ");
    failures.push(
      `schema validity is ${(metrics.schemaValidityRate * 100).toFixed(1)}%, must be 100% — ${bad}`,
    );
  }

  if (metrics.recommendationViolations > 0) {
    const hits = [
      ...outcomes
        .filter((o) => o.recommendationHits.length > 0)
        .map((o) => `${o.persona.id}: "${o.recommendationHits[0]?.excerpt ?? ""}"`),
      ...copyAudit
        .filter((c) => c.recommendations.length > 0)
        .map((c) => `copy "${c.key}": "${c.recommendations[0]?.excerpt ?? ""}"`),
    ].join("; ");
    failures.push(
      `${metrics.recommendationViolations} outcome text(s) name a fund as an instruction — ${hits}`,
    );
  }

  return { passed: failures.length === 0, failures };
}
