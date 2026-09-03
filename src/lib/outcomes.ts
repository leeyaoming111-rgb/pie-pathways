/**
 * Outcome copy.
 *
 * Every surface — guided flow, demo scenario, free-text classification — renders
 * through `buildPathway`, so there is exactly one place where visitor-facing
 * wording lives. The Stage 4a validator scans the text this file produces, which
 * only works because nothing else writes outcome copy.
 *
 * Rules encoded here: no fund is ever named as an instruction, no return figure
 * is ever quoted, no eligibility or approval is ever stated, and the unverified
 * NZ$25,000 minimum never appears.
 */

import { CONTACTS, COMPLIANCE, uiThreshold } from "./config";
import { ACTION_URLS, CLARIFY, ROUTES, absoluteUrl } from "./routes";
import type { ClassifyResult, PathwayDefinition } from "./types";

/** Key used to select copy: the sub-route when there is one, else the route. */
function copyKey(result: ClassifyResult): string {
  return result.sub_route ?? result.route;
}

const PERFORMANCE_LINK = {
  label: "See published performance",
  href: absoluteUrl(ACTION_URLS.performance),
};

const DOCUMENTS_LINK = {
  label: "Open Investor Documents",
  href: absoluteUrl(ACTION_URLS.investorDocuments),
};

type CopyBlock = Omit<PathwayDefinition, "result">;

function standard(block: Partial<CopyBlock> & Pick<CopyBlock, "title" | "summary" | "why" | "whatToHaveReady" | "primaryAction">): CopyBlock {
  return {
    showEscalationContacts: false,
    tone: "standard",
    ...block,
  };
}

function sensitive(block: Partial<CopyBlock> & Pick<CopyBlock, "title" | "summary" | "why" | "whatToHaveReady" | "primaryAction">): CopyBlock {
  return {
    showEscalationContacts: true,
    tone: "sensitive",
    ...block,
  };
}

