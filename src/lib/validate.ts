/**
 * Output validation.
 *
 * Two independent checks, both deterministic:
 *
 * 1. Schema validation — the result is exactly the shared outcome shape, with
 *    every field the right type and every enum value in range.
 * 2. A no-recommendation scan over the generated outcome text — directive
 *    language naming a specific fund. This is the check that would catch a
 *    model, or a careless copy edit, turning a router into an adviser.
 *
 * The scan runs over rendered copy rather than over the classifier's fields,
 * because that is what a visitor actually reads.
 */

import { INTENTS, type Intent } from "./intents";
import { CLARIFY, ROUTE_IDS, SUB_ROUTES } from "./routes";
import type { ClassifyResult, PathwayDefinition } from "./types";

export interface SchemaIssue {
  readonly field: string;
  readonly problem: string;
}

const ALLOWED_KEYS = new Set([
  "intent",
  "route",
  "sub_route",
  "confidence",
  "human_review_required",
  "personal_advice_generated",
  "missing_fields",
]);

export function validateSchema(value: unknown): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  if (typeof value !== "object" || value === null) {
    return [{ field: "(root)", problem: "not an object" }];
  }
  const r = value as Record<string, unknown>;

  for (const key of Object.keys(r)) {
    if (!ALLOWED_KEYS.has(key)) {
      issues.push({ field: key, problem: "unexpected field" });
    }
  }

  if (typeof r.intent !== "string" || !(INTENTS as readonly string[]).includes(r.intent)) {
    issues.push({ field: "intent", problem: `not a known intent: ${String(r.intent)}` });
  }

  const routeOk =
    typeof r.route === "string" &&
    (r.route === CLARIFY || (ROUTE_IDS as readonly string[]).includes(r.route));
  if (!routeOk) {
    issues.push({ field: "route", problem: `not a known route: ${String(r.route)}` });
  }

  if (r.sub_route !== undefined) {
    if (
      typeof r.sub_route !== "string" ||
      !(SUB_ROUTES as readonly string[]).includes(r.sub_route)
    ) {
      issues.push({
        field: "sub_route",
        problem: `not a known sub_route: ${String(r.sub_route)}`,
      });
    } else if (r.route === CLARIFY) {
      issues.push({ field: "sub_route", problem: "clarify cannot carry a sub_route" });
    }
  }

  if (
    typeof r.confidence !== "number" ||
    Number.isNaN(r.confidence) ||
    r.confidence < 0 ||
    r.confidence > 1
  ) {
    issues.push({ field: "confidence", problem: "must be a number between 0 and 1" });
  }

  if (typeof r.human_review_required !== "boolean") {
    issues.push({ field: "human_review_required", problem: "must be a boolean" });
  }

  if (typeof r.personal_advice_generated !== "boolean") {
    issues.push({ field: "personal_advice_generated", problem: "must be a boolean" });
  } else if (r.personal_advice_generated) {
    // The router has no path that may set this. If it is ever true, something
    // has gone wrong upstream and the run should fail loudly.
    issues.push({
      field: "personal_advice_generated",
      problem: "must never be true — this router does not give personal advice",
    });
  }

  if (
    !Array.isArray(r.missing_fields) ||
    r.missing_fields.some((f) => typeof f !== "string")
  ) {
    issues.push({ field: "missing_fields", problem: "must be an array of strings" });
  }

  return issues;
}

/* ------------------------------------------------------------------ */
/* No-recommendation scan                                              */
/* ------------------------------------------------------------------ */

/**
 * Fund names that must never appear as the object of an instruction. Drawn from
 * the product architecture in pie-funds-brand.md §6. "Conservative", "Growth"
 * and "Balanced" are ordinary English words, so the scan requires directive
 * language pointing at them rather than the bare word.
 */
const FUND_NAMES = [
  "conservative",
  "balanced",
  "growth 2",
  "growth uk & europe",
  "global growth 2",
  "global growth",
  "dividend growth",
  "emerging companies",
  "chairman's",
  "chairmans",
  "fixed income",
  "property & infrastructure",
  "aggressive",
  "growth",
];

