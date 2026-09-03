#!/usr/bin/env tsx
/**
 * npm run build:routes — optional live scrape (Stage 1, P2).
 *
 * Writes data/routes.json. Nothing depends on it: the app uses the committed
 * fixture unless a valid routes.json exists, and `npm run sync` decides that.
 *
 * The rules this scraper follows, in order of importance:
 *
 * - It never invents. Anything it cannot extract confidently is left null and
 *   the reason is recorded in that route's `scrape_errors`. A wrong figure on a
 *   financial site is far worse than a missing one.
 * - It takes fund descriptions and return figures verbatim, or not at all.
 * - One polite pass: robots.txt is honoured, requests are sequential with a
 *   delay, and a failed page is recorded and skipped rather than retried hard.
 * - Fixture values are kept for anything not scraped, so the output is always a
 *   complete, valid knowledge base. `summary_source` says which is which.
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import fixture from "../data/routes.fixture.json";
import { SITE_ORIGIN } from "../src/lib/routes";
import type { KnowledgeBase, KnowledgeEntry, KnowledgeFund } from "../src/lib/types";

type Mutable<T> = { -readonly [K in keyof T]: T[K] extends readonly (infer U)[] ? U[] : T[K] };

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const USER_AGENT =
  "PiePathwaysPrototype/0.1 (concept prototype; single polite pass; contact the repository owner)";

const REQUEST_DELAY_MS = 1500;
const TIMEOUT_MS = 15_000;

/** The six pages named in the Stage 1 brief. */
const SOURCES: { route: keyof KnowledgeBase; path: string }[] = [
  { route: "kiwisaver", path: "/kiwisaver" },
  { route: "funds", path: "/Investment-Funds" },
  { route: "performance", path: "/Performance" },
  { route: "insights", path: "/Market-Insights" },
  { route: "wealth", path: "/Wealth-Management" },
  { route: "documents", path: "/Investor-Documents" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Fetching                                                            */
/* ------------------------------------------------------------------ */

interface Fetched {
  html: string | null;
  finalUrl: string | null;
  error: string | null;
}

async function fetchPage(url: string): Promise<Fetched> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) {
      return { html: null, finalUrl: null, error: `HTTP ${response.status}` };
    }
    return { html: await response.text(), finalUrl: response.url, error: null };
  } catch (error) {
    return {
      html: null,
      finalUrl: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Minimal robots.txt reading: collect Disallow paths for `*`. */
async function disallowedPaths(): Promise<string[]> {
  const { html, error } = await fetchPage(`${SITE_ORIGIN}/robots.txt`);
  if (error || !html) return [];
  const disallowed: string[] = [];
  let applies = false;
  for (const line of html.split("\n")) {
    const trimmed = line.trim();
    const agent = /^user-agent:\s*(.+)$/i.exec(trimmed);
    if (agent) {
      applies = (agent[1] ?? "").trim() === "*";
      continue;
    }
    const rule = /^disallow:\s*(\S*)$/i.exec(trimmed);
    if (applies && rule && rule[1]) disallowed.push(rule[1]);
  }
  return disallowed;
}

/* ------------------------------------------------------------------ */
/* Extraction — conservative by design                                 */
/* ------------------------------------------------------------------ */

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** The meta description, taken verbatim. Null if absent. */
function metaDescription(html: string): string | null {
  const match =
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i.exec(html);
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : null;
}

/**
 * Fund cards, per the documented pattern: a name, then a timeframe, then a risk
 * rating. If the timeframe and rating are not both found near the name, the card
 * is not recognised and nothing is emitted for it — an unrated fund would breach
 * the site's own convention that both are mandatory metadata.
 */
function extractFunds(html: string): { funds: KnowledgeFund[]; errors: string[] } {
  const text = stripTags(html);
  const funds: KnowledgeFund[] = [];
  const errors: string[] = [];

  const pattern =
    /([A-Z][A-Za-z0-9'&\s]{2,40}?)\s*(\(Closed to new investment\))?\s*Investment timeframe\s*:?\s*([0-9]+\+?\s*[A-Za-z]+)\s*Risk rating\s*:?\s*(Lower|Medium|Higher)/g;

  for (const match of text.matchAll(pattern)) {
    const name = match[1]?.trim();
    if (!name) continue;
    funds.push({
      name,
      // Descriptions are only taken verbatim; this pattern does not capture one.
      description: null,
      timeframe: match[3]?.trim() ?? null,
      risk_rating: match[4]?.trim() ?? null,
      status: match[2] ? "Closed to new investment" : null,
    });
  }

  if (funds.length === 0 && /Investment timeframe|Risk rating/i.test(text)) {
    errors.push(
      "fund cards present but not in the expected name/timeframe/risk-rating shape — left empty rather than guessed",
    );
  }

  return { funds, errors };
}

/* ------------------------------------------------------------------ */

async function main() {
  const base = structuredClone(fixture) as unknown as KnowledgeBase;
  const disallowed = await disallowedPaths();
  if (disallowed.length > 0) {
    console.log(`robots.txt disallows: ${disallowed.join(", ")}`);
  }

  let scraped = 0;

  for (const [index, source] of SOURCES.entries()) {
    // The knowledge-base types are readonly for consumers; the builder is the
    // one place that writes them.
    const entry = base[source.route] as Mutable<KnowledgeEntry>;
    entry.scrape_errors = [];

    if (disallowed.some((rule) => source.path.toLowerCase().startsWith(rule.toLowerCase()))) {
      entry.scrape_errors.push(`skipped: robots.txt disallows ${source.path}`);
      console.log(`skip  ${source.path} (robots.txt)`);
      continue;
    }

    if (index > 0) await sleep(REQUEST_DELAY_MS);

    const url = `${SITE_ORIGIN}${source.path}`;
    const { html, finalUrl, error } = await fetchPage(url);

    if (error || !html) {
      entry.scrape_errors.push(`fetch failed: ${error ?? "no body"}`);
      console.log(`fail  ${source.path} — ${error}`);
      continue;
    }

    // Canonical URL as served, so a redirect is recorded rather than assumed.
    if (finalUrl) {
      try {
        entry.url = new URL(finalUrl).pathname;
      } catch {
        entry.scrape_errors.push(`could not parse served URL: ${finalUrl}`);
      }
    }

    const description = metaDescription(html);
    if (description) {
      entry.summary = description;
      entry.summary_source = "scraped";
    } else {
      entry.scrape_errors.push("no meta description — kept the fixture summary");
    }

    const { funds, errors } = extractFunds(html);
    if (funds.length > 0) entry.funds = funds;
    entry.scrape_errors.push(...errors);

    scraped++;
    console.log(
      `ok    ${entry.url} — summary ${description ? "scraped" : "kept"}, ${funds.length} fund card(s)`,
    );
  }

  if (scraped === 0) {
    // Writing a routes.json made entirely of fixture values would make the app
    // report "routes.json" as its knowledge base while showing fixture content.
    // Better to write nothing and let the fixture be the fixture.
    console.log(
      `\nNo page was reachable, so data/routes.json was not written. The committed ` +
        `fixture still drives the app and the developer panel still reports "fixture", ` +
        `which is the truth.`,
    );
    return;
  }

  const outPath = resolve(root, "data/routes.json");
  writeFileSync(outPath, `${JSON.stringify(base, null, 2)}\n`, "utf8");

  console.log(
    `\nWrote data/routes.json — ${scraped}/${SOURCES.length} pages scraped, ` +
      `the rest kept from the fixture. Run "npm run sync" (or npm run dev/build, ` +
      `which do it for you) to pick it up.`,
  );
}

main().catch((error) => {
  console.error("build:routes failed:", error);
  process.exit(1);
});