const COPY: Record<string, CopyBlock> = {
  "kiwisaver.join": standard({
    title: "Join the Pie KiwiSaver Scheme",
    summary: "You can join online, and the form walks you through each step.",
    why: "You told us you want to start with Pie's KiwiSaver scheme and nothing about your situation needs a paper form. The online application is the shortest route.",
    whatToHaveReady: [
      "Your driver licence or passport",
      "Your IRD (Inland Revenue Department) number",
      "About ten minutes",
    ],
    primaryAction: {
      label: "Start the KiwiSaver application",
      href: absoluteUrl(ACTION_URLS.kiwisaverApply),
    },
    secondaryLinks: [
      { label: "Read about the scheme first", href: absoluteUrl(ROUTES.kiwisaver.url) },
    ],
  }),

  "kiwisaver.transfer": standard({
    title: "Move your KiwiSaver to Pie",
    summary: "Transferring from another provider is handled through the same application.",
    why: "You already have a KiwiSaver account somewhere else, so this is a transfer rather than a new join. Pie's application covers the move, and your current provider is contacted for you.",
    whatToHaveReady: [
      "Your driver licence or passport",
      "Your IRD number",
      "The name of your current provider",
    ],
    primaryAction: {
      label: "Start a transfer",
      href: absoluteUrl(ACTION_URLS.kiwisaverApply),
    },
    secondaryLinks: [
      { label: "Read about the scheme", href: absoluteUrl(ROUTES.kiwisaver.url) },
    ],
  }),

  "kiwisaver.manage": standard({
    title: "Manage your KiwiSaver account",
    summary: "Your balance, contributions and statements all sit in the Investor Portal.",
    why: "You asked about an account you already hold. The portal is where the details live, and Pie's team can pick up anything the portal does not answer.",
    whatToHaveReady: [
      "Your portal login",
      "The dates or period you are asking about",
    ],
    primaryAction: {
      label: "Go to the Investor Portal guide",
      href: absoluteUrl(ACTION_URLS.investorPortalGuide),
    },
    secondaryLinks: [
      { label: "Read about the scheme", href: absoluteUrl(ROUTES.kiwisaver.url) },
    ],
  }),

  "kiwisaver.fund_chooser": standard({
    title: "Use the Fund Chooser",
    summary: "Pie already has a tool for this, and it takes a few minutes.",
    why: "Choosing between funds depends on your goals, life stage and timeframe. This prototype does not answer that question. Pie's Fund Chooser asks it properly, and an adviser can take it further.",
    whatToHaveReady: [
      "A rough idea of when you expect to use the money",
      "How you would feel about your balance moving up and down",
    ],
    primaryAction: {
      label: "Open the Fund Chooser",
      href: absoluteUrl(ROUTES.kiwisaver.url),
    },
  }),

  "funds.apply_by_form": standard({
    title: "Apply by form",
    summary:
      "Trusts, companies, minors and non-standard joint accounts complete a paper form rather than the online application.",
    why: "Pie's online application covers individuals aged 18 or over who are in New Zealand. Your situation sits outside that, so the application is downloaded, completed and emailed to Pie's applications inbox instead.",
    whatToHaveReady: [
      "Contact details for everyone who needs to sign",
      "Identification and a New Zealand bank account in the same name(s)",
      "An IRD number, or a TIN (Tax Identification Number) for anyone taxed overseas",
      "A mobile number for each applicant — identity is verified separately for each person",
    ],
    primaryAction: {
      label: "Download the application form",
      href: absoluteUrl(ACTION_URLS.investorDocuments),
    },
    secondaryLinks: [
      { label: "Read about the funds", href: absoluteUrl(ROUTES.funds.url) },
    ],
  }),

  "funds.apply_online": standard({
    title: "Apply online",
    summary: "You can complete the managed funds application online.",
    why: "You are applying in your own name, so the online application fits. It covers identity checks and tax residency as you go.",
    whatToHaveReady: [
      "Contact details",
      "Identification and a New Zealand bank account in your own name",
      "An IRD number, or a TIN (Tax Identification Number) if you are taxed overseas",
      "Your own mobile number, used to verify your identity",
    ],
    primaryAction: {
      label: "Start the online application",
      href: absoluteUrl(ACTION_URLS.fundsApplyOnline),
    },
    secondaryLinks: [
      { label: "Read about the funds first", href: absoluteUrl(ROUTES.funds.url) },
      PERFORMANCE_LINK,
    ],
  }),

  funds: standard({
    title: "Pie's Investment Funds",
    summary:
      "Actively managed funds, grouped as Australasian, Global, and Diversified and Fixed Income.",
    why: "You are working out what is on offer before doing anything else. The funds page sets out each fund with its timeframe and risk rating, so you can see the range in one place.",
    whatToHaveReady: [
      "A rough timeframe for the money",
      "The relevant Product Disclosure Statement, which is linked from each fund",
    ],
    primaryAction: {
      label: "Explore the Investment Funds",
      href: absoluteUrl(ROUTES.funds.url),
    },
    secondaryLinks: [PERFORMANCE_LINK],
  }),

  advice: standard({
    title: "Investment Advice",
    summary: "A conversation with Pie's advice team before you commit to anything.",
    why: "You asked to talk it through rather than pick something yourself. Pie's advice service is built for that conversation. This is an enquiry only — the team confirms what applies to your situation.",
    whatToHaveReady: [
      "A rough figure and timeframe",
      "What you want the money to do",
      "Any deadlines you are working to",
    ],
    primaryAction: {
      label: "Read about Investment Advice",
      href: absoluteUrl(ROUTES.advice.url),
    },
  }),

  wealth: standard({
    title: "Pie Wealth",
    summary: `A boutique advice service for individuals, family trusts and entities — Pie describes it as best suited to ${uiThreshold("pieWealth")} to invest.`,
    why: "You described a trust, an entity or a tailored ongoing arrangement. That is what the private wealth team handles. This is an enquiry, not a confirmation that the service is right for you.",
    whatToHaveReady: [
      "Who the investor is — an individual, a trust or another entity",
      "What you want managed, and roughly over what timeframe",
      "The best person and time to make contact",
    ],
    primaryAction: {
      label: "Talk to the Wealth team",
      href: absoluteUrl(ROUTES.wealth.url),
    },
  }),

  performance: standard({
    title: "Fund performance",
    summary: "Published figures, shown with the period and source they are reported against.",
    why: "You asked how the funds have done. This prototype does not quote any figure — the published performance page is the only place those numbers should be read, with their dates attached.",
    whatToHaveReady: [
      "The fund or funds you want to compare",
      "The period you are interested in",
    ],
    primaryAction: PERFORMANCE_LINK,
    secondaryLinks: [
      { label: "Read about the funds", href: absoluteUrl(ROUTES.funds.url) },
    ],
  }),

  insights: standard({
    title: "Market Insights",
    summary: "Pie's commentary, including the monthly “A message from Mike” and the Slice of Pie newsletter.",
    why: "You are after Pie's thinking rather than a product or an application. The insights feed is where the commentary and the investment approach are written up.",
    whatToHaveReady: ["Nothing — this one is just reading"],
    primaryAction: {
      label: "Read Market Insights",
      href: absoluteUrl(ROUTES.insights.url),
    },
    secondaryLinks: [
      { label: "Read about the funds", href: absoluteUrl(ROUTES.funds.url) },
    ],
  }),

  "documents.portal": standard({
    title: "Investor Portal access",
    summary: "The portal how-to guide covers logging in and resetting access.",
    why: "This looks like an access problem rather than a security concern. The guide covers the common causes, and Pie's team can unlock anything it does not.",
    whatToHaveReady: [
      "The email address your account is registered to",
      "Access to that inbox",
    ],
    primaryAction: {
      label: "Open the portal guide",
      href: absoluteUrl(ACTION_URLS.investorPortalGuide),
    },
    privacyNote: COMPLIANCE.privacyNote,
  }),

  "documents.forms": standard({
    title: "Find the right form",
    summary: "Investor Documents holds the forms, disclosure statements and reports.",
    why: "What you are asking for is handled on a form rather than online. The forms library has the current version, and Pie's team reviews each request once it is in.",
    whatToHaveReady: [
      "Your name as it appears on the account",
      "Any dates or amounts the form asks for",
      "A signature — some forms need every account holder to sign",
    ],
    primaryAction: DOCUMENTS_LINK,
    privacyNote: COMPLIANCE.privacyNote,
  }),

  documents: standard({
    title: "Investor Documents",
    summary: "Forms, Product Disclosure Statements and reports in one place.",
    why: "Your request is handled through Pie's documents and forms. The library has the current versions.",
    whatToHaveReady: ["Your name as it appears on the account"],
    primaryAction: DOCUMENTS_LINK,
  }),

  "contact.sensitive": sensitive({
    title: "Pie's team will take this from here",
    summary: "This is not something to work through on a website. A person will help you.",
    why: "What you have described needs a person, not a form-filling tool. Pie's client services team handles these directly and can tell you what applies to your situation.",
    whatToHaveReady: [
      "Your name, and the best number to reach you on",
      "Nothing else — the team will tell you what they need",
    ],
    primaryAction: {
      label: "Contact Pie's team",
      href: absoluteUrl(ROUTES.contact.url),
    },
    secondaryLinks: [DOCUMENTS_LINK],
    privacyNote: COMPLIANCE.privacyNote,
  }),

  "contact.privacy_safe": sensitive({
    title: "Let's not do this here",
    summary: "Account identifiers belong in the Investor Portal or with Pie's team, not in this form.",
    why: "You have included an account identifier. This prototype does not store or use identifiers, and it has not been recorded. Pie's team can pick up your request securely once they have verified who you are.",
    whatToHaveReady: [
      "Your name, and the best number to reach you on",
      "Nothing else here — identity is verified by the team, not by this form",
    ],
    primaryAction: {
      label: "Contact Pie's team",
      href: absoluteUrl(ROUTES.contact.url),
    },
    secondaryLinks: [
      { label: "Open the Investor Portal guide", href: absoluteUrl(ACTION_URLS.investorPortalGuide) },
    ],
    privacyNote: COMPLIANCE.privacyNote,
  }),

  contact: standard({
    title: "Talk to Pie's team",
    summary: "A person is the quickest way through this one.",
    why: "What you are asking does not map neatly onto a page or a form, so the team is the right next step. They can point you to whatever applies.",
    whatToHaveReady: [
      "Your name, and the best number to reach you on",
      "A sentence on what you are trying to do",
    ],
    primaryAction: {
      label: "Contact Pie's team",
      href: absoluteUrl(ROUTES.contact.url),
    },
    secondaryLinks: [DOCUMENTS_LINK],
  }),
};

