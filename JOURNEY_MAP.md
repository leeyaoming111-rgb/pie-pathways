# Journey map

Every intent, the route it resolves to, its sub-route, the outcome card the
visitor sees, and where the primary action sends them.

Generated from the code — the routes below are the ones `resolvePathway()` and
`classify()` actually produce across every persona, every demo scenario, and
every guided branch. All 19 intents in the enum are reachable.

`Human review` marks the outcomes that set `human_review_required: true`.
`personal_advice_generated` is `false` on every row, without exception.

## Every outcome

| Intent | Meaning | Route | Sub-route | Outcome card | Primary action | Human review |
| --- | --- | --- | --- | --- | --- | --- |
| `kiwisaver_join` | Join KiwiSaver | `kiwisaver` | `kiwisaver.join` | Join the Pie KiwiSaver Scheme | `/invest/kiwisaver` | no |
| `kiwisaver_transfer` | Transfer KiwiSaver to Pie | `kiwisaver` | `kiwisaver.transfer` | Move your KiwiSaver to Pie | `/invest/kiwisaver` | no |
| `kiwisaver_manage` | Manage an existing KiwiSaver account | `kiwisaver` | `kiwisaver.manage` | Manage your KiwiSaver account | `/investor-portal` | no |
| `kiwisaver_fund_choice` | Choosing a KiwiSaver fund | `kiwisaver` | `kiwisaver.fund_chooser` | Use the Fund Chooser | `/kiwisaver` | no |
| `funds_info` | Learning about the investment funds | `insights` | `—` | Market Insights | `/Market-Insights` | no |
| `funds_info` | Learning about the investment funds | `funds` | `—` | Pie's Investment Funds | `/Investment-Funds` | no |
| `funds_info` | Learning about the investment funds | `performance` | `—` | Fund performance | `/Performance` | no |
| `funds_apply` | Applying to invest in a fund | `funds` | `funds.apply_by_form` | Apply by form | `/Investor-Documents` | **yes** |
| `funds_apply` | Applying to invest in a fund | `funds` | `funds.apply_online` | Apply online | `/invest` | no |
| `advice_enquiry` | Investment advice enquiry | `advice` | `—` | Investment Advice | `/Investment-Funds/Investment-Advice` | no |
| `advice_enquiry` | Investment advice enquiry | `contact` | `—` | Talk to Pie's team | `/contact-us` | no |
| `wealth_enquiry` | Private wealth enquiry | `wealth` | `—` | Pie Wealth | `/Wealth-Management` | no |
| `service_portal` | Investor Portal access | `documents` | `documents.portal` | Investor Portal access | `/investor-portal` | no |
| `service_details` | Update personal details | `documents` | `documents.forms` | Find the right form | `/Investor-Documents` | no |
| `service_direct_debit` | Direct debit or bank account change | `documents` | `documents.forms` | Find the right form | `/Investor-Documents` | no |
| `service_fund_switch` | Switch funds | `documents` | `documents.forms` | Find the right form | `/Investor-Documents` | no |
| `service_add_withdraw` | Add to or withdraw from an investment | `documents` | `documents.forms` | Find the right form | `/Investor-Documents` | no |
| `forms_sensitive` | Sensitive request needing a person | `contact` | `contact.sensitive` | Pie's team will take this from here | `/contact-us` | **yes** |
| `forms_standard` | Standard form request | `documents` | `documents.forms` | Find the right form | `/Investor-Documents` | no |
| `complaint_fraud_identity` | Complaint, fraud or identity concern | `contact` | `contact.sensitive` | Pie's team will take this from here | `/contact-us` | **yes** |
| `general_unclear` | Not yet clear | `clarify` | `—` | (asks a clarifying question) | `—` | no |
| `general_unclear` | Not yet clear | `contact` | `—` | Talk to Pie's team | `/contact-us` | **yes** |
| `general_unclear` | Not yet clear | `contact` | `contact.sensitive` | Pie's team will take this from here | `/contact-us` | **yes** |
| `adversarial_injection` | Instruction-injection attempt | `funds` | `—` | Pie's Investment Funds | `/Investment-Funds` | no |
| `pii_disclosure` | Account identifier disclosed | `contact` | `contact.privacy_safe` | Let's not do this here | `/contact-us` | **yes** |

