/**
 * The guided state machine.
 *
 * `resolvePathway(state)` is pure: given the answers collected so far it either
 * returns the next question or the resolved outcome. The component renders
 * whatever it gets back and holds no routing logic of its own.
 */

import type { Intent } from "./intents";
import type { Destination, SubRoute } from "./routes";
import { buildPathway } from "./outcomes";
import type { ClassifyResult, JourneyState, PathwayDefinition } from "./types";

export interface StepOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

export interface Step {
  readonly id: keyof JourneyState;
  readonly question: string;
  readonly help?: string;
  /** Shown under the options when an answer only affects routing. */
  readonly note?: string;
  readonly options: readonly StepOption[];
  /** Optional steps can be skipped without blocking the outcome. */
  readonly optional?: boolean;
}

export type Resolution =
  | { readonly status: "question"; readonly step: Step; readonly missing_fields: string[] }
  | { readonly status: "resolved"; readonly pathway: PathwayDefinition }
  /** The free-text branch takes over from here (P1). */
  | { readonly status: "free_text" };

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const RELATIONSHIP_STEP: Step = {
  id: "relationship",
  question: "First up — how do you come to Pie?",
  help: "This just shapes the next question. Nothing here is stored.",
  options: [
    { value: "new", label: "I'm new to Pie", description: "Looking at Pie for the first time" },
    { value: "existing", label: "I'm already a client", description: "I have a KiwiSaver or investment account" },
    { value: "professional", label: "I'm asking on someone's behalf", description: "An adviser, accountant, lawyer or family member" },
    { value: "unsure", label: "Not sure", description: "Somewhere in between" },
  ],
};

const OBJECTIVE_STEP: Step = {
  id: "objective",
  question: "What would you like to do?",
  options: [
    { value: "kiwisaver", label: "Sort out my KiwiSaver", description: "Join, transfer, or manage an account" },
    { value: "funds", label: "Invest outside KiwiSaver", description: "Pie's managed investment funds" },
    { value: "wealth", label: "Tailored wealth management", description: "An ongoing, managed relationship" },
    { value: "manage", label: "Manage an existing investment", description: "Portal, details, payments, switches" },
    { value: "forms", label: "Find a form or make a request", description: "Life changes and paperwork" },
    { value: "describe", label: "Describe my situation", description: "Tell us in your own words instead" },
  ],
};

const KIWISAVER_ACTION_STEP: Step = {
  id: "kiwisaverAction",
  question: "What's the KiwiSaver part?",
  options: [
    { value: "join", label: "I want to join Pie's scheme", description: "New to KiwiSaver, or opening an account with Pie" },
    { value: "transfer", label: "I want to move from another provider", description: "I already have KiwiSaver elsewhere" },
    { value: "manage", label: "I need to sort something on my account", description: "Contributions, balance, statements" },
    { value: "fund_choice", label: "I don't know which fund to be in", description: "Choosing between the four funds" },
  ],
};

const EXISTING_MEMBER_STEP: Step = {
  id: "existingMember",
  question: "Is the account with Pie?",
  options: [
    { value: "yes", label: "Yes, it's a Pie account" },
    { value: "no", label: "No, it's with another provider" },
  ],
};

const INVESTOR_STRUCTURE_STEP: Step = {
  id: "investorStructure",
  question: "Who would be investing?",
  help: "This decides whether the application can be completed online.",
  options: [
    { value: "personal", label: "Me, in my own name", description: "Aged 18 or over, and in New Zealand" },
    { value: "trust", label: "A trust", description: "Family trust or similar" },
    { value: "company", label: "A company or other entity" },
    { value: "minor", label: "A child under 18" },
    { value: "joint_other", label: "A joint or other arrangement", description: "Anything that isn't a standard single or joint account" },
  ],
};

const FUNDS_ACTION_STEP: Step = {
  id: "fundsAction",
  question: "Where are you up to?",
  options: [
    { value: "info", label: "Just reading about the funds" },
    { value: "apply", label: "Ready to apply" },
    { value: "talk", label: "I'd like to talk to someone first" },
  ],
};