/**
 * Builds the renderable outcome for any result. `clarify` has no outcome card —
 * callers must ask the clarifying question instead.
 */
export function buildPathway(result: ClassifyResult): PathwayDefinition | null {
  if (result.route === CLARIFY) return null;
  const block = COPY[copyKey(result)] ?? COPY[result.route];
  if (!block) return null;
  return { result, ...block };
}

/** Escalation contacts, shown on every sensitive outcome. */
export const ESCALATION_CONTACTS = [
  { label: "Freephone (NZ)", value: CONTACTS.phoneNz, href: `tel:${CONTACTS.phoneNz.replace(/\s/g, "")}` },
  { label: "International", value: CONTACTS.phoneInternational, href: `tel:${CONTACTS.phoneInternational.replace(/\s/g, "")}` },
  { label: "Email", value: CONTACTS.clientEmail, href: `mailto:${CONTACTS.clientEmail}` },
] as const;

/** Every distinct piece of outcome text, for the Stage 4a no-recommendation scan. */
export function outcomeText(pathway: CopyBlock): string {
  return [
    pathway.title,
    pathway.summary,
    pathway.why,
    ...pathway.whatToHaveReady,
    pathway.primaryAction.label,
    ...(pathway.secondaryLinks ?? []).map((l) => l.label),
    pathway.privacyNote ?? "",
  ].join(" \n");
}

/**
 * Every outcome copy block in the table, whether or not a persona happens to
 * reach it.
 *
 * Scanning only the copy the personas touch leaves the rest unguarded: a
 * recommendation planted on a route no persona visits would ship unnoticed. The
 * audit is over the table itself, so coverage does not depend on the test set.
 */
export function allOutcomeCopy(): { key: string; why: string; text: string }[] {
  return Object.entries(COPY).map(([key, block]) => ({
    key,
    why: block.why,
    text: outcomeText(block),
  }));
}
