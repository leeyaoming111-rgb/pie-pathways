"use client";

/**
 * The pathway module.
 *
 * All routing lives in `resolvePathway`. This component holds the answers, the
 * back stack, and nothing else — clicking a demo scenario just seeds the same
 * state object the guided flow builds one answer at a time, so there is no
 * separate code path for the demo.
 */

import { useCallback, useMemo, useState } from "react";

import { COMPLIANCE } from "@/lib/config";
import { DEMO_SCENARIOS, progress, resolvePathway, type Step } from "@/lib/pathways";
import type { JourneyState } from "@/lib/types";

import { DeveloperPanel } from "./DeveloperPanel";
import { FreeTextBranch } from "./FreeTextBranch";
import { OutcomeCard } from "./OutcomeCard";

type Method = "guided flow" | "demo scenario";

export function PathwayModule() {
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<JourneyState>({});
  const [history, setHistory] = useState<JourneyState[]>([]);
  const [method, setMethod] = useState<Method>("guided flow");

  const resolution = useMemo(() => resolvePathway(state), [state]);
  const { answered, total } = progress(state);

  const answer = useCallback(
    (step: Step, value: string) => {
      setHistory((h) => [...h, state]);
      setState({ ...state, [step.id]: value });
      setMethod("guided flow");
    },
    [state],
  );

  const goBack = useCallback(() => {
    setHistory((h) => {
      const previous = h.at(-1);
      if (previous === undefined) return h;
      setState(previous);
      return h.slice(0, -1);
    });
  }, []);

  const restart = useCallback(() => {
    setState({});
    setHistory([]);
    setMethod("guided flow");
    setStarted(true);
  }, []);

  const runScenario = useCallback((scenarioState: JourneyState) => {
    setHistory([]);
    setState(scenarioState);
    setMethod("demo scenario");
    setStarted(true);
  }, []);

  return (
    <section
      id="pathways"
      aria-labelledby="pathways-heading"
      className="rounded-3xl border border-pie-border bg-white p-6 shadow-sm sm:p-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pie-charcoal/70">
            Pie Pathways
          </p>
          <h2
            id="pathways-heading"
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Let&rsquo;s get you to the right place
          </h2>
          <p className="mt-2 max-w-xl text-[17px] leading-relaxed text-pie-charcoal">
            Answer a few quick questions and we&rsquo;ll point you at the right
            page, form or team. We won&rsquo;t tell you what to invest in.
          </p>
        </div>

        {started && (
          <button
            type="button"
            onClick={restart}
            className="shrink-0 rounded-full border border-pie-border px-4 py-2 text-sm font-medium text-pie-charcoal transition-colors hover:border-pie-charcoal"
          >
            Start again
          </button>
        )}
      </div>

      {!started ? (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="rounded-full bg-pie-green px-8 py-3.5 text-[15px] font-medium text-pie-ink transition-colors hover:bg-pie-green-deep"
          >
            Start
          </button>
          <p className="mt-3 text-sm text-pie-charcoal/75">
            Takes about a minute. Nothing you enter is stored or sent anywhere.
          </p>
        </div>
      ) : (
        <>
          {resolution.status === "question" && (
            <ProgressBar answered={answered} total={total} />
          )}

          <div className="mt-8">
            {resolution.status === "question" && (
              <QuestionStep
                step={resolution.step}
                onAnswer={answer}
                onBack={history.length > 0 ? goBack : undefined}
              />
            )}

            {resolution.status === "free_text" && (
              <FreeTextBranch
                onBack={history.length > 0 ? goBack : undefined}
                onClarify={(objective) => {
                  setHistory((h) => [...h, state]);
                  setState({ ...state, objective });
                }}
              />
            )}

            {resolution.status === "resolved" && (
              <div aria-live="polite">
                <OutcomeCard pathway={resolution.pathway} />
                <DeveloperPanel
                  result={resolution.pathway.result}
                  input={journeyAnswers(state)}
                  method={method}
                />
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="mt-5 rounded-sm text-sm font-medium text-pie-charcoal underline underline-offset-4 hover:text-pie-ink"
                  >
                    ← Change my last answer
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <ScenarioMenu onRun={runScenario} />
    </section>
  );
}

/* ------------------------------------------------------------------ */

function ProgressBar({ answered, total }: { answered: number; total: number }) {
  const percent = Math.round((answered / total) * 100);
  return (
    <div className="mt-8">
      <div
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Question ${answered + 1} of about ${total}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-pie-cream"
      >
        <div
          className="h-full rounded-full bg-pie-green transition-[width] duration-300"
          style={{ width: `${Math.max(percent, 6)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-pie-charcoal/70">
        Question {answered + 1} of about {total}
      </p>
    </div>
  );
}

function QuestionStep({
  step,
  onAnswer,
  onBack,
}: {
  step: Step;
  onAnswer: (step: Step, value: string) => void;
  onBack?: () => void;
}) {
  return (
    <fieldset>
      <legend className="text-xl font-semibold tracking-tight sm:text-2xl">
        {step.question}
      </legend>
      {step.help && (
        <p className="mt-2 text-[15px] text-pie-charcoal">{step.help}</p>
      )}

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {step.options.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              onClick={() => onAnswer(step, option.value)}
              className="h-full w-full rounded-xl border border-pie-border bg-white px-5 py-4 text-left transition-colors hover:border-pie-charcoal hover:bg-pie-light"
            >
              <span className="block font-medium">{option.label}</span>
              {option.description && (
                <span className="mt-1 block text-sm text-pie-charcoal/80">
                  {option.description}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {step.note && (
        <p className="mt-4 inline-block rounded-full bg-pie-cream px-3.5 py-1.5 text-[13px] text-pie-charcoal">
          {step.note}
        </p>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-sm text-sm font-medium text-pie-charcoal underline underline-offset-4 hover:text-pie-ink"
        >
          ← Back
        </button>
      )}
    </fieldset>
  );
}

function ScenarioMenu({ onRun }: { onRun: (state: JourneyState) => void }) {
  return (
    <div className="mt-10 border-t border-pie-border pt-7">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-pie-charcoal/70">
        Try a demo scenario
      </h3>
      <p className="mt-2 text-sm text-pie-charcoal">
        Each one jumps straight to its outcome, through exactly the same routing
        the questions use.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2.5">
        {DEMO_SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <button
              type="button"
              onClick={() => onRun(scenario.state)}
              className="rounded-full border border-pie-border bg-pie-cream px-4 py-2.5 text-left transition-colors hover:border-pie-charcoal hover:bg-pie-green"
            >
              <span className="block text-sm font-medium">{scenario.chip}</span>
              <span className="block text-xs text-pie-charcoal/80">
                {scenario.caption}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[13px] text-pie-charcoal/70">
        {COMPLIANCE.prototype}
      </p>
    </div>
  );
}

/** Flattens the journey into the key=value pairs the developer panel prints. */
function journeyAnswers(state: JourneyState): Record<string, string> {
  return Object.fromEntries(
    Object.entries(state).filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
}
