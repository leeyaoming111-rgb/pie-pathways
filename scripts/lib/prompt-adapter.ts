/**
 * Prompt-variant adapter (Stage 4b).
 *
 * Mock mode is the default and runs entirely offline: responses come from
 * mocks/llm-responses.json, keyed by prompt_version:persona_id. No demo path
 * depends on this, and no live call is made unless USE_LLM_EVAL=true is set
 * explicitly — in which case the adapter says plainly that it is not wired up
 * rather than pretending to have measured something.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import mocks from "../../mocks/llm-responses.json";
import type { ClassifierAdapter } from "./types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const RESPONSES = mocks.responses as Record<
  string,
  { response: unknown; generated_text?: string }
>;

export const AVAILABLE_VERSIONS = ["v1", "v2", "v3", "v4", "v5"] as const;

function promptText(version: string): string {
  try {
    return readFileSync(resolve(root, `prompts/${version}.txt`), "utf8");
  } catch {
    throw new Error(`No prompt file at prompts/${version}.txt`);
  }
}

/** First line of the prompt's own description, for the report header. */
function summarise(version: string): string {
  const lines = promptText(version).split("\n").filter(Boolean);
  return `prompt ${version} (${lines.length} lines)`;
}

export function promptAdapter(version: string): ClassifierAdapter {
  if (!(AVAILABLE_VERSIONS as readonly string[]).includes(version)) {
    throw new Error(
      `Unknown prompt version "${version}". Available: ${AVAILABLE_VERSIONS.join(", ")}.`,
    );
  }

  const live = process.env.USE_LLM_EVAL === "true";
  if (live) {
    throw new Error(
      "USE_LLM_EVAL=true requests a live run, but no model client is configured in " +
        "this build. Live calls are deliberately out of scope. Unset USE_LLM_EVAL " +
        "to run in mock mode.",
    );
  }

  // Touch the prompt file so a missing or renamed prompt fails loudly here
  // rather than silently evaluating mocks against a prompt that does not exist.
  const describe = `${summarise(version)} — mock mode, offline fixtures`;

  return {
    id: `prompt:${version}`,
    describe,
    classify(_message, personaId) {
      const entry = RESPONSES[`${version}:${personaId}`];
      if (!entry) {
        return {
          raw: { error: `no mock response for ${version}:${personaId}` },
          reason: "No fixture for this persona under this prompt version.",
          signals: ["missing_fixture"],
          latencyMs: null,
        };
      }
      return {
        raw: entry.response,
        reason:
          typeof (entry.response as { rationale?: unknown })?.rationale === "string"
            ? ((entry.response as { rationale: string }).rationale)
            : "Mock fixture response.",
        signals: [`mock:${version}`],
        // Latency is meaningless offline and is reported as such rather than
        // as a number that looks measured.
        latencyMs: null,
        generatedText: entry.generated_text,
      };
    },
  };
}
