# Pie Funds — Brand & Product Extract

> Working reference for building Pie-adjacent prototypes.
> Scraped from piefunds.co.nz (skin.css + homepage HTML, DNN skin "piefunds") on 3 Sep 2026, then cross-checked against the live site the same day.
> Items marked **[verified]** were confirmed on the live site. Items marked **[scraped]** come from the CSS/HTML extract only. Items marked **[unverified]** could not be confirmed — do not hardcode them as fact.

---

## 1. Design tokens

### Colour palette (by usage frequency in skin.css) [scraped]

| Token | Hex | Role | Usage |
|---|---|---|---|
| `pie-charcoal` | `#474A47` | Primary dark | Charcoal-green; headers, footer, body text on light |
| `pie-green` | `#94F587` | Accent | "Pie green"; buttons, highlights, speech-mark icon |
| `pie-light` | `#F5F5F5` | Background | Standard light section background |
| `pie-white` | `#FFFFFF` | Surface | Cards, content surfaces |
| `pie-cream` | `#EFEFED` | Background | Warm off-white alternating section background |
| `pie-border` | `#D5D4CE` | Hairline | Warm borders, dividers |
| `pie-sage` | `#BCBDB4` | Muted | Sage-grey secondary text, icons |
| `pie-ink` | `#1D1D1F` | Near-black | High-emphasis text |
| `pie-black` | `#000000` | Meta | theme-color meta tag only |

### Notes for implementation

- `#94F587` is a bright, light green — it fails contrast as text on white. Use it for **fills, button backgrounds, and highlight chips**, with `#1D1D1F` or `#474A47` text on top.
- Dark sections (footer, hero overlays) use `#474A47` or `#1D1D1F` backgrounds with white text and the green accent.
- The overall feel is **warm-neutral, not cold-grey**: cream and sage tones, generous whitespace.

### Tailwind theme snippet (drop-in)

```js
// tailwind.config theme.extend.colors
pie: {
  green: '#94F587',
  charcoal: '#474A47',
  ink: '#1D1D1F',
  cream: '#EFEFED',
  light: '#F5F5F5',
  border: '#D5D4CE',
  sage: '#BCBDB4',
}
```

---

## 2. Typography [scraped]

- Brand font: **Euclid Circular A** — weights Regular (400), Medium (500), SemiBold (600)
- Self-hosted; no Google Fonts. Fallback stack: `"Euclid", "Arial", sans-serif`
- Local assets: `assets/euclid-regular.ttf`, `assets/euclid-medium.ttf`, `assets/euclid-semibold.ttf`
- Icons: Font Awesome 5 Pro / 6 Sharp

Prototype guidance: if the Euclid files are unavailable in the build environment, fall back to Arial/system sans and keep weight contrast (medium headings, regular body). Do not substitute a geometric Google font and claim it is the brand font.

---

## 3. Logos & assets [scraped]

| Asset | Use |
|---|---|
| `Pie-Logo-Grey.svg` | Logo on light backgrounds |
| `Pie-Logo-White.svg` | Logo on dark backgrounds |
| `Pie_ActiveGreen_SpeechMarks.svg` | Testimonial quote icon (Pie green) |

For prototypes without asset access: styled-text wordmark ("Pie Funds") is acceptable; never redraw or distort the real logo.

---

## 4. Voice & messaging

### Positioning [verified]

> "Boutique, New Zealand-owned KiwiSaver, investment fund and wealth manager. Helping Kiwis grow their wealth since 2007."

Key lines from the live site [verified]:

- "We manage your investments so you can focus on what you love."
- "Because we invest alongside you, your success is ours."
- "A boutique service, tailored to you, and long-term relationships built on trust."

### Pillars [scraped/verified]

Brand pillars: **Boutique / Bespoke / For You**.
Investment pillars (Five Pillars page + wealth page): in-depth research over hype; riding long-term tailwinds; skin in the game (NZ$100m+ staff, director, and shareholder money invested alongside clients); knowing the people behind businesses; holding cash for a rainy day.

### Proof points

| Claim | Status |
|---|---|
| NZ$2.5b funds under management | [verified] — stated on site; dated "end of October 2025" and "30 June 2026" in different places. Quote with its date. |
| NZ$1.1b+ wealth generated for clients | [verified] — "after fees, before tax" |
| NZ$100m+ staff/director/shareholder co-investment | [verified] |
| Operating since 2007 | [verified] |

### Tone

Personal, plain-spoken, first-person-plural ("we invest alongside you"). Short sentences. No jargon, no hype. Testimonials are signed with first name + client type (e.g., "Anna, Pie KiwiSaver Scheme Client") [verified]. The monthly newsletter is called **Slice of Pie** [verified].

---

## 5. Site structure / routing map

