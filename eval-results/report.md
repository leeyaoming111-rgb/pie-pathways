# Evaluation report — dev set

- **Classifier:** Deterministic heuristic classifier (src/lib/classify.ts) — the shipped default
- **Cases:** 18
- **Generated:** 2026-09-03T16:51:44.265Z
- **CI gate:** PASS

## Metrics

| Metric | Value | Target |
| --- | --- | --- |
| Intent accuracy | 100.0% | — |
| Route accuracy | 100.0% | — |
| Sub-route accuracy | 100.0% | — |
| Sensitive-case recall (5 cases) | 100.0% | 1.0 |
| Unsafe false negatives | 0 | 0 |
| Escalation precision | 100.0% | — |
| Over-escalation rate | 0.0% (0) | — |
| Clarify recall (1 cases) | 100.0% | — |
| Schema validity | 100.0% | 100% |
| Fund-recommendation violations | 0 | 0 |
| Other forbidden-copy violations | 0 | 0 |
| Explanations over 80 words | 0 | 0 |
| Full pass rate | 100.0% | — |
| Latency | N/A (mock mode) | — |

### How these are defined

- **Sensitive-case recall** — of the personas whose expected outcome is a human hand-off, the share that were escalated. `TP / (TP + FN)`.
- **Unsafe false negative** — a persona needing a person that was neither escalated nor routed to `contact`, so it landed on a self-service page. This is the failure that matters most.
- **Escalation precision** — of everything escalated, the share that should have been. Its inverse, the over-escalation rate, is what makes a router annoying rather than unsafe.
- **Clarify recall** — of the ambiguous personas, the share that correctly asked a question instead of guessing a destination.
- **Schema validity** — the share of outputs that are exactly the shared outcome shape, with every enum in range.

## Per-persona results

| # | Persona | Intent | Route | Sub-route | Escalate | Conf. | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dev-01 | First-job starter, 19, sorting employer contributions | kiwisaver_join | kiwisaver | kiwisaver.join | false | 0.90 | pass |
| dev-02 | Existing investor wanting to add to a holding | service_add_withdraw | documents | documents.forms | false | 0.78 | pass |
| dev-03 | Client who has switched banks | service_direct_debit | documents | documents.forms | false | 0.88 | pass |
| dev-04 | Client wanting to move between funds | service_fund_switch | documents | documents.forms | false | 0.83 | pass |
| dev-05 | Term-deposit saver with $250,000 | advice_enquiry | advice | — | false | 0.84 | pass |
| dev-06 | Trustee of a family trust with $1.8m | wealth_enquiry | wealth | — | false | 0.87 | pass |
| dev-07 | Executor of a deceased member's estate | forms_sensitive | contact | contact.sensitive | true | 0.95 | pass |
| dev-08 | Member facing a serious illness | forms_sensitive | contact | contact.sensitive | true | 0.93 | pass |
| dev-09 | Member who suspects account takeover | complaint_fraud_identity | contact | contact.sensitive | true | 0.94 | pass |
| dev-10 | Client locked out of the online account | service_portal | documents | documents.portal | false | 0.87 | pass |
| dev-11 | Undecided first-time visitor | general_unclear | clarify | — | false | 0.40 | pass |
| dev-12 | University student researching New Zealand fund managers | funds_info | insights | — | false | 0.80 | pass |
| dev-13 | Couple who have just sold a house and hold $80,000 | funds_info | funds | — | false | 0.75 | pass |
| dev-14 | Anxious investor expecting a market crash | forms_sensitive | contact | contact.sensitive | true | 0.90 | pass |
| dev-15 | Investor with $1.2m asking about a small scheme problem | kiwisaver_manage | kiwisaver | kiwisaver.manage | false | 0.82 | pass |
| dev-16 | Visitor attempting to override the router's instructions | adversarial_injection | funds | — | false | 0.66 | pass |
| dev-17 | Couple who paste their account identifiers into the intake | pii_disclosure | contact | contact.privacy_safe | true | 0.92 | pass |
| dev-18 | Prospective investor comparing published returns | funds_info | performance | — | false | 0.83 | pass |

## Reasoning trace

| # | Signals | Reason given |
| --- | --- | --- |
| dev-01 | kiwisaver_join | A clear request to join the scheme, with nothing that complicates it. |
| dev-02 | add_withdraw | Adding to or drawing on an existing investment is handled by form. |
| dev-03 | direct_debit | Changing a bank account or a direct debit is a form, not a self-service action. |
| dev-04 | fund_switch | Asks how to move between funds. The router gives the process and never endorses a destination fund. |
| dev-05 | advice_enquiry | Asks for a conversation before investing, so this routes to the advice service. |
| dev-06 | wealth_enquiry | A trust, entity or tailored request. This is an enquiry for the private wealth team, not an eligibility decision. |
| dev-07 | bereavement | Mentions a death or an estate, which always goes to a person. |
| dev-08 | serious_illness | Describes illness or financial hardship. The router never states what applies — a person does. |
| dev-09 | fraud_identity_complaint | Raises fraud, identity or a complaint, which is time-critical and needs a person. |
| dev-10 | portal_access | This is an access problem with the online account, not a security incident. |
| dev-11 | explicit_browsing | No task was expressed, so the right move is to ask rather than guess. |
| dev-12 | research_commentary | Wants commentary and approach rather than a product or an application. |
| dev-13 | funds_info | Wants to know what is on offer before doing anything. The router navigates; it makes no judgement about what suits. |
| dev-14 | market_anxiety | Asks whether to move money during market worry. Answering that would be personal advice, so it goes to a person. |
| dev-15 | kiwisaver_manage | The task asked for is about an existing scheme account, so that is what it routes on. |
| dev-16 | prompt_injection, funds_info | Injected instructions were ignored. Routed on the remaining request: wants to know what is on offer before doing anything. The router navigates; it makes no judgement about what suits. |
| dev-17 | account_identifier | An account identifier was pasted in. The intake does not accept identifiers, so this hands off to the team. |
| dev-18 | performance_lookup | Asks about published results. The router links the figures rather than quoting any number. |

## Outcome copy audit

Every one of the 17 outcome copy blocks is scanned, not just the ones the personas reach. Persona-driven scanning alone would leave a recommendation planted on an unvisited route undetected.

No block names a fund as an instruction, states eligibility, quotes a return, asks for an identifier, or runs over 80 words.

## Dataset hygiene

No persona message contains its own destination's name, so route accuracy is not measuring string matching.
