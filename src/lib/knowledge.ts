/**
 * Knowledge-base loader.
 *
 * The committed fixture is the default and the only thing the demo depends on.
 * An optional live scrape (`data/routes.json`, Stage 1 P2) is used *only* if it
 * is present and passes validation; `scripts/sync-knowledge.mjs` inlines it into
 * `knowledge.generated.ts` so the bundler never has to resolve a file that may
 * not exist.
 */

import fixture from "../../data/routes.fixture.json";
import { LIVE_KNOWLEDGE } from "./knowledge.generated";
import { ROUTE_IDS } from "./routes";
import type { KnowledgeBase, KnowledgeEntry, KnowledgeSource } from "./types";

function isEntry(value: unknown): value is KnowledgeEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.url === "string" &&
    e.url.startsWith("/") &&
    typeof e.summary === "string" &&
    (e.summary_source === "generated" || e.summary_source === "scraped") &&
    (e.threshold === null || typeof e.threshold === "object") &&
    Array.isArray(e.funds) &&
    Array.isArray(e.insights) &&
    Array.isArray(e.scrape_errors)
  );
}

/** Returns the base only if every canonical route is present and well-formed. */
export function validateKnowledge(value: unknown): KnowledgeBase | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  for (const id of ROUTE_IDS) {
    if (!isEntry(candidate[id])) return null;
  }
  return candidate as unknown as KnowledgeBase;
}

const live = validateKnowledge(LIVE_KNOWLEDGE);

export const knowledgeBase: KnowledgeBase =
  live ?? (fixture as unknown as KnowledgeBase);

export const knowledgeSource: KnowledgeSource = live ? "routes.json" : "fixture";
