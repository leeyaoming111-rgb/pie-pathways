# Backlog

Ideas raised while building, deliberately **not** built. The spec was explicit
that scope discipline mattered more than completeness, so each of these is
recorded rather than implemented.

Nothing here is a defect. Known limitations of what *was* built are in the last
section.

## Would improve the demo

- **Example prompts for the free-text branch.** Right now the demo-er has to
  type a paragraph live. Three or four clickable example messages — a
  bereavement, a trust, an ambiguous one-liner — would make the P1 branch as
  easy to drive as the six chips. Deliberately left out: the six scenario chips
  are the specified demo driver.
- **A shareable link per outcome.** Encoding `JourneyState` in the URL would let
  someone send "here's the trust case" rather than describing the clicks.
- **Mobile pass.** The layout is responsive and was checked at desktop width,
  but no deliberate design work was done at ~390px.
- **Back navigation from a demo chip.** Chips clear the history stack, so
  "Change my last answer" is unavailable after one. Restarting works.

## Would strengthen the evaluation

- **A holdout written by someone else.** The current holdout is independent of
  tuning iterations but not of authorship — both sets came from the same author
  before the classifier existed. A set written by a Pie staff member, or drawn
  from real enquiry logs, would be materially stronger evidence.
- **Real enquiry volumes.** Every persona here is invented. Frequency-weighted
  metrics from actual traffic would change which errors matter.
- **Adversarial expansion.** One injection persona is not a red-team. Encoded
  payloads, multi-turn attempts, and instructions hidden in pasted text are all
  untested.
- **Inter-rater agreement on the labels.** Several personas have a defensible
  second answer — `dev-12` could be argued to `funds` rather than `insights`.
  Two independent labellers would quantify that.
- **Confidence calibration.** Confidence values are hand-assigned per rule, not
  fitted. They order cases sensibly and drive the clarify gate, but a 0.8 does
  not mean 80% correct, and the report should not be read as if it does.
- **Property-based testing of the classifier.** Fuzzing for crashes, and
  asserting the invariant that `personal_advice_generated` is never true, would
  cover inputs no persona describes.

## Would be needed for production

- **One live model run.** Every prompt-quality number here is mock-mode.
  Nothing about v1–v5 can be claimed until a real run happens.
- **Localisation and te reo Māori.** One persona opens with "kia ora" and the
  router handles it, but no interface copy is translated.
- **Accessibility audit.** Semantic HTML, visible focus, keyboard operation and
  `aria-live` regions are in place; no screen-reader testing or formal WCAG
  audit was done.
- **Analytics on the clarify path.** Which questions get asked most, and where
  people abandon, is the fastest route to improving the flow.
- **A staff view of escalations.** Explicitly out of scope, but every
  `human_review_required: true` outcome currently ends at a phone number.
- **Embeddable widget build.** The brand extract notes the real site is
  server-rendered DNN, so a self-contained script would ship more plausibly than
  a page rebuild.

## Known limitations of what was built

- **The scraper cannot reach the site.** piefunds.co.nz returns HTTP 403 to it.
  The scraper honours that rather than spoofing a browser User-Agent, so the
  live-scrape path is implemented and tested against synthetic input but has
  never run against the real site. The fixture path is unaffected.
- **Fund-card extraction is unproven.** It expects the documented
  name/timeframe/risk-rating shape and records an error rather than guessing
  otherwise — but that shape has never been tested against real markup.
- **The persona count runs over the suggested range.** 18 dev personas rather
  than 12–15, because covering all eight canonical routes plus every required
  case and edge case needed the extra ones. Coverage was judged the stronger
  constraint; the deviation is deliberate.
- **The recommendation scan is regex-based.** It looks for directive language
  near a fund name within a 90-character window. It is deliberately over-eager
  and will occasionally flag legitimate copy. It would not catch a
  recommendation phrased entirely in paraphrase.
- **Euclid Circular A is not bundled.** No licensed font files ship, so the
  stack falls back to Arial/system sans. Type weight carries the hierarchy
  instead.
