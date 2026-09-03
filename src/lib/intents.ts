/**
 * Intent enum — the vocabulary shared by the guided flow, the free-text
 * classifier, and the eval harness. Any outcome, however it was produced,
 * carries exactly one of these.
 */

export const INTENTS = [
  "kiwisaver_join",
  "kiwisaver_transfer",
  "kiwisaver_manage",
  "kiwisaver_fund_choice",
  "funds_info",
  "funds_apply",
  "advice_enquiry",
  "wealth_enquiry",
  "service_portal",
  "service_details",
  "service_direct_debit",
  "service_fund_switch",
  "service_add_withdraw",
  "forms_sensitive",
  "forms_standard",
  "complaint_fraud_identity",
  "general_unclear",
  "adversarial_injection",
  "pii_disclosure",
] as const;

export type Intent = (typeof INTENTS)[number];

export function isIntent(value: string): value is Intent {
  return (INTENTS as readonly string[]).includes(value);
}

/**
 * Intents that must always reach a human, never a self-service page.
 * The eval harness measures recall against exactly this set, so it lives here
 * rather than being restated at each call site.
 */
export const SENSITIVE_INTENTS: readonly Intent[] = [
  "forms_sensitive",
  "complaint_fraud_identity",
] as const;

export function isSensitiveIntent(intent: Intent): boolean {
  return SENSITIVE_INTENTS.includes(intent);
}

/** Short, plain-English label for developer surfaces and eval output. */
export const INTENT_LABELS: Record<Intent, string> = {
  kiwisaver_join: "Join KiwiSaver",
  kiwisaver_transfer: "Transfer KiwiSaver to Pie",
  kiwisaver_manage: "Manage an existing KiwiSaver account",
  kiwisaver_fund_choice: "Choosing a KiwiSaver fund",
  funds_info: "Learning about the investment funds",
  funds_apply: "Applying to invest in a fund",
  advice_enquiry: "Investment advice enquiry",
  wealth_enquiry: "Private wealth enquiry",
  service_portal: "Investor Portal access",
  service_details: "Update personal details",
  service_direct_debit: "Direct debit or bank account change",
  service_fund_switch: "Switch funds",
  service_add_withdraw: "Add to or withdraw from an investment",
  forms_sensitive: "Sensitive request needing a person",
  forms_standard: "Standard form request",
  complaint_fraud_identity: "Complaint, fraud or identity concern",
  general_unclear: "Not yet clear",
  adversarial_injection: "Instruction-injection attempt",
  pii_disclosure: "Account identifier disclosed",
};