const WEALTH_INVESTOR_STEP: Step = {
  id: "wealthInvestor",
  question: "Who would the investor be?",
  options: [
    { value: "individual", label: "An individual or a couple" },
    { value: "trust", label: "A family trust" },
    { value: "entity", label: "A company or other entity" },
  ],
};

const WEALTH_NEED_STEP: Step = {
  id: "wealthNeed",
  question: "What are you after?",
  options: [
    { value: "portfolio", label: "Someone to manage a portfolio", description: "An ongoing, tailored arrangement" },
    { value: "planning", label: "Help planning what to do", description: "A conversation before deciding" },
    { value: "general", label: "A general chat", description: "Still working out what I need" },
  ],
};

const WEALTH_RANGE_STEP: Step = {
  id: "wealthRange",
  question: "Roughly how much would be involved?",
  note: "Routing only — not advice or eligibility confirmation.",
  optional: true,
  options: [
    { value: "under_250k", label: "Under NZ$250k" },
    { value: "250k_1m", label: "NZ$250k – $1m" },
    { value: "over_1m", label: "NZ$1m+" },
    { value: "skipped", label: "I'd rather not say" },
  ],
};

const SERVICE_ACTION_STEP: Step = {
  id: "serviceAction",
  question: "What do you need to do?",
  options: [
    { value: "portal", label: "Get into the Investor Portal" },
    { value: "details", label: "Update my details", description: "Address, phone, email or name" },
    { value: "direct_debit", label: "Change a direct debit or bank account" },
    { value: "fund_switch", label: "Switch funds" },
    { value: "add_withdraw", label: "Add to or withdraw from my investment" },
    { value: "other", label: "Something else" },
  ],
};

const REQUEST_TYPE_STEP: Step = {
  id: "requestType",
  question: "What's the request about?",
  help: "Some of these are handled by a person rather than a form.",
  options: [
    { value: "deceased", label: "A deceased estate" },
    { value: "illness", label: "Serious illness" },
    { value: "hardship", label: "Financial hardship" },
    { value: "emigration", label: "Permanent emigration" },
    { value: "retirement", label: "Retirement" },
    { value: "change_details", label: "A change of details" },
    { value: "other", label: "Something else" },
  ],
};

/* ------------------------------------------------------------------ */
/* Outcome assembly                                                    */
/* ------------------------------------------------------------------ */

interface OutcomeSpec {
  intent: Intent;
  route: Destination;
  sub_route?: SubRoute;
  confidence: number;
  human_review_required?: boolean;
}

function resolved(spec: OutcomeSpec): Resolution {
  const result: ClassifyResult = {
    intent: spec.intent,
    route: spec.route,
    ...(spec.sub_route ? { sub_route: spec.sub_route } : {}),
    confidence: spec.confidence,
    human_review_required: spec.human_review_required ?? false,
    personal_advice_generated: false,
    missing_fields: [],
  };
  const pathway = buildPathway(result);
  if (!pathway) {
    throw new Error(`No outcome copy for ${spec.sub_route ?? spec.route}`);
  }
  return { status: "resolved", pathway };
}

function ask(step: Step, missing: string[]): Resolution {
  return { status: "question", step, missing_fields: missing };
}

/**
 * The guided flow answers every question itself, so confidence is 1: there is
 * no inference involved, only a lookup against what the visitor selected.
 */
const CERTAIN = 1;

/* ------------------------------------------------------------------ */
/* resolvePathway                                                      */
/* ------------------------------------------------------------------ */

export function resolvePathway(state: JourneyState): Resolution {
  if (!state.relationship) return ask(RELATIONSHIP_STEP, ["relationship", "objective"]);
  if (!state.objective) return ask(OBJECTIVE_STEP, ["objective"]);

  switch (state.objective) {
    case "describe":
      return { status: "free_text" };

    case "kiwisaver":
      return resolveKiwiSaver(state);

    case "funds":
      return resolveFunds(state);

    case "wealth":
      return resolveWealth(state);

    case "manage":
      return resolveService(state);

    case "forms":
      return resolveRequest(state);
  }
}

