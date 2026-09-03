/**
 * Pie Pathways — configuration.
 *
 * Every threshold here is DATA, not a hardcoded literal buried in logic, and
 * every one carries its provenance from `pie-funds-brand.md`. `uiSafe: false`
 * means the value may be used in routing/test logic but must NEVER appear in
 * user-facing copy, because it is unverified.
 */

export type Provenance = "verified" | "scraped" | "unverified";

export interface Threshold {
  /** Value in NZD. */
  readonly value: number;
  /** Short label for developer surfaces. */
  readonly label: string;
  /** Exactly how this may be written in UI copy. `null` when it may not be. */
  readonly uiCopy: string | null;
  readonly source: Provenance;
  /** True only when `source` permits the number to appear on screen. */
  readonly uiSafe: boolean;
  readonly note: string;
}

export type ThresholdKey =
  | "fundsMinimum"
  | "investmentAdvice"
  | "pieWealth"
  | "chairmansFund";

export const THRESHOLDS: Record<ThresholdKey, Threshold> = {
  /** Investment Funds minimum — UNVERIFIED. Logic only, never UI copy. */
  fundsMinimum: {
    value: 25_000,
    label: "Investment Funds minimum",
    uiCopy: null,
    source: "unverified",
    uiSafe: false,
    note: "From scrape only; not confirmed on the live funds page. Do not state as fact anywhere a visitor can read it.",
  },
  /** Investment Advice tier — consistent across scraped pages. */
  investmentAdvice: {
    value: 250_000,
    label: "Investment Advice tier",
    uiCopy: "NZ$250,000+",
    source: "scraped",
    uiSafe: true,
    note: "Consistent across scraped pages. Used for routing bands only — never as an eligibility statement.",
  },
  /** Pie Wealth — verified on /Wealth-Management. */
  pieWealth: {
    value: 1_000_000,
    label: "Pie Wealth",
    uiCopy: "NZ$1m+",
    source: "verified",
    uiSafe: true,
    note: 'Verified: "best suited to individuals, family trusts and entities with $1 million or more to invest".',
  },
  /** Chairman's Fund — verified minimum investment. */
  chairmansFund: {
    value: 500_000,
    label: "Chairman's Fund minimum investment",
    uiCopy: "NZ$500,000",
    source: "verified",
    uiSafe: true,
    note: "Verified minimum investment for the Chairman's Fund.",
  },
} as const;

/** Guard used by UI components before printing any threshold. */
export function uiThreshold(key: ThresholdKey): string {
  const t = THRESHOLDS[key];
  if (!t.uiSafe || t.uiCopy === null) {
    throw new Error(
      `Threshold "${String(key)}" is ${t.source} and must not appear in UI copy.`,
    );
  }
  return t.uiCopy;
}

/** Escalation contacts — all verified in pie-funds-brand.md §7. */
export const CONTACTS = {
  phoneNz: "0800 586 657",
  phoneInternational: "+64 9 486 1701",
  clientEmail: "clients@piefunds.co.nz",
  /** Named, not fabricated: the brand extract confirms an applications inbox exists but not its address. */
  applicationsInbox: "Pie's applications inbox (address is on the form)",
} as const;

/** Confidence below this never routes — it asks a clarifying question instead. */
export const CONFIDENCE_FLOOR = 0.6;

/** Compliance strings. Single source so they cannot drift between surfaces. */
export const COMPLIANCE = {
  footer: "General information only — not personal financial advice.",
  prototype:
    "Concept prototype. General information only — not personal financial advice.",
  unknownRequirement:
    "Pie's team can confirm what applies to your situation.",
  reviewNotice: "Pie's team reviews each request.",
  privacyNote:
    "Please don't share account numbers, PM numbers, passwords or ID documents here. Those belong in the Investor Portal or with Pie's team.",
  routingOnly:
    "Routing only — not advice or eligibility confirmation.",
} as const;

/** The three steps shown on every outcome card. Wording is fixed by spec. */
export const WHAT_HAPPENS_NEXT: readonly string[] = [
  "Complete the relevant online action or enquiry",
  "Pie reviews any required information",
  "The relevant team gets in touch if needed",
] as const;
