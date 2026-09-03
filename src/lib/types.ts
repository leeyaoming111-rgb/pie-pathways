/**
 * Shared contracts. Every outcome — guided flow, demo scenario, or free-text
 * classification — resolves to a PathwayOutcome, and the eval harness validates
 * against exactly these shapes.
 */

import type { Intent } from "./intents";
import type { Destination, RouteId, SubRoute } from "./routes";

/** The universal outcome shape named in the architecture contract. */
export interface ClassifyResult {
  readonly intent: Intent;
  readonly route: Destination;
  readonly sub_route?: SubRoute;
  readonly confidence: number;
  readonly human_review_required: boolean;
  readonly personal_advice_generated: boolean;
  readonly missing_fields: string[];
}

/** Fields a visitor may still need to supply before the route is actionable. */
export const MISSING_FIELD_KEYS = [
  "relationship",
  "objective",
  "kiwisaver_action",
  "existing_member",
  "investor_structure",
  "funds_action",
  "wealth_investor",
  "wealth_need",
  "service_action",
  "request_type",
  "situation_detail",
] as const;

export type MissingField = (typeof MISSING_FIELD_KEYS)[number];

/** Answers collected by the guided flow. All optional — the flow is adaptive. */
export interface JourneyState {
  relationship?: "new" | "existing" | "professional" | "unsure";
  objective?:
    | "kiwisaver"
    | "funds"
    | "wealth"
    | "manage"
    | "forms"
    | "describe";
  /** KiwiSaver branch. */
  kiwisaverAction?: "join" | "transfer" | "manage" | "fund_choice";
  existingMember?: "yes" | "no";
  /** Funds branch. */
  investorStructure?: "personal" | "trust" | "company" | "minor" | "joint_other";
  fundsAction?: "info" | "apply" | "talk";
  /** Wealth branch. */
  wealthInvestor?: "individual" | "trust" | "entity";
  wealthNeed?: "portfolio" | "planning" | "general";
  wealthRange?: "under_250k" | "250k_1m" | "over_1m" | "skipped";
  /** Existing-client branch. */
  serviceAction?:
    | "portal"
    | "details"
    | "direct_debit"
    | "fund_switch"
    | "add_withdraw"
    | "other";
  /** Forms/request branch. */
  requestType?:
    | "deceased"
    | "emigration"
    | "illness"
    | "hardship"
    | "retirement"
    | "change_details"
    | "other";
  /** Free-text branch (P1). */
  freeText?: string;
}

/** A resolved pathway: the machine-readable result plus the copy that renders it. */
export interface PathwayDefinition {
  readonly result: ClassifyResult;
  /** Outcome card heading. */
  readonly title: string;
  /** One sentence. */
  readonly summary: string;
  /** "Why this route?" — under 80 words, plain English. */
  readonly why: string;
  /** "What to have ready" — never account numbers or ID documents. */
  readonly whatToHaveReady: readonly string[];
  /** Primary action: a verified URL. */
  readonly primaryAction: { readonly label: string; readonly href: string };
  /** Optional extra links (forms library, Fund Chooser, performance). */
  readonly secondaryLinks?: readonly {
    readonly label: string;
    readonly href: string;
  }[];
  /** Escalation contacts shown for sensitive outcomes. */
  readonly showEscalationContacts: boolean;
  /** Compassionate framing for sensitive outcomes. */
  readonly tone: "standard" | "sensitive";
  /** Shown above the action when a privacy reminder is warranted. */
  readonly privacyNote?: string;
}

/** A clarifying question, used when confidence is low or the route is `clarify`. */
export interface ClarifyPrompt {
  readonly question: string;
  readonly options: readonly { readonly label: string; readonly value: string }[];
}

/** Knowledge-base entry per route (Stage 1 contract). */
export interface KnowledgeEntry {
  readonly url: string;
  readonly summary: string;
  readonly summary_source: "generated" | "scraped";
  readonly threshold: { value: number; source: string } | null;
  readonly funds: readonly KnowledgeFund[];
  readonly insights: readonly KnowledgeInsight[];
  readonly scrape_errors: readonly string[];
}

export interface KnowledgeFund {
  readonly name: string;
  readonly description: string | null;
  readonly timeframe: string | null;
  readonly risk_rating: string | null;
  readonly status: string | null;
}

export interface KnowledgeInsight {
  readonly title: string;
  readonly date: string | null;
  readonly summary: string | null;
}

export type KnowledgeBase = Record<RouteId, KnowledgeEntry>;

/** Which knowledge source the running app is using. Surfaced in the dev panel. */
export type KnowledgeSource = "routes.json" | "fixture";
