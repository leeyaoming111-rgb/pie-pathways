# Pie Pathways

A concept routing prototype for **Pie Funds**. It points a website visitor at the
right page, form or team — and stops there. It never recommends a fund, never
confirms eligibility, and never answers "what should I do with my money?"

> **Concept prototype.** Not affiliated with or endorsed by Pie Funds. General
> information only — not personal financial advice. Built from a documented
> brand extract (`pie-funds-brand.md`), not from Pie's design files or brand
> assets.

---

## Why this exists

Two things are being demonstrated, in order:

1. **The demo** — a deterministic guided flow that routes a visitor in about a
   minute, with six clickable scenarios and an outcome card for every
   destination.
2. **The method** — an evaluation harness proving the router does not mishandle
   the cases that matter, and a versioned-prompt layer showing what would have
   to clear before a model-backed version replaced it.

The order is the point. The shipped path is the one that can be measured.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

Then click **Start**, or use one of the six demo scenario chips. **Show demo
logic** on any outcome opens the developer panel.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run eval` | Dev personas through the shipped classifier; writes `eval-results/` |
| `npm run eval -- --set=holdout` | The holdout set — see the discipline note below |
| `npm run eval:ci` | Same as `eval`, exits non-zero if the safety gate fails |
| `npm run eval -- --prompt=v3` | A prompt variant against mock fixtures |
| `npm run eval:compare -- --base=v2 --candidate=v3` | Per-persona and net deltas between two classifiers |
| `npm run verify` | lint + typecheck + build + eval:ci |
| `npm run build:routes` | Optional live scrape (see *Knowledge base*) |
| `npm run sync` | Regenerates the knowledge-source module; runs automatically before `dev` and `build` |

## Architecture

Everything resolves to one shape, whether it came from the guided questions, a
demo chip, or free text:

```ts
{ intent, route, sub_route?, confidence,
  human_review_required, personal_advice_generated, missing_fields[] }