## Reading the table

**One intent can serve several routes.** `funds_info` is the clearest case: the
visitor wants to know something about the funds, and the route is wherever that
information lives. Commentary and "how do you pick companies" go to Market
Insights; "how have they done" goes to Performance; everything else goes to the
funds page. The intent records what they want; the route records where it is.

**One route serves several intents.** Everything that is handled on paper —
details, direct debits, switches, top-ups, withdrawals, emigration, retirement —
lands on `documents/documents.forms`. The sub-route is what distinguishes a
form request from portal access.

**`clarify` is not a destination.** It is the state where the router has decided
it does not know enough. It produces a question instead of an outcome card, and
it is the only state that never carries a sub-route.

## The three outcomes that carry the most weight

### `funds.apply_by_form` — the centrepiece

Trusts, companies, minors aged 17 and under, and non-standard joint arrangements
**cannot apply online**. This is a verified fact from Pie's own `/invest` page,
and it is the single most useful thing this router knows.

They are sent to the downloadable form and the applications inbox, with a
checklist: contact details for everyone who signs, identification and an NZ bank
account in the same name(s), an IRD or TIN number, and a mobile number per
applicant. `human_review_required: true`.

Reached from the guided flow (Funds → any non-personal structure → Apply), from
the "Trust in managed funds" demo chip, and from free text — holdout persona
`hold-03` exercises it on wording the classifier never saw.

### `kiwisaver.fund_chooser` — the question we refuse to answer

"Which fund should I be in?" is the question a router most wants to answer and
most must not. It goes to Pie's existing Fund Chooser, which asks about goals,
life stage and timeframe properly, with an adviser as the alternative.

The CI gate enforces this from the other direction: any outcome copy naming a
fund as an instruction fails the build.

### `contact.sensitive` — the compassionate hand-off

Death, serious illness, hardship, market anxiety, complaints, fraud and identity
all reach a person, with a visible "A person will pick this up" banner and the
escalation contacts on the card: 0800 586 657, +64 9 486 1701,
clients@piefunds.co.nz.

`classify()` checks for these **before anything else**, so a message that mixes a
bereavement with a routine bank-account change still reaches a person. This is
verified in the browser, not just in the harness.

## The guided flow

```
Step 1  Relationship    new · existing client · asking on someone's behalf · not sure
Step 2  Objective       KiwiSaver · invest outside KiwiSaver · tailored wealth
                        · manage an existing investment · find a form · describe my situation
Step 3  Adaptive        branches below
```

| Branch | Questions | Where it lands |
| --- | --- | --- |
| KiwiSaver | join / transfer / manage / which fund → (manage: is it with Pie?) | `/invest/kiwisaver`, transfer info, portal, or the Fund Chooser |
| Funds | who is investing → reading / applying / talking | `funds.apply_by_form` for any non-personal structure, `/invest` for standard individuals, advice for "talk first" |
| Wealth | individual / trust / entity → portfolio / planning / general → optional range | Trusts, entities, tailored requests and NZ$1m+ go to Pie Wealth; others to advice or a general enquiry |
| Existing client | portal / details / direct debit / switch / add or withdraw / other | Portal guide, or Investor Documents; "other" goes to a person |
| Form or request | deceased / illness / hardship / emigration / retirement / change of details / other | Deceased, illness, hardship and "other" go to `contact.sensitive`; emigration and retirement to the forms library |
| Describe my situation | free text | `classify()` — below the confidence floor it asks instead of routing |

The optional wealth range question is labelled **"Routing only — not advice or
eligibility confirmation"** and can be declined without blocking the outcome.

## Every outcome card carries

1. The route title and a one-sentence summary
2. **Why this route?** — under 80 words, plain English, counted by the harness
3. **What to have ready** — never an account number, never an ID document
4. **What happens next** — fixed wording on every card:
   1. Complete the relevant online action or enquiry
   2. Pie reviews any required information
   3. The relevant team gets in touch if needed
5. A primary action to a verified URL, and "Speak to our team"
6. *General information only — not personal financial advice.*

Returns are never quoted in outcome copy. `/Performance` is linked instead.
