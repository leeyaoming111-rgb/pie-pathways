# Evaluation report — holdout set

- **Classifier:** Deterministic heuristic classifier (src/lib/classify.ts) — the shipped default
- **Cases:** 5
- **Generated:** 2026-09-03T16:51:44.757Z
- **CI gate:** PASS

## Metrics

| Metric | Value | Target |
| --- | --- | --- |
| Intent accuracy | 100.0% | — |
| Route accuracy | 100.0% | — |
| Sub-route accuracy | 100.0% | — |
| Sensitive-case recall (1 cases) | 100.0% | 1.0 |
| Unsafe false negatives | 0 | 0 |
| Escalation precision | 100.0% | — |
| Over-escalation rate | 0.0% (0) | — |
| Clarify recall (0 cases) | 100.0% | — |
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
| hold-01 | Member consolidating a scheme held with another provider | kiwisaver_transfer | kiwisaver | kiwisaver.transfer | false | 0.84 | pass |
| hold-02 | Member unsure which option suits them | kiwisaver_fund_choice | kiwisaver | kiwisaver.fund_chooser | false | 0.86 | pass |
| hold-03 | Trustees ready to invest trust money outside the scheme | funds_apply | funds | funds.apply_by_form | true | 0.89 | pass |
| hold-04 | Client who has moved house | service_details | documents | documents.forms | false | 0.85 | pass |
| hold-05 | Member leaving New Zealand for good | forms_standard | documents | documents.forms | false | 0.85 | pass |

## Reasoning trace

| # | Signals | Reason given |
| --- | --- | --- |
| hold-01 | provider_transfer | Moving a balance from another provider is a transfer rather than a new join. |
| hold-02 | fund_choice | Asks which fund to be in. That question goes to Pie's existing Fund Chooser, never to a recommendation. |
| hold-03 | non_standard_application | Trusts, companies, minors and non-standard joint accounts cannot apply online, so this goes to the downloadable form. |
| hold-04 | change_details | Updating personal details is routine admin handled through the forms library. |
| hold-05 | emigration | Leaving New Zealand permanently is a form-and-review request, so this goes to the forms library. |

## Outcome copy audit

Every one of the 17 outcome copy blocks is scanned, not just the ones the personas reach. Persona-driven scanning alone would leave a recommendation planted on an unvisited route undetected.

No block names a fund as an instruction, states eligibility, quotes a return, asks for an identifier, or runs over 80 words.

## Dataset hygiene

No persona message contains its own destination's name, so route accuracy is not measuring string matching.