| Section | URL | Status |
|---|---|---|
| KiwiSaver | `/kiwisaver` | [verified] |
| KiwiSaver application | `/invest/kiwisaver` | [scraped] |
| Investment Funds | `/Investment-Funds` | [verified] |
| Investment Advice | `/Investment-Funds/Investment-Advice` | [scraped] |
| Wealth Management | `/Wealth-Management` | [verified] — note: scrape listed `/wealth`; live URL is `/Wealth-Management` |
| Performance | `/Performance` | [scraped] |
| Market Insights | `/Market-Insights` | [verified] — monthly "A message from Mike" (founder/CIO Mike Taylor) |
| Investor Documents | `/Investor-Documents` | [scraped] |
| Investor Portal how-to | `/investor-portal` | [scraped] |
| Online application (managed funds) | `/invest` | [verified] |
| About | `/About-Us` | [scraped] |
| Contact | `/contact-us` | [scraped] |

---

## 6. Product architecture

### Pie KiwiSaver Scheme [verified]

Four funds: **Conservative** (3+ yrs, lower risk), **Balanced** (5+ yrs, medium), **Growth** (7+ yrs, higher), **Aggressive** (10+ yrs, higher).
Joining requires: driver's licence or passport, IRD (Inland Revenue Department) number, and an online form. A **Fund Chooser Tool** already exists on the KiwiSaver page ("In just a few minutes… a few questions to understand your investment goals, life stage, and timeframe").

### Managed Investment Funds [verified]

Actively managed, grouped as:

- Australasian: Growth, Growth 2, Dividend Growth (closed to new investment), Emerging Companies (closed to new investment)
- Global: Global Growth, Global Growth 2, Growth UK & Europe
- Diversified & Fixed Income: Conservative, Chairman's (minimum investment NZ$500,000), Fixed Income, Property & Infrastructure

| Threshold | Status |
|---|---|
| Investment Funds minimum NZ$25,000 | [unverified] — from scrape; not confirmed on the live funds page. Do not state as fact in a demo. |
| Investment Advice tier NZ$250,000+ | [scraped] — consistent across scraped pages |
| Pie Wealth (private wealth) NZ$1m+ | [verified] — "best suited to individuals, family trusts and entities with $1 million or more to invest" |

---

## 7. Operational facts that matter for a routing prototype

These are the facts that make a pathway tool feel real rather than generic. All [verified] from `/invest` and `/Wealth-Management` unless noted.

### Who can apply online (managed funds)

- Online application requires: aged **18 or over**, and **NZ-resident or physically located in NZ** at submission time.
- **Cannot apply online**: Trusts, Companies, Minors (17 and under), Joint ("other") structures, and anything outside the standard options — these must download a form and email it to the applications inbox. **This is the single most useful routing edge case for the demo.**
- Each applicant needs their **own mobile number** for identity verification.

### What an applicant needs

1. Contact details
2. Identification and bank account
3. IRD or TIN (Tax Identification Number)

Bank account must be **NZ-domiciled and in the same name(s)** as the applicant(s). Identity verification happens under the **Anti-Money Laundering and Countering Financing of Terrorism Act 2009 (AML/CFT)**; tax-residency questions cover FATCA (US Foreign Account Tax Compliance Act) and AEOI/CRS (Automatic Exchange of Information / Common Reporting Standard). Account setup can take **up to 10 working days**. Applicants must read the relevant fund's **Product Disclosure Statement (PDS)** before investing.

### Existing clients

- Account identifier is a **PM number** (e.g., PM12345), visible in the Investor Portal [verified].
- Old KiwiSaver and Investment Funds portals are closed; there is a single new Investor Portal with a how-to guide at `/investor-portal` [scraped].

### Wealth service

- **Pie Wealth**: boutique advice service; team led by Head of Wealth James Paterson; four named Wealth Advisers plus a Wealth Associate [verified].
- Calls to action on the wealth page: "Download" (guide) and "Talk to our team" [verified].

### Contact & escalation [verified]

- Phone: 0800 586 657 (NZ) / +64 9 486 1701 (international)
- Client email: clients@piefunds.co.nz; applications inbox used for form-based applications

---

## 8. Compliance lines to mirror in any prototype

- Every pathway outcome carries: **"General information only — not personal financial advice."**
- Never name a fund as a recommendation; point to the Fund Chooser (KiwiSaver) or an adviser conversation instead.
- Never confirm eligibility, approval, or withdrawal outcomes — "Pie's team reviews each request."
- Never ask for account numbers, PM numbers, passwords, or ID documents inside a demo intake flow. Sensitive data belongs in the portal or with the team.

---

## 9. Tech platform (reference only) [scraped]

DNN (DotNetNuke) CMS, Bootstrap 5.3.2, slick-carousel hero, mmenu mobile navigation.
Implication for prototypes: the real site is server-rendered DNN; an embeddable routing widget would most plausibly ship as a self-contained script/module rather than a full site rebuild.

---

## 10. Do-not-fabricate list (hand this to any coding agent)

1. Do not invent fund performance numbers, Morningstar ratings, or returns (a real Morningstar mention exists on the KiwiSaver page dated 31 March 2026 — reference it only if quoting exactly).
2. Do not invent interest rates, fees, or the NZ$25k minimum (unverified).
3. Do not invent eligibility rules for KiwiSaver withdrawals (hardship, emigration, serious illness, first home) — route to forms + human review.
4. Do not invent staff names beyond those on the wealth page.
5. Do not state that trusts/companies/minors can apply online — they cannot.
