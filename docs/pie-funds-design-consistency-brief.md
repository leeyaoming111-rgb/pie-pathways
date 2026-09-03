# Pie Funds — Design Consistency Brief

**Purpose:** Context document for building off the existing Pie Funds website (piefunds.co.nz), so new work matches the established look, layout, and tone. Written from a user interface (UI) designer's perspective.

**Method & limitations:** Compiled from live site content extraction (3 September 2026) plus brand imagery found via image search. **No screenshots were possible** — the tools used extract text and structure, not rendered pixels. Exact hex codes, font families, and pixel measurements are marked as *verify manually* throughout.

---

## 1. Brand identity at a glance

- **Who they are:** Boutique, New Zealand-owned KiwiSaver, investment fund and wealth manager, operating since 2007.
- **Positioning keywords:** boutique, personalised, hands-on, performance-led, long-term relationships, "we invest alongside you" (skin in the game — over $100m of staff/director/shareholder money invested).
- **Known taglines:** "Excellence Powered by Pie" (seen on brand collateral); "Start investing with Pie today" (page-level call to action).
- **Logo:** White circle containing a fan-like design with the word "Pie" — typically sits on black or dark backgrounds.
- **Tone of voice:** Warm but premium. First-person plural ("we"), direct address ("you"), plain English, no jargon. Confident, understated, relationship-oriented rather than salesy.

## 2. Colour palette

Evidence-based from brand imagery (logo card, promotional device mockups, award badges):

| Role | Colour | Evidence |
|---|---|---|
| Primary / background | Black / near-black | Logo card, black marble backgrounds on badges and promos |
| Primary text on dark | White | Logo, headlines |
| Accent | Green | "SLICE OF PIE" banner, "#1 returns" badge ribbon |
| Premium accent | Gold | Gold objects in lifestyle photography, award-style laurel badges |
| Texture | Black marble | Recurring background on campaign graphics |

*Verify manually: exact hex values — use a browser colour-picker on the live site before building. Do not guess.*

**Consistency rule:** dark-first aesthetic with white type; green is used sparingly as an accent/highlight, never as a background wash; gold signals awards and premium tiers.

## 3. Typography

- Clear hierarchy observed in page markup: page titles as H1, section titles as H2, card/item titles as H4.
- Fund names and article titles render as short, bold, headline-style labels (e.g. "Growth 2", "A message from Mike: …").
- Body copy is short — one to two sentences per block. Long paragraphs are avoided site-wide.

*Verify manually: exact font family/weights via browser developer tools (Inspector → Computed → font-family). Check whether headings and body use the same family at different weights, or a serif/sans pairing.*

## 4. Site structure and page layouts

### Global elements
- **Header/navigation:** top-level sections include Investment Funds, KiwiSaver, Wealth Management, Market Insights. *Verify: exact nav labels, order, and whether there is a persistent call-to-action button in the header.*
- **Footer patterns (repeated on multiple pages):** contact block (0800 586 657, +64 9 486 1701, email), "Subscribe to our monthly Slice of Pie newsletter" signup with Privacy Statement/Policy link, success state ("Thank you for signing up to our newsletter").

### Homepage
1. Hero: brand positioning statement ("boutique, New Zealand-owned… since 2007").
2. Value proposition section: personalised, performance-led approach.
3. Client testimonials (first-name attribution + client type, e.g. "Anna, Pie KiwiSaver Scheme Client").
4. Newsletter signup (Slice of Pie).