function resolveKiwiSaver(state: JourneyState): Resolution {
  if (!state.kiwisaverAction) return ask(KIWISAVER_ACTION_STEP, ["kiwisaver_action"]);

  switch (state.kiwisaverAction) {
    case "join":
      return resolved({
        intent: "kiwisaver_join",
        route: "kiwisaver",
        sub_route: "kiwisaver.join",
        confidence: CERTAIN,
      });

    case "transfer":
      return resolved({
        intent: "kiwisaver_transfer",
        route: "kiwisaver",
        sub_route: "kiwisaver.transfer",
        confidence: CERTAIN,
      });

    case "fund_choice":
      return resolved({
        intent: "kiwisaver_fund_choice",
        route: "kiwisaver",
        sub_route: "kiwisaver.fund_chooser",
        confidence: CERTAIN,
      });

    case "manage": {
      if (!state.existingMember) return ask(EXISTING_MEMBER_STEP, ["existing_member"]);
      // Someone managing an account held elsewhere is really asking to transfer.
      if (state.existingMember === "no") {
        return resolved({
          intent: "kiwisaver_transfer",
          route: "kiwisaver",
          sub_route: "kiwisaver.transfer",
          confidence: CERTAIN,
        });
      }
      return resolved({
        intent: "kiwisaver_manage",
        route: "kiwisaver",
        sub_route: "kiwisaver.manage",
        confidence: CERTAIN,
      });
    }
  }
}

function resolveFunds(state: JourneyState): Resolution {
  if (!state.investorStructure) return ask(INVESTOR_STRUCTURE_STEP, ["investor_structure"]);
  if (!state.fundsAction) return ask(FUNDS_ACTION_STEP, ["funds_action"]);

  if (state.fundsAction === "talk") {
    return resolved({ intent: "advice_enquiry", route: "advice", confidence: CERTAIN });
  }

  if (state.fundsAction === "info") {
    return resolved({ intent: "funds_info", route: "funds", confidence: CERTAIN });
  }

  // The centrepiece: anything other than a standard personal application is
  // sent to the downloadable form, and a person reviews it.
  if (state.investorStructure !== "personal") {
    return resolved({
      intent: "funds_apply",
      route: "funds",
      sub_route: "funds.apply_by_form",
      confidence: CERTAIN,
      human_review_required: true,
    });
  }

  return resolved({
    intent: "funds_apply",
    route: "funds",
    sub_route: "funds.apply_online",
    confidence: CERTAIN,
  });
}

function resolveWealth(state: JourneyState): Resolution {
  if (!state.wealthInvestor) return ask(WEALTH_INVESTOR_STEP, ["wealth_investor"]);
  if (!state.wealthNeed) return ask(WEALTH_NEED_STEP, ["wealth_need"]);
  // The range question is optional: it refines the route but never gates it.
  if (!state.wealthRange && state.wealthInvestor === "individual" && state.wealthNeed !== "portfolio") {
    return ask(WEALTH_RANGE_STEP, []);
  }

  const entity = state.wealthInvestor === "trust" || state.wealthInvestor === "entity";
  const tailored = state.wealthNeed === "portfolio";
  const topBand = state.wealthRange === "over_1m";

  if (entity || tailored || topBand) {
    return resolved({ intent: "wealth_enquiry", route: "wealth", confidence: CERTAIN });
  }

  if (state.wealthNeed === "planning") {
    return resolved({ intent: "advice_enquiry", route: "advice", confidence: CERTAIN });
  }

  return resolved({ intent: "advice_enquiry", route: "contact", confidence: CERTAIN });
}

