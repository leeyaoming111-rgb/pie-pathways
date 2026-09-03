"use client";

/**
 * "Describe my situation" — the free-text branch.
 *
 * Runs the same deterministic `classify()` the eval harness measures. Two rules
 * differ from the guided flow, and both are about not over-reaching:
 *
 * - Below the confidence floor, or on `clarify`, it asks a question instead of
 *   routing. A confident wrong answer is worse than a question.
 * - Distress, account identifiers and injected instructions are handled by
 *   `classify()` before any routing is attempted, so they cannot be reached by
 *   a message that also contains a routine request.
 */

import { useCallback, useState } from "react";

import { CLARIFY_PROMPT, classifyDetailed, needsClarification, redactIdentifiers } from "@/lib/classify";
import { CONFIDENCE_FLOOR } from "@/lib/config";
import { buildPathway } from "@/lib/outcomes";
import { INTENT_LABELS } from "@/lib/intents";
import type { ClassifyResult, JourneyState } from "@/lib/types";

import { DeveloperPanel } from "./DeveloperPanel";
import { HardeningPanel } from "./HardeningPanel";
import { OutcomeCard } from "./OutcomeCard";

interface Analysis {
  readonly text: string;
  readonly result: ClassifyResult;
  readonly reason: string;
  readonly signals: string[];
}

interface Props {
  onBack?: () => void;
  /** Hands a clarifying answer back to the guided flow. */
  onClarify?: (objective: NonNullable<JourneyState["objective"]>) => void;
}

export function FreeTextBranch({ onBack, onClarify }: Props) {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = text.trim();
      if (trimmed.length === 0) return;
      const detail = classifyDetailed(trimmed);
      setAnalysis({
        text: trimmed,
        result: detail.result,
        reason: detail.reason,
        signals: detail.signals,
      });
    },
    [text],
  );

  const reset = useCallback(() => {
    setAnalysis(null);
    setText("");
  }, []);

  return (
    <div>
      <div className="rounded-2xl border border-pie-border bg-pie-light p-6 sm:p-8">
        <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Tell us what&rsquo;s going on
        </h3>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-pie-charcoal">
          A sentence or two is plenty. Please leave out account numbers, PM
          numbers and passwords — this form doesn&rsquo;t accept them.
        </p>

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="situation" className="sr-only">
            Describe your situation
          </label>
          <textarea
            id="situation"
            name="situation"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="For example: we've just sold a house and aren't sure what to do with the proceeds."
            className="w-full rounded-xl border border-pie-border bg-white p-4 text-[15px] leading-relaxed placeholder:text-pie-sage focus:border-pie-charcoal"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={text.trim().length === 0}
              className="rounded-full bg-pie-green px-6 py-3 text-[15px] font-medium text-pie-ink transition-colors hover:bg-pie-green-deep disabled:cursor-not-allowed disabled:bg-pie-border disabled:text-pie-charcoal/60"
            >
              Find my pathway
            </button>
            {analysis && (
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-pie-border px-5 py-3 text-[15px] font-medium text-pie-charcoal transition-colors hover:border-pie-charcoal"
              >
                Clear
              </button>
            )}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-sm text-sm font-medium text-pie-charcoal underline underline-offset-4 hover:text-pie-ink"
              >
                ← Back to the questions
              </button>
            )}
          </div>
        </form>
      </div>

      {analysis && (
        <div aria-live="polite" className="mt-6">
          <ExtractedFacts analysis={analysis} />
          <Result analysis={analysis} onClarify={onClarify} />
          <DeveloperPanel
            result={analysis.result}
            input={{ free_text: redactIdentifiers(analysis.text) }}
            method="heuristic classifier"
            signals={analysis.signals}
            reason={analysis.reason}
          />
        </div>
      )}

      <HardeningPanel />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ExtractedFacts({ analysis }: { analysis: Analysis }) {
  const { result } = analysis;
  const low = result.confidence < CONFIDENCE_FLOOR;

  return (
    <section
      aria-labelledby="facts-heading"
      className="rounded-2xl border border-pie-border bg-white p-6 sm:p-8"
    >
      <h3
        id="facts-heading"
        className="text-xs font-semibold uppercase tracking-[0.14em] text-pie-charcoal/70"
      >
        What we took from that
      </h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-[13px] text-pie-charcoal/80">Intent</dt>
          <dd className="mt-1 font-medium">{INTENT_LABELS[result.intent]}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-pie-charcoal/80">Route</dt>
          <dd className="mt-1 font-medium">
            {result.route}
            {result.sub_route ? ` → ${result.sub_route.split(".")[1]}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-pie-charcoal/80">Confidence</dt>
          <dd className="mt-1 flex items-center gap-2 font-medium">
            {result.confidence.toFixed(2)}
            <span
              className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                low
                  ? "border border-pie-border text-pie-charcoal"
                  : "bg-pie-green text-pie-ink"
              }`}
            >
              {low ? "below the floor" : "clear enough to route"}
            </span>
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-[14px] leading-relaxed text-pie-charcoal">
        {analysis.reason}
      </p>
    </section>
  );
}

function Result({
  analysis,
  onClarify,
}: {
  analysis: Analysis;
  onClarify?: (objective: NonNullable<JourneyState["objective"]>) => void;
}) {
  const { result } = analysis;

  if (needsClarification(result)) {
    return (
      <section
        aria-labelledby="clarify-heading"
        className="mt-6 rounded-2xl border border-pie-border bg-white p-6 sm:p-8"
      >
        <h3 id="clarify-heading" className="text-xl font-semibold tracking-tight">
          {CLARIFY_PROMPT.question}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-pie-charcoal">
          We&rsquo;d rather ask than send you somewhere that isn&rsquo;t right.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {CLARIFY_PROMPT.options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() =>
                  onClarify?.(option.value as NonNullable<JourneyState["objective"]>)
                }
                className="h-full w-full rounded-xl border border-pie-border bg-white px-5 py-4 text-left font-medium transition-colors hover:border-pie-charcoal hover:bg-pie-light"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const pathway = buildPathway(result);
  if (!pathway) return null;

  return (
    <div className="mt-6">
      <OutcomeCard pathway={pathway} />
    </div>
  );
}
