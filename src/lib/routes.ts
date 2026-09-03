/**
 * Canonical route registry — the single source of truth for destinations.
 *
 * URLs are taken verbatim from `pie-funds-brand.md` §5. Nothing here is
 * invented: if the brand extract did not confirm a page, it is not in this file.
 */

export const ROUTE_IDS = [
  "kiwisaver",
  "funds",
  "advice",
  "wealth",
  "performance",
  "insights",
  "documents",
  "contact",
] as const;

export type RouteId = (typeof ROUTE_IDS)[number];

/** The one non-destination state: ask a follow-up question instead of routing. */
export const CLARIFY = "clarify" as const;
export type Clarify = typeof CLARIFY;

/** Anything an outcome may resolve to. */
export type Destination = RouteId | Clarify;

export const SUB_ROUTES = [
  /** Trusts, companies, minors and non-standard joint accounts — form + email. */
  "funds.apply_by_form",
  /** "Which fund?" → Pie's existing Fund Chooser. We never recommend a fund. */
  "kiwisaver.fund_chooser",
  /** Death, serious illness, hardship, market anxiety, complaints, fraud, identity. */
  "contact.sensitive",
  /** Joining KiwiSaver — the online application. */
  "kiwisaver.join",
  /** Transferring an existing KiwiSaver to Pie. */
  "kiwisaver.transfer",
  /** Managing an existing Pie KiwiSaver account. */
  "kiwisaver.manage",
  /** Standard individual managed-funds application. */
  "funds.apply_online",
  /** Reading about the funds before applying. */
  "funds.info",
  /** Investor Portal login / lockout / how-to. */
  "documents.portal",
  /** Forms library — change of details, direct debit, withdrawals, emigration. */
  "documents.forms",
  /** Privacy-safe hand-off when someone pastes an account identifier. */
  "contact.privacy_safe",
] as const;

export type SubRoute = (typeof SUB_ROUTES)[number];

export interface RouteDefinition {
  readonly id: RouteId;
  /** Human title used as the outcome card heading. */
  readonly title: string;
  /** Verified path on piefunds.co.nz. */
  readonly url: string;
  /** Label for the primary action button. Imperative, per Pie's voice. */
  readonly actionLabel: string;
  /** One sentence, plain English, no claims. */
  readonly summary: string;
}

export const ROUTES: Record<RouteId, RouteDefinition> = {
  kiwisaver: {
    id: "kiwisaver",
    title: "Pie KiwiSaver Scheme",
    url: "/kiwisaver",
    actionLabel: "Go to KiwiSaver",
    summary:
      "Everything about the Pie KiwiSaver Scheme — the four funds, how to join, and the Fund Chooser tool.",
  },
  funds: {
    id: "funds",
    title: "Investment Funds",
    url: "/Investment-Funds",
    actionLabel: "Explore Investment Funds",
    summary:
      "Pie's actively managed investment funds, grouped by Australasian, Global, and Diversified and Fixed Income.",
  },
  advice: {
    id: "advice",
    title: "Investment Advice",
    url: "/Investment-Funds/Investment-Advice",
    actionLabel: "Read about Investment Advice",
    summary:
      "Pie's investment advice service, for investors who want a conversation before they invest.",
  },
  wealth: {
    id: "wealth",
    title: "Pie Wealth",
    url: "/Wealth-Management",
    actionLabel: "Talk to the Wealth team",
    summary:
      "A boutique private wealth service for individuals, family trusts and entities.",
  },
  performance: {
    id: "performance",
    title: "Fund Performance",
    url: "/Performance",
    actionLabel: "View performance",
    summary:
      "Published performance figures for Pie's funds, with the periods and sources they are reported against.",
  },
  insights: {
    id: "insights",
    title: "Market Insights",
    url: "/Market-Insights",
    actionLabel: "Read Market Insights",
    summary:
      "Pie's market commentary, including the monthly “A message from Mike” and the Slice of Pie newsletter.",
  },
  documents: {
    id: "documents",
    title: "Investor Documents",
    url: "/Investor-Documents",
    actionLabel: "Open Investor Documents",
    summary:
      "Forms, Product Disclosure Statements and reports, including the forms that have to be completed on paper.",
  },
  contact: {
    id: "contact",
    title: "Talk to Pie's team",
    url: "/contact-us",
    actionLabel: "Contact Pie",
    summary:
      "A direct line to Pie's client services team, by phone or email.",
  },
};

/** Additional verified URLs that are actions rather than routes. */
export const ACTION_URLS = {
  kiwisaverApply: "/invest/kiwisaver",
  fundsApplyOnline: "/invest",
  investorPortalGuide: "/investor-portal",
  investorDocuments: "/Investor-Documents",
  performance: "/Performance",
  about: "/About-Us",
} as const;

/** Header navigation — verified URLs only. */
export const NAV_LINKS: readonly { label: string; href: string }[] = [
  { label: "KiwiSaver", href: "/kiwisaver" },
  { label: "Investment Funds", href: "/Investment-Funds" },
  { label: "Wealth Management", href: "/Wealth-Management" },
  { label: "Insights", href: "/Market-Insights" },
] as const;

export const SITE_ORIGIN = "https://piefunds.co.nz";

/** Absolute URL for an outbound link. All demo links point at the real site. */
export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}

export function isRouteId(value: string): value is RouteId {
  return (ROUTE_IDS as readonly string[]).includes(value);
}

export function isSubRoute(value: string): value is SubRoute {
  return (SUB_ROUTES as readonly string[]).includes(value);
}

export function isDestination(value: string): value is Destination {
  return value === CLARIFY || isRouteId(value);
}