function resolveService(state: JourneyState): Resolution {
  if (!state.serviceAction) return ask(SERVICE_ACTION_STEP, ["service_action"]);

  switch (state.serviceAction) {
    case "portal":
      return resolved({
        intent: "service_portal",
        route: "documents",
        sub_route: "documents.portal",
        confidence: CERTAIN,
      });
    case "details":
      return resolved({
        intent: "service_details",
        route: "documents",
        sub_route: "documents.forms",
        confidence: CERTAIN,
      });
    case "direct_debit":
      return resolved({
        intent: "service_direct_debit",
        route: "documents",
        sub_route: "documents.forms",
        confidence: CERTAIN,
      });
    case "fund_switch":
      return resolved({
        intent: "service_fund_switch",
        route: "documents",
        sub_route: "documents.forms",
        confidence: CERTAIN,
      });
    case "add_withdraw":
      return resolved({
        intent: "service_add_withdraw",
        route: "documents",
        sub_route: "documents.forms",
        confidence: CERTAIN,
      });
    case "other":
      // The visitor has told us they are a client with a need we do not list.
      // A person is genuinely the right answer here.
      return resolved({
        intent: "general_unclear",
        route: "contact",
        confidence: CERTAIN,
        human_review_required: true,
      });
  }
}

function resolveRequest(state: JourneyState): Resolution {
  if (!state.requestType) return ask(REQUEST_TYPE_STEP, ["request_type"]);

  switch (state.requestType) {
    case "deceased":
    case "illness":
    case "hardship":
    case "other":
      return resolved({
        intent:
          state.requestType === "other" ? "general_unclear" : "forms_sensitive",
        route: "contact",
        sub_route: "contact.sensitive",
        confidence: CERTAIN,
        human_review_required: true,
      });
    case "emigration":
    case "retirement":
      return resolved({
        intent: "forms_standard",
        route: "documents",
        sub_route: "documents.forms",
        confidence: CERTAIN,
      });
    case "change_details":
      return resolved({
        intent: "service_details",
        route: "documents",
        sub_route: "documents.forms",
        confidence: CERTAIN,
      });
  }
}

/* ------------------------------------------------------------------ */
/* Progress + demo scenarios                                           */
/* ------------------------------------------------------------------ */

/** Answered steps out of the number this branch will ask. Used for the bar. */
export function progress(state: JourneyState): { answered: number; total: number } {
  const total = state.objective === "wealth" ? 5 : state.objective ? 4 : 3;
  let answered = 0;
  if (state.relationship) answered++;
  if (state.objective) answered++;
  for (const key of [
    "kiwisaverAction",
    "existingMember",
    "investorStructure",
    "fundsAction",
    "wealthInvestor",
    "wealthNeed",
    "wealthRange",
    "serviceAction",
    "requestType",
  ] as const) {
    if (state[key]) answered++;
  }
  return { answered: Math.min(answered, total), total };
}

export interface DemoScenario {
  readonly id: string;
  readonly chip: string;
  readonly caption: string;
  readonly state: JourneyState;
}

/**
 * The six scenarios that drive the demo. Each is a complete JourneyState, so
 * clicking one lands directly on its outcome through the same resolvePathway
 * call the guided flow uses — no separate code path, nothing special-cased.
 */
export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: "kiwisaver-joiner",
    chip: "New KiwiSaver joiner",
    caption: "First job, joining the scheme",
    state: { relationship: "new", objective: "kiwisaver", kiwisaverAction: "join" },
  },
  {
    id: "individual-investor",
    chip: "Individual fund investor",
    caption: "Applying in their own name",
    state: {
      relationship: "new",
      objective: "funds",
      investorStructure: "personal",
      fundsAction: "apply",
    },
  },
  {
    id: "family-trust-wealth",
    chip: "Family trust, NZ$1.8m",
    caption: "Tailored management → wealth",
    state: {
      relationship: "new",
      objective: "wealth",
      wealthInvestor: "trust",
      wealthNeed: "portfolio",
      wealthRange: "over_1m",
    },
  },
  {
    id: "trust-managed-funds",
    chip: "Trust in managed funds",
    caption: "Can't apply online → form",
    state: {
      relationship: "new",
      objective: "funds",
      investorStructure: "trust",
      fundsAction: "apply",
    },
  },
  {
    id: "bank-change",
    chip: "Existing client, bank change",
    caption: "Direct debit moving banks",
    state: { relationship: "existing", objective: "manage", serviceAction: "direct_debit" },
  },
  {
    id: "deceased-estate",
    chip: "Deceased estate",
    caption: "Compassionate hand-off",
    state: { relationship: "professional", objective: "forms", requestType: "deceased" },
  },
] as const;