/** Verbs that turn a mention into an instruction. */
const DIRECTIVE = [
  "you should (be )?(in|invest in|choose|pick|switch to|move to|go with)",
  "we recommend",
  "our recommendation is",
  "the best (fund|option) (for you )?is",
  "you'?d be best (in|with)",
  "i suggest",
  "we suggest",
  "put your money (in|into)",
  "go with the",
  "choose the",
  "pick the",
  "the right fund for you is",
];

export interface RecommendationHit {
  readonly phrase: string;
  readonly fund: string;
  readonly excerpt: string;
}

/**
 * Flags directive language within a short window of a fund name. Deliberately
 * conservative about what counts: it looks for an instruction and a fund name
 * close together, which is what a recommendation actually looks like.
 */
export function scanForRecommendations(text: string): RecommendationHit[] {
  const hits: RecommendationHit[] = [];
  const haystack = text.toLowerCase().replace(/\s+/g, " ");

  for (const directive of DIRECTIVE) {
    const pattern = new RegExp(directive, "g");
    for (const match of haystack.matchAll(pattern)) {
      const start = match.index ?? 0;
      // A recommendation names its fund close to the verb.
      const window = haystack.slice(start, start + 90);
      const fund = FUND_NAMES.find((name) => window.includes(name));
      if (fund) {
        hits.push({
          phrase: match[0],
          fund,
          excerpt: haystack.slice(Math.max(0, start - 20), start + 90).trim(),
        });
      }
    }
  }

  return hits;
}

/** Text that must never appear in visitor-facing copy, whatever the route. */
export interface ForbiddenHit {
  readonly rule: string;
  readonly excerpt: string;
}

const FORBIDDEN: { rule: string; pattern: RegExp }[] = [
  {
    // The NZ$25,000 Investment Funds minimum is unverified (brand extract §6).
    rule: "unverified NZ$25,000 minimum stated in copy",
    pattern: /\$\s?25,?000|25k minimum|minimum of \$?25/i,
  },
  {
    rule: "states eligibility or approval",
    pattern:
      /you (are|'re) (eligible|approved|not eligible)|you qualify|you don'?t qualify|you cannot get advice|you can'?t get advice/i,
  },
  {
    rule: "quotes a return or performance figure",
    pattern: /\b\d+(\.\d+)?\s?% (return|p\.?a\.?|per annum|growth)/i,
  },
  {
    rule: "asks for an account identifier or credential",
    pattern:
      /(enter|provide|give us|type) (your )?(pm ?number|account number|password|ird number)/i,
  },
];

export function scanForForbidden(text: string): ForbiddenHit[] {
  const hits: ForbiddenHit[] = [];
  for (const { rule, pattern } of FORBIDDEN) {
    const match = pattern.exec(text);
    if (match) {
      const start = Math.max(0, (match.index ?? 0) - 30);
      hits.push({ rule, excerpt: text.slice(start, start + 110).replace(/\s+/g, " ").trim() });
    }
  }
  return hits;
}

/** Route explanations must stay under 80 words and in plain English. */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface OutcomeTextIssues {
  readonly recommendations: RecommendationHit[];
  readonly forbidden: ForbiddenHit[];
  readonly whyWordCount: number;
  readonly whyTooLong: boolean;
}

export function validateOutcomeText(
  pathway: PathwayDefinition,
  text: string,
): OutcomeTextIssues {
  const whyWordCount = wordCount(pathway.why);
  return {
    recommendations: scanForRecommendations(text),
    forbidden: scanForForbidden(text),
    whyWordCount,
    whyTooLong: whyWordCount > 80,
  };
}

/** Convenience for callers that only hold a result. */
export function isSchemaValid(result: ClassifyResult): boolean {
  return validateSchema(result).length === 0;
}

export type { Intent };
