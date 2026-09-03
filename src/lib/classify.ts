/**
 * classify(message) — the deterministic heuristic classifier.
 *
 * This is the default implementation and the only one the demo depends on. It
 * is a plain, ordered decision cascade: no model, no network, no randomness.
 * The same input always produces the same output, which is what makes the
 * Stage 4a eval harness meaningful.
 *
 * Ordering is a safety decision, not a convenience. Distress is detected before
 * anything else, so an upset visitor reaches a person even if their message also
 * contains a routine request. Instruction-injection is detected next, and the
 * injected sentences are removed before any routing is attempted.
 */

import { CONFIDENCE_FLOOR } from "./config";
import type { Intent } from "./intents";
import { CLARIFY, type Destination, type SubRoute } from "./routes";
import type { ClarifyPrompt, ClassifyResult } from "./types";

export interface ClassifyDetail {
  readonly result: ClassifyResult;
  /** Plain-English reason, shown in the developer panel and eval output. */
  readonly reason: string;
  /** The rule names that fired, in order. */
  readonly signals: string[];
  /** Present whenever the result routes to `clarify`. */
  readonly clarify?: ClarifyPrompt;
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

function normalise(message: string): string {
  return message
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function any(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/** Splits into sentences so injected instructions can be removed individually. */
function sentences(message: string): string[] {
  return message
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Amounts only count when they are unambiguously money: a currency symbol, or a
 * magnitude word. This keeps "I'm 42" and "PM48210" out of the threshold logic.
 */
function largestAmount(text: string): number | null {
  const pattern = /(?:\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k|m|b|thousand|million)?)|(?:(\d[\d,]*(?:\.\d+)?)\s*(k\b|m\b|million|thousand))/g;
  let largest: number | null = null;
  for (const match of text.matchAll(pattern)) {
    const raw = match[1] ?? match[3];
    const unit = (match[2] ?? match[4] ?? "").trim();
    if (!raw) continue;
    let value = Number.parseFloat(raw.replace(/,/g, ""));
    if (Number.isNaN(value)) continue;
    if (unit.startsWith("k") || unit === "thousand") value *= 1_000;
    else if (unit.startsWith("m") || unit === "million") value *= 1_000_000;
    else if (unit.startsWith("b")) value *= 1_000_000_000;
    if (largest === null || value > largest) largest = value;
  }
  return largest;
}

/* ------------------------------------------------------------------ */
/* Signal groups                                                       */
/* ------------------------------------------------------------------ */

const BEREAVEMENT = [
  /passed away/,
  /\bdied\b/,
  /\bdeath\b/,
  /deceased/,
  /\bestate\b/,
  /executor/,
  /probate/,
  /funeral/,
];

const SERIOUS_ILLNESS = [
  /serious(ly)? ill/,
  /serious illness/,
  /terminal/,
  /diagnos(ed|is)/,
  /life[- ]shortening/,
  /palliative/,
  /(not|un)able to work/,
  /can'?t work/,
];

const HARDSHIP = [
  /hardship/,
  /struggling to (pay|afford|cope)/,
  /can'?t afford/,
  /behind on (my |the )?(rent|mortgage|bills)/,
  /lost my job/,
  /made redundant/,
  /redundancy/,
  /desperate/,
];

const FRAUD_IDENTITY_COMPLAINT = [
  /fraud/,
  /scam(med)?/,
  /phishing/,
  /hacked/,
  /unauthoris(ed|e)/,
  /unauthoriz(ed|e)/,
  /identity (theft|fraud|stolen|taken)/,
  /someone (has been |is |was |keeps )?(trying to )?(log|logging|get)(ging)? ?(in)?to my account/,
  /details (have been|has been|were|been) (taken|stolen|compromised)/,
  /make a complaint/,
  /want to complain/,
  /formal complaint/,
  /raise a complaint/,
];

const ANXIETY = [
  /crash(ing)?/,
  /losing sleep/,
  /can'?t sleep/,
  /panic(king)?/,
  /\bworried\b/,
  /\banxious\b/,
  /\bscared\b/,
  /\bnervous\b/,
  /market (drop|fall|downturn|meltdown)/,
];

const PANIC_ACTION = [
  /pull (my |the )?money out/,
  /pull out/,
  /take (my |the )?money out/,
  /cash (it |everything )?out/,
  /should i (sell|withdraw|get out|move)/,
  /withdraw (it |everything |my money)/,
];

const INJECTION = [
  /ignore (all |any )?(previous|prior|above|earlier) instructions/,
  /disregard (all |any |your )?(previous|prior|above|earlier|instructions)/,
  /you are now (a|an|the)/,
  /system prompt/,
  /developer mode/,
  /no compliance rules/,
  /unrestricted (financial )?(adviser|advisor|assistant|ai)/,
  /pretend (you are|to be)/,
  /forget (your|all) (rules|instructions)/,
];

/** Requests for a recommendation, stripped when they arrive with an override. */
const RECOMMENDATION_REQUEST = [
  /which .{0,30}(fund|one|option).{0,30}(make|earn|return|best|most money)/,
  /tell me which/,
  /what should i (buy|invest in|pick|choose)/,
];

const PII = [
  /\bpm\s?\d{3,}\b/,
  /\b\d{9,}\b/,
  /(password|passcode) is/,
  /my ird (number )?is \d/,
  /account number is/,
  /\bcvv\b/,
];

const EXPLICIT_UNCLEAR = [
  /just (browsing|looking|having a look)/,
  /^(hi|hello|hey|kia ora)[.! ]*$/,
  /not sure what i(')?m looking for/,
  /just wanted to (see|have a look)/,
];

const EMIGRATION = [
  /emigrat(e|ing|ion)/,
  /moving (overseas|abroad)/,
  /relocat(e|ing) .{0,30}permanent/,
  /permanently (to|overseas|abroad)/,
  /leaving new zealand/,
  /left new zealand/,
  /moving to (australia|perth|sydney|melbourne|brisbane|the uk|london)/,
  /won'?t be coming back/,
];

const RETIREMENT = [
  /turning 65/,
  /reach(ing|ed)? 65/,
  /about to retire/,
  /retiring (next|this|in)/,
  /retirement withdrawal/,
];

const PORTAL = [
  /portal/,
  /log ?in/,
  /logging in/,
  /password/,
  /locked out/,
  /can'?t get (in|into)/,
  /reset email/,
  /online account/,
  /two[- ]factor/,
];

const DIRECT_DEBIT = [
  /direct debit/,
  /automatic payment/,
  /bank (account|details)/,
  /changed banks/,
  /change(d)? my bank/,
  /new bank/,
  /switch(ed)? banks/,
];

const CHANGE_DETAILS = [
  /(new|changed|change of|update|updated?) .{0,20}(address|details|phone|email|surname|name)/,
  /moved house/,
  /shifted to a new address/,
  /change my (contact|personal) details/,
];

const PROVIDER_TRANSFER = [
  /(another|different|current|existing|same|my old) provider/,
  /switch providers/,
  /change providers/,
  /transfer (my )?(kiwisaver|balance|account)/,
  /move (my )?(kiwisaver|balance) (across|over|to you)/,
  /bring(ing)? (my )?(kiwisaver|balance).{0,20}(across|over|to you)/,
];

const FUND_SWITCH = [
  /(move|switch|swap|change) .{0,30}(fund|option|balance|portfolio)/,
  /switch (funds|options)/,
  /move between funds/,
  /change what i'?m invested in/,
];

const ADD_WITHDRAW = [
  /(add|adding|top ?up|topping up|put more|contribute more|lump sum) .{0,30}(investment|account|balance|fund|money)?/,
  /^adding to/,
  /make a withdrawal/,
  /withdraw (some|part|funds)/,
  /take (some|part) out/,
];

const KIWISAVER_CONTEXT = [
  /kiwisaver/,
  /employer contribution/,
  /(the |a )?(retirement|workplace) scheme/,
  /which scheme/,
  /government contribution/,
  /member tax credit/,
];

const JOIN = [
  /sign up/,
  /\bjoin\b/,
  /how do i (get )?start(ed)?/,
  /open an account/,
  /enrol/,
  /first (full[- ]?time )?job/,
  /new to this/,
];

const MANAGE = [
  /employer contribution/,
  /don'?t look right/,
  /doesn'?t look right/,
  /check (my|the) (balance|account|contributions)/,
  /help with (my|the) .{0,25}(account|balance|contributions)/,
  /my (balance|account) (with you|here)/,
];

const FUND_CHOICE = [
  /which (fund|one|option) (should|would|is)/,
  /which one should i/,
  /right (fund|option) for/,
  /no idea (whether|which|what)/,
  /not sure which (fund|option)/,
  /pick a fund/,
  /choose a fund/,
  /what should i be in/,
  /am i in the right/,
];

const NON_STANDARD_STRUCTURE = [
  /\btrust\b/,
  /trustee/,
  /\bcompany\b/,
  /\bltd\b/,
  /\blimited\b/,
  /partnership/,
  /\bestate\b/,
  /for (my|our) (child|children|son|daughter|grandchild)/,
  /under 18/,
  /(16|17) year old/,
  /\bminor\b/,
  /joint account/,
];

const APPLY_SIGNAL = [
  /get (that|this|it) set up/,
  /set (that|this|it) up/,
  /how do (we|i) (get|go about|apply)/,
  /\bapply\b/,
  /application/,
  /open an account/,
  /put .{0,40}(money|funds) into/,
  /invest in one of/,
  /want to invest in/,
  /ready to invest/,
];

const TAILORED = [
  /tailored/,
  /bespoke/,
  /personalised|personalized/,
  /manage(d)? (approach|for us|for me|on our behalf)/,
  /someone we can (actually )?call/,
  /ongoing (advice|relationship)/,
  /portfolio management/,
];

const TALK_TO_SOMEONE = [
  /talk it through/,
  /talk to someone/,
  /speak (to|with) (someone|a person|an adviser|an advisor)/,
  /who should (we|i) be speaking to/,
  /before i commit/,
  /get (some )?advice/,
  /an adviser|an advisor/,
  /sit down with/,
];

const PERFORMANCE = [
  /returns?\b/,
  /performance/,
  /track record/,
  /how (have|has|did) .{0,40}(done|performed|gone)/,
  /(proper |actual |published )?figures/,
  /past results/,
];

const RESEARCH = [
  /assignment/,
  /(uni|university|school) (student|project)/,
  /\bstudent\b/,
  /research(ing)?/,
  /studying/,
  /comparing .{0,30}(fund manager|provider)/,
  /what you (make|think) of the market/,
  /market (outlook|commentary|view)/,
  /how you pick/,
  /investment (approach|philosophy|process)/,
  /newsletter/,
];

const FUNDS_INFO = [
  /invest/,
  /\bfunds?\b/,
  /what you (offer|do)/,
  /where to start/,
  /sitting in the bank/,
  /term deposit/,
  /grow (my|our) (money|savings)/,
  /portfolio/,
];

/* ------------------------------------------------------------------ */
/* Result builders                                                     */
/* ------------------------------------------------------------------ */

interface Outcome {
  intent: Intent;
  route: Destination;
  sub_route?: SubRoute;
  confidence: number;
  human_review_required?: boolean;
  missing_fields?: string[];
  reason: string;
}

function build(outcome: Outcome, signals: string[]): ClassifyDetail {
  const result: ClassifyResult = {
    intent: outcome.intent,
    route: outcome.route,
    ...(outcome.sub_route ? { sub_route: outcome.sub_route } : {}),
    confidence: outcome.confidence,
    human_review_required: outcome.human_review_required ?? false,
    // Invariant: this router never generates personal financial advice.
    personal_advice_generated: false,
    missing_fields: outcome.missing_fields ?? [],
  };
  return {
    result,
    reason: outcome.reason,
    signals,
    ...(outcome.route === CLARIFY ? { clarify: CLARIFY_PROMPT } : {}),
  };
}

export const CLARIFY_PROMPT: ClarifyPrompt = {
  question: "What would you like to do first?",
  options: [
    { label: "Sort out my KiwiSaver", value: "kiwisaver" },
    { label: "Invest outside KiwiSaver", value: "funds" },
    { label: "Talk to someone about a larger portfolio", value: "wealth" },
    { label: "Manage an investment I already have", value: "manage" },
    { label: "Find a form or make a request", value: "forms" },
  ],
};

/* ------------------------------------------------------------------ */
/* The cascade                                                         */
/* ------------------------------------------------------------------ */

export function classifyDetailed(message: string): ClassifyDetail {
  const signals: string[] = [];
  const raw = message ?? "";
  const text = normalise(raw);

  if (text.length === 0) {
    return build(
      {
        intent: "general_unclear",
        route: CLARIFY,
        confidence: 0.2,
        missing_fields: ["objective"],
        reason: "Nothing was entered, so there is nothing to route on.",
      },
      signals,
    );
  }

  /* 1. Distress first, always. ------------------------------------- */

  if (any(text, BEREAVEMENT)) {
    signals.push("bereavement");
    return build(
      {
        intent: "forms_sensitive",
        route: "contact",
        sub_route: "contact.sensitive",
        confidence: 0.95,
        human_review_required: true,
        reason: "Mentions a death or an estate, which always goes to a person.",
      },
      signals,
    );
  }

  if (any(text, FRAUD_IDENTITY_COMPLAINT)) {
    signals.push("fraud_identity_complaint");
    return build(
      {
        intent: "complaint_fraud_identity",
        route: "contact",
        sub_route: "contact.sensitive",
        confidence: 0.94,
        human_review_required: true,
        reason:
          "Raises fraud, identity or a complaint, which is time-critical and needs a person.",
      },
      signals,
    );
  }

  if (any(text, SERIOUS_ILLNESS) || any(text, HARDSHIP)) {
    signals.push(any(text, SERIOUS_ILLNESS) ? "serious_illness" : "hardship");
    return build(
      {
        intent: "forms_sensitive",
        route: "contact",
        sub_route: "contact.sensitive",
        confidence: 0.93,
        human_review_required: true,
        reason:
          "Describes illness or financial hardship. The router never states what applies — a person does.",
      },
      signals,
    );
  }

  if (any(text, ANXIETY) && any(text, PANIC_ACTION)) {
    signals.push("market_anxiety");
    return build(
      {
        intent: "forms_sensitive",
        route: "contact",
        sub_route: "contact.sensitive",
        confidence: 0.9,
        human_review_required: true,
        reason:
          "Asks whether to move money during market worry. Answering that would be personal advice, so it goes to a person.",
      },
      signals,
    );
  }

  /* 2. Instruction injection: strip it, keep routing the benign part. */

  let working = text;
  let injected = false;

  if (any(text, INJECTION)) {
    injected = true;
    signals.push("prompt_injection");
    working = sentences(raw)
      .filter((s) => {
        const n = normalise(s);
        return !any(n, INJECTION) && !any(n, RECOMMENDATION_REQUEST);
      })
      .map((s) => normalise(s))
      .join(" ")
      .trim();
  }

  /* 3. Account identifiers are never accepted by the intake. -------- */

  if (any(text, PII)) {
    signals.push("account_identifier");
    return build(
      {
        intent: "pii_disclosure",
        route: "contact",
        sub_route: "contact.privacy_safe",
        confidence: 0.92,
        human_review_required: true,
        reason:
          "An account identifier was pasted in. The intake does not accept identifiers, so this hands off to the team.",
      },
      signals,
    );
  }

  /* 4. Explicitly undecided visitors get a question, not a guess. --- */

  if (any(working, EXPLICIT_UNCLEAR)) {
    signals.push("explicit_browsing");
    return build(
      {
        intent: "general_unclear",
        route: CLARIFY,
        confidence: 0.4,
        missing_fields: ["objective"],
        reason: "No task was expressed, so the right move is to ask rather than guess.",
      },
      signals,
    );
  }

  /* 5. Task cascade. First match wins; order encodes precedence. ---- */

  const amount = largestAmount(working);
  const finish = (o: Outcome, signal: string): ClassifyDetail => {
    signals.push(signal);
    if (injected) {
      return build(
        {
          ...o,
          intent: "adversarial_injection",
          confidence: Math.min(o.confidence, 0.66),
          reason: `Injected instructions were ignored. Routed on the remaining request: ${o.reason.charAt(0).toLowerCase()}${o.reason.slice(1)}`,
        },
        signals,
      );
    }
    return build(o, signals);
  };

  if (any(working, EMIGRATION)) {
    return finish(
      {
        intent: "forms_standard",
        route: "documents",
        sub_route: "documents.forms",
        confidence: 0.85,
        reason:
          "Leaving New Zealand permanently is a form-and-review request, so this goes to the forms library.",
      },
      "emigration",
    );
  }

  if (any(working, RETIREMENT)) {
    return finish(
      {
        intent: "forms_standard",
        route: "documents",
        sub_route: "documents.forms",
        confidence: 0.82,
        reason: "A retirement request is handled by form, then reviewed by Pie's team.",
      },
      "retirement",
    );
  }

  if (any(working, PORTAL)) {
    return finish(
      {
        intent: "service_portal",
        route: "documents",
        sub_route: "documents.portal",
        confidence: 0.87,
        reason: "This is an access problem with the online account, not a security incident.",
      },
      "portal_access",
    );
  }

  if (any(working, DIRECT_DEBIT)) {
    return finish(
      {
        intent: "service_direct_debit",
        route: "documents",
        sub_route: "documents.forms",
        confidence: 0.88,
        reason: "Changing a bank account or a direct debit is a form, not a self-service action.",
      },
      "direct_debit",
    );
  }

  if (any(working, CHANGE_DETAILS)) {
    return finish(
      {
        intent: "service_details",
        route: "documents",
        sub_route: "documents.forms",
        confidence: 0.85,
        reason: "Updating personal details is routine admin handled through the forms library.",
      },
      "change_details",
    );
  }

  if (any(working, PROVIDER_TRANSFER)) {
    return finish(
      {
        intent: "kiwisaver_transfer",
        route: "kiwisaver",
        sub_route: "kiwisaver.transfer",
        confidence: 0.84,
        reason: "Moving a balance from another provider is a transfer rather than a new join.",
      },
      "provider_transfer",
    );
  }

  if (any(working, FUND_SWITCH)) {
    return finish(
      {
        intent: "service_fund_switch",
        route: "documents",
        sub_route: "documents.forms",
        confidence: 0.83,
        reason:
          "Asks how to move between funds. The router gives the process and never endorses a destination fund.",
      },
      "fund_switch",
    );
  }

  if (any(working, ADD_WITHDRAW)) {
    return finish(
      {
        intent: "service_add_withdraw",
        route: "documents",
        sub_route: "documents.forms",
        confidence: 0.78,
        reason: "Adding to or drawing on an existing investment is handled by form.",
      },
      "add_withdraw",
    );
  }

  const kiwisaver = any(working, KIWISAVER_CONTEXT);

  if (kiwisaver && any(working, JOIN)) {
    return finish(
      {
        intent: "kiwisaver_join",
        route: "kiwisaver",
        sub_route: "kiwisaver.join",
        confidence: 0.9,
        reason: "A clear request to join the scheme, with nothing that complicates it.",
      },
      "kiwisaver_join",
    );
  }

  if (kiwisaver && any(working, MANAGE)) {
    return finish(
      {
        intent: "kiwisaver_manage",
        route: "kiwisaver",
        sub_route: "kiwisaver.manage",
        confidence: 0.82,
        reason:
          "The task asked for is about an existing scheme account, so that is what it routes on.",
      },
      "kiwisaver_manage",
    );
  }

  if (!injected && any(working, FUND_CHOICE)) {
    return finish(
      {
        intent: "kiwisaver_fund_choice",
        route: "kiwisaver",
        sub_route: "kiwisaver.fund_chooser",
        confidence: 0.86,
        reason:
          "Asks which fund to be in. That question goes to Pie's existing Fund Chooser, never to a recommendation.",
      },
      "fund_choice",
    );
  }

  const nonStandard = any(working, NON_STANDARD_STRUCTURE);

  if (nonStandard && any(working, APPLY_SIGNAL)) {
    return finish(
      {
        intent: "funds_apply",
        route: "funds",
        sub_route: "funds.apply_by_form",
        confidence: 0.89,
        human_review_required: true,
        reason:
          "Trusts, companies, minors and non-standard joint accounts cannot apply online, so this goes to the downloadable form.",
      },
      "non_standard_application",
    );
  }

  if (
    nonStandard ||
    any(working, TAILORED) ||
    (amount !== null && amount >= 1_000_000)
  ) {
    if (any(working, TAILORED) || any(working, TALK_TO_SOMEONE) || nonStandard) {
      return finish(
        {
          intent: "wealth_enquiry",
          route: "wealth",
          confidence: 0.87,
          reason:
            "A trust, entity or tailored request. This is an enquiry for the private wealth team, not an eligibility decision.",
        },
        "wealth_enquiry",
      );
    }
  }

  if (any(working, TALK_TO_SOMEONE)) {
    return finish(
      {
        intent: "advice_enquiry",
        route: "advice",
        confidence: 0.84,
        reason: "Asks for a conversation before investing, so this routes to the advice service.",
      },
      "advice_enquiry",
    );
  }

  if (any(working, PERFORMANCE)) {
    return finish(
      {
        intent: "funds_info",
        route: "performance",
        confidence: 0.83,
        reason:
          "Asks about published results. The router links the figures rather than quoting any number.",
      },
      "performance_lookup",
    );
  }

  if (any(working, RESEARCH)) {
    return finish(
      {
        intent: "funds_info",
        route: "insights",
        confidence: 0.8,
        reason: "Wants commentary and approach rather than a product or an application.",
      },
      "research_commentary",
    );
  }

  if (any(working, APPLY_SIGNAL) && any(working, FUNDS_INFO)) {
    return finish(
      {
        intent: "funds_apply",
        route: "funds",
        sub_route: "funds.apply_online",
        confidence: 0.8,
        reason: "A standard personal application, which can be completed online.",
      },
      "standard_application",
    );
  }

  if (any(working, FUNDS_INFO)) {
    return finish(
      {
        intent: "funds_info",
        route: "funds",
        confidence: 0.75,
        reason:
          "Wants to know what is on offer before doing anything. The router navigates; it makes no judgement about what suits.",
      },
      "funds_info",
    );
  }

  if (kiwisaver) {
    return finish(
      {
        intent: "kiwisaver_manage",
        route: "kiwisaver",
        sub_route: "kiwisaver.manage",
        confidence: 0.68,
        reason: "Scheme-related but the task is not spelled out, so it routes to the scheme page.",
      },
      "kiwisaver_general",
    );
  }

  signals.push("no_match");
  return build(
    {
      intent: injected ? "adversarial_injection" : "general_unclear",
      route: CLARIFY,
      confidence: 0.35,
      missing_fields: ["objective"],
      reason: injected
        ? "Injected instructions were ignored and nothing routable was left, so this asks a question."
        : "No routing signal was strong enough, so the right move is to ask a question.",
    },
    signals,
  );
}

/** The contract entry point. Returns exactly the shared outcome shape. */
export function classify(message: string): ClassifyResult {
  return classifyDetailed(message).result;
}

/** True when the result is too weak to route on and must ask instead. */
export function needsClarification(result: ClassifyResult): boolean {
  return result.route === CLARIFY || result.confidence < CONFIDENCE_FLOOR;
}