```

| File | Role |
| --- | --- |
| `src/lib/routes.ts` | The eight canonical routes and their verified URLs, plus `clarify` |
| `src/lib/intents.ts` | The 19 intents, and the sensitive set the harness measures against |
| `src/lib/config.ts` | Thresholds as data with provenance, contacts, compliance strings |
| `src/lib/pathways.ts` | `resolvePathway(state)` — the pure guided state machine |
| `src/lib/classify.ts` | `classify(message)` — the deterministic heuristic classifier |
| `src/lib/outcomes.ts` | Every piece of visitor-facing outcome copy, in one place |
| `src/lib/validate.ts` | Schema validation and the no-recommendation scan |

The app is client-side at runtime: no backend, no auth, no database, and no
network calls. Everything it knows is bundled at build time.

### Two deliberate design choices

**All outcome copy lives in one module.** Not for tidiness — it is what makes the
safety scan possible. A scan can only cover copy it can enumerate.

**Distress is checked before anything else.** `classify()` is an ordered cascade,
and the order is a safety decision. A message that mentions a bereavement *and*
asks to change a bank account reaches a person. Injected instructions are
stripped before routing is attempted; account identifiers are refused after
that.

## Knowledge base

The app reads `data/routes.fixture.json`, built from `pie-funds-brand.md` and
committed. It contains no invented figures: anything the brand extract did not
confirm is `null`.

`npm run build:routes` optionally scrapes six live pages into `data/routes.json`,
which is used **only if it is present and passes validation**. All three paths
are tested: valid file used, invalid file rejected, absent file falls back to the
fixture. The developer panel reports which is in use.

At the time of writing, piefunds.co.nz returns **HTTP 403** to the scraper —
the site's own bot protection, not a network problem. The scraper records that
and stops rather than spoofing a browser User-Agent, and writes no file when
nothing was reachable. **The app has never depended on the scrape.**

## Evaluation

`npm run eval` runs the persona set through the shipped classifier and writes
`eval-results/latest.json`, `eval-results/report.md` and a compact
`eval-results/summary.json` that the app's own "how this would be hardened"
panel reads — so the panel cannot drift from the harness.

### Current results

| Metric | Dev (18 cases) | Holdout (5 cases) |
| --- | --- | --- |
| Intent accuracy | 100% | 100% |
| Route accuracy | 100% | 100% |
| Sensitive-case recall | 100% | 100% |
| Unsafe false negatives | 0 | 0 |
| Over-escalation rate | 0% | 0% |
| Schema validity | 100% | 100% |

### The CI gate

`npm run eval:ci` fails the build on three conditions, all safety rather than
accuracy. A router may be wrong about which page you wanted; it may not:

1. leave a persona who needs a person on a self-service page,
2. emit output that is not exactly the shared outcome shape,
3. name a fund as an instruction in any outcome copy.

**The gate has been shown to fail.** Planting `"We recommend the Growth fund"`
into the Fund Chooser copy exits non-zero; removing it exits zero. That test
also found a real hole: the scan originally only covered copy the personas
happened to reach, so a recommendation on an unvisited route went undetected. It
now audits all 17 copy blocks regardless of the test set.

The scan is deliberately over-eager. It flagged the legitimate disclaimer
"Nothing here confirms what you qualify for". The copy was reworded rather than
the rule loosened — for a safety gate a false positive costs a sentence and a
false negative costs a customer.

### Holdout discipline

`data/personas.holdout.json` is final evidence, not a tuning signal. It covers
the five intents the dev set never exercises, so it tests genuinely unseen
behaviour. It was run **once**, at the end, and passed 5/5.

An honest caveat: the holdout is independent of *tuning iterations*, not of
*authorship*. Both sets were written by the same author before the classifier
existed. That is weaker evidence than a set written by someone else, and it
should be treated as such.

## Prompt experiments (mock mode)

`prompts/v1.txt` … `v5.txt` change one thing at a time. `mocks/llm-responses.json`
holds 90 synthetic fixtures keyed by `prompt_version:persona_id`.

| Version | Adds | Sensitive recall | Schema | Gate |
| --- | --- | --- | --- | --- |
| v1 | Role and labels | 40% | 88.9% | FAIL |
| v2 | Strict JSON schema | 40% | 100% | FAIL |
| v3 | Boundary rules | 100% | 100% | PASS |
| v4 | Few-shot examples | 100% | 100% | PASS |
| v5 | Rationale, no fabrication | 100% | 100% | PASS |

Two canaries are deliberate: v1 returns malformed output, and v2 returns a
schema-valid, correctly-routed answer whose *explanation text* recommends a
fund. A safety gate never shown to fail is decoration.

### Honesty clause

**Mock-mode results validate harness plumbing and nothing else.** The fixtures
are synthetic. They demonstrate that the validator catches malformed output,
that the gate trips on a recommendation, and that `eval:compare` reports real
deltas. They say nothing about how any actual model would perform on these
prompts. Any claim about prompt quality requires at least one live run, and
this build makes none: live calls are out of scope, and `USE_LLM_EVAL=true`
fails with a clear message rather than pretending to have measured something.

## Compliance rules encoded

- Every outcome card carries "General information only — not personal financial
  advice."
- No fund is ever named as a recommendation. Fund choice goes to Pie's existing
  Fund Chooser or to an adviser.
- Eligibility, approval and withdrawal outcomes are never stated. Unknowns route
  to "Pie's team can confirm what applies to your situation."
- The NZ$25,000 Investment Funds minimum is unverified. It is marked
  `uiSafe: false` in `config.ts` and `uiThreshold()` **throws** if anything tries
  to print it.
- The intake never accepts account numbers, PM numbers, passwords or ID
  documents — and never echoes one back, including in the developer panel.
- Route explanations stay under 80 words. The harness counts them.

## Brand

Styled from `pie-funds-brand.md`: `#EFEFED`/`#F5F5F5` backgrounds, `#FFFFFF`
cards, `#1D1D1F` text, `#474A47` charcoal sections. `#94F587` Pie green is used
for fills, buttons and chips only — it fails contrast as text on white.

Euclid Circular A is named first in the font stack and falls back to
Arial/system sans. No licensed font files ship here, and no geometric Google
font is substituted for the brand font. The wordmark is styled text; the real
logo is never redrawn.

## What is not here

Live LLM calls, live scraping as a dependency, a backend, auth, a database, a
staff ops inbox, and real Pie brand assets. All deliberate. Ideas raised during
the build and left out are recorded in [BACKLOG.md](./BACKLOG.md).

See [JOURNEY_MAP.md](./JOURNEY_MAP.md) for every intent → route → sub-route →
outcome.
