import type { ClassifyResult } from "../../src/lib/types";

export interface Persona {
  id: string;
  persona: string;
  message: string;
  expected_intent: string;
  expected_route: string;
  expected_sub_route: string | null;
  expected_escalation: boolean;
  expected_missing_fields: string[];
  risk_tags: string[];
  edge_case: boolean;
  rationale: string;
}

/**
 * A classifier under test. `classify` returns `unknown` on purpose: a model-backed
 * implementation can return malformed output, and the harness must be able to
 * catch that rather than assume the shape is right.
 */
export interface ClassifierAdapter {
  readonly id: string;
  readonly describe: string;
  classify(message: string, personaId: string): {
    raw: unknown;
    reason?: string;
    signals?: string[];
    latencyMs?: number | null;
  };
}

export interface FieldCheck {
  readonly field: string;
  readonly expected: string;
  readonly actual: string;
  readonly pass: boolean;
}

export interface PersonaOutcome {
  readonly persona: Persona;
  readonly raw: unknown;
  readonly result: ClassifyResult | null;
  readonly schemaValid: boolean;
  readonly schemaIssues: { field: string; problem: string }[];
  readonly checks: FieldCheck[];
  readonly pass: boolean;
  readonly reason: string;
  readonly signals: string[];
  readonly recommendationHits: { phrase: string; fund: string; excerpt: string }[];
  readonly forbiddenHits: { rule: string; excerpt: string }[];
  readonly whyWordCount: number | null;
  readonly whyTooLong: boolean;
  readonly latencyMs: number | null;
  /** Escalation-expected persona that reached neither a person nor contact. */
  readonly unsafeFalseNegative: boolean;
}

export interface Metrics {
  readonly cases: number;
  readonly intentAccuracy: number;
  readonly routeAccuracy: number;
  readonly subRouteAccuracy: number;
  readonly sensitiveCases: number;
  readonly sensitiveRecall: number;
  readonly sensitiveFalseNegatives: number;
  readonly unsafeFalseNegatives: number;
  readonly escalationPrecision: number;
  readonly overEscalationRate: number;
  readonly overEscalations: number;
  readonly clarifyCases: number;
  readonly clarifyRecall: number;
  readonly schemaValidityRate: number;
  readonly recommendationViolations: number;
  readonly forbiddenViolations: number;
  readonly overlongExplanations: number;
  readonly fullPassRate: number;
}

export interface CopyAuditEntry {
  readonly key: string;
  readonly recommendations: { phrase: string; fund: string; excerpt: string }[];
  readonly forbidden: { rule: string; excerpt: string }[];
  readonly whyWordCount: number;
  readonly whyTooLong: boolean;
}

export interface EvalRun {
  readonly set: string;
  readonly classifier: string;
  readonly classifierDescription: string;
  readonly generatedAt: string;
  readonly outcomes: PersonaOutcome[];
  readonly metrics: Metrics;
  readonly hygiene: HygieneIssue[];
  /** Scan over every outcome copy block, independent of the persona set. */
  readonly copyAudit: CopyAuditEntry[];
  readonly gate: GateResult;
  readonly latency: { mode: string; medianMs: number | null };
}

export interface HygieneIssue {
  readonly personaId: string;
  readonly problem: string;
}

export interface GateResult {
  readonly passed: boolean;
  readonly failures: string[];
}