### Investment Funds page
1. Intro: "Our Investment Funds" — actively managed, differing risk/return profiles.
2. Fund cards grouped by category:
   - Australasian Funds (Growth, Growth 2, Dividend Growth, Emerging Companies)
   - Global Funds (Global Growth, Global Growth 2, Growth UK & Europe)
   - Diversified and Fixed Income Funds (Conservative, Chairman's, Fixed Income, Property & Infrastructure)
3. "Your guide to investing" download + disclosure statement call to action.
4. "Investor Insights" article feed (monthly "A message from Mike" series, dated).
5. "Stay connected" section (events, Annual Investor Updates).
6. Closing call to action banner: "Start investing with Pie today."

### KiwiSaver page
1. Promotional banner: refer-a-friend offer ($100 each).
2. Fund cards: Conservative, Balanced, Growth, Aggressive.
3. Fund Chooser Tool promo (guided questionnaire).
4. "It's easy to join" — numbered 4-step checklist (ID ready, IRD number ready, fill in details, done).
5. KiwiSaver Insights article feed.
6. Newsletter signup.

### Wealth Management page
1. Intro: boutique advice service, suited to $1m+ portfolios.
2. Embedded video feature (Head of Wealth explaining advice).
3. Team profiles: photo, name, role, post-nominal qualifications, "Meet [Name]" link, short professional + personal bio, disclosure statement link.
4. "Five investment pillars" section — research over hype, fundamentals, tailwinds, skin in the game, know the people, keep cash for a rainy day.
5. Contact block + newsletter signup.

## 5. Component inventory

Components that recur and should be built as reusable, consistent patterns:

- **Fund card:** fund name → one-line description → "Investment timeframe" (e.g. 5+ Years) → "Risk rating" (Lower / Medium / Higher). Optional status tag: "(Closed to new investment)".
- **Category header:** groups fund cards (e.g. "Australasian Funds").
- **Testimonial block:** quote + first name + client-type attribution.
- **Insights feed item:** date → bold title → 2–3 sentence summary.
- **Team profile card:** photo, name, role, credentials, expandable bio, disclosure link.
- **Call-to-action banner:** short imperative sentence ("Start investing with Pie today.").
- **Newsletter module:** "Slice of Pie" branding + privacy link + thank-you state.
- **Promo banner:** campaign offer (e.g. refer-a-friend $100).
- **Numbered steps list:** onboarding checklists ("It's easy to join").
- **Award/performance badge:** laurel/#1 graphic with green ribbon, used for performance claims (e.g. Morningstar #1 ranking).

## 6. Imagery and art direction

- **Photography style:** black-and-white or heavily desaturated financial/lifestyle imagery (Auckland skyline, market charts on devices, premium objects). High contrast, moody, premium.
- **Textures:** black marble recurs in campaign graphics and badges.
- **Devices:** product imagery shows the site on tablets/phones — clean mockup style with stylus/minimal props.
- **People:** team photography is professional but approachable (supports the "boutique, personal" positioning).
- **Rule of thumb:** if an image would look at home in a glossy annual report or a private bank's brochure, it fits. Bright, saturated stock photography does not.

## 7. Consistency checklist

When building, maintain all of the following:

1. Dark-first palette: black/dark backgrounds, white text, green accent, gold for awards.
2. Short copy blocks — one to two sentences; break longer ideas into separate sections.
3. The fund-card data pattern (name, description, timeframe, risk rating) — never drop timeframe or risk rating; these are compliance-relevant.
4. First-name testimonial attribution with client type.
5. Sentence-case headings with an editorial, plain-English voice.
6. Recurring calls to action using imperative verbs ("Start investing", "Talk to our team", "Download").
7. Newsletter module labelled "Slice of Pie" with privacy link and thank-you state.
8. Disclosure statements linked wherever advice or performance is discussed (regulatory requirement in New Zealand).
9. "Closed to new investment" status flags on relevant funds.
10. B&W/premium imagery treatment — no colourful stock photos.

## 8. Compliance and content conventions (NZ-specific)

- KiwiSaver and managed fund content carries disclosure obligations — keep Disclosure Statement links visible near any advice, performance, or signup content.
- Performance claims cite a source and period (e.g. "ranked by Morningstar for the year to 31 March 2026, after fees, before tax") and use footnote markers (¹).
- Risk ratings and investment timeframes appear on every fund — treat them as mandatory metadata, not decoration.
- Contact details (0800 number, +64 number, email) are consistently surfaced for a "talk to a human" feel.

## 9. Open items to verify before building

- [ ] Exact hex colour values (eyedropper the live site)
- [ ] Font families, weights, and sizes (browser Inspector)
- [ ] Full navigation labels, order, and footer link list
- [ ] Button styles (shape, hover states, primary vs secondary)
- [ ] Breakpoints and mobile layout behaviour
- [ ] Header behaviour (sticky? condensed on scroll?)
- [ ] Logo files and clear-space rules (request brand assets from Pie if this is sanctioned work)
- [ ] Actual rendered screenshots — see Appendix

## Appendix: getting real screenshots

This brief was compiled without screenshot capability. To capture true visual evidence:

- Use a full-page screenshot browser extension (e.g. GoFullPage) on each key page: Home, Investment Funds, KiwiSaver, Wealth Management, Market Insights.
- Capture at both desktop (~1440px) and mobile (~390px) widths.
- Save alongside this document so layout, spacing, and colour can be matched directly.
- The Wayback Machine (web.archive.org) can provide historical renders of piefunds.co.nz if the design changes during your build.
