"use client";

/**
 * "Show demo logic" — collapsed by default.
 *
 * This is a deterministic state model, and the panel says so. Nothing here is
 * AI reasoning; it is the exact record the router acted on.
 */

import { knowledgeSource } from "@/lib/knowledge";
import type { ClassifyResult } from "@/lib/types";

interface Props {
  result: ClassifyResult;
  /** Either the guided-flow answers or the classified free text. */
  input: Record<string, string> | { free_text: string };
  /** How the outcome was reached. */
  method: "guided flow" | "demo scenario" | "heuristic classifier";
  /** Rule names that fired, when the classifier produced the result. */
  signals?: string[];
  reason?: string;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(11rem,auto)_1fr] gap-x-4 gap-y-1 border-b border-white/10 py-2 last:border-b-0">
      <dt className="text-white/55">{label}</dt>
      <dd className="break-words text-white">{children}</dd>
    </div>
  );
}

function Bool({ value }: { value: boolean }) {
  return (
    <span className={value ? "text-pie-green" : "text-white/70"}>
      {String(value)}
    </span>
  );
}

export function DeveloperPanel({ result, input, method, signals, reason }: Props) {
  const answers =
    "free_text" in input
      ? input.free_text
      : Object.entries(input)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ") || "—";

  return (
    <details className="group mt-6 overflow-hidden rounded-2xl bg-pie-charcoal text-[13px]">
      <summary className="cursor-pointer list-none px-6 py-3.5 font-medium text-white marker:content-['']">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block transition-transform group-open:rotate-90"
          >
            ▸
          </span>
          Show demo logic
        </span>
        <span className="ml-2 text-white/50">
          deterministic state model — not AI reasoning
        </span>
      </summary>

      <dl className="px-6 pb-5 font-mono">
        <Row label="route_id">{result.route}</Row>
        <Row label="sub_route">{result.sub_route ?? "—"}</Row>
        <Row label="intent">{result.intent}</Row>
        <Row label={"free_text" in input ? "classified_input" : "journey_answers"}>
          {answers}
        </Row>
        <Row label="confidence">{result.confidence.toFixed(2)}</Row>
        <Row label="human_review_required">
          <Bool value={result.human_review_required} />
        </Row>
        <Row label="personal_advice_generated">
          <Bool value={result.personal_advice_generated} />
        </Row>
        <Row label="missing_fields">
          {result.missing_fields.length > 0
            ? `[${result.missing_fields.join(", ")}]`
            : "[]"}
        </Row>
        <Row label="knowledge_base">{knowledgeSource}</Row>
        <Row label="resolved_by">{method}</Row>
        {signals && signals.length > 0 && (
          <Row label="signals">[{signals.join(", ")}]</Row>
        )}
        {reason && <Row label="reason">{reason}</Row>}
      </dl>
    </details>
  );
}
