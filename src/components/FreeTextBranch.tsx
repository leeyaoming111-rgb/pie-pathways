"use client";

/**
 * "Describe my situation".
 *
 * P0 state: the guided flow is the demo, and this branch is framed as the next
 * layer. It is replaced by the heuristic classifier UI in the P1 pass.
 */

export function FreeTextBranch({ onBack }: { onBack?: () => void }) {
  return (
    <div className="rounded-2xl border border-pie-border bg-pie-light p-6 sm:p-8">
      <h3 className="text-xl font-semibold tracking-tight">
        Describing it in your own words is the next layer
      </h3>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-pie-charcoal">
        Today&rsquo;s demo routes on the guided questions, which are deterministic
        and testable end to end. Free text runs through the same classifier the
        evaluation harness measures, and it ships once it clears the safety
        gates.
      </p>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-5 rounded-sm text-sm font-medium text-pie-charcoal underline underline-offset-4 hover:text-pie-ink"
        >
          ← Back to the questions
        </button>
      )}
    </div>
  );
}
