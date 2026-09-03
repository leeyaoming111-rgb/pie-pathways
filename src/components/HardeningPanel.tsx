/**
 * "How this would be hardened for production."
 *
 * The bridge between the demo and the engineering method. Numbers come from
 * eval-results/summary.json, written by `npm run eval` and committed, so the
 * panel cannot drift from the harness — if the run changes, this changes.
 */

import summary from "../../eval-results/summary.json";

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

const HEADLINE: { label: string; value: string; note: string }[] = [
  {
    label: "Sensitive-case recall",
    value: pct(summary.metrics.sensitiveRecall),
    note: `${summary.metrics.sensitiveCases} personas that must reach a person`,
  },
  {
    label: "Unsafe false negatives",
    value: String(summary.metrics.unsafeFalseNegatives),
    note: "distress cases left on a self-service page",
  },
  {
    label: "Over-escalation rate",
    value: pct(summary.metrics.overEscalationRate),
    note: "routine cases sent to a human unnecessarily",
  },
  {
    label: "Schema validity",
    value: pct(summary.metrics.schemaValidityRate),
    note: "outputs matching the shared outcome shape",
  },
];

const GATES: string[] = [
  "Any persona needing a person that was not escalated fails the build.",
  "Any output that is not exactly the shared outcome shape fails the build.",
  `Any of the ${summary.copyBlocksScanned} outcome copy blocks naming a fund as an instruction fails the build — scanned whether or not a test case reaches it.`,
];

export function HardeningPanel() {
  return (
    <section
      aria-labelledby="hardening-heading"
      className="mt-6 rounded-2xl border border-pie-border bg-pie-light p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pie-charcoal/70">
        Where this goes next
      </p>
      <h3 id="hardening-heading" className="mt-2 text-xl font-semibold tracking-tight">
        How this would be hardened for production
      </h3>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-pie-charcoal">
        The classifier above is deterministic, so it can be measured. A model-backed
        version would replace it behind the same interface and would have to clear
        the same gates before shipping. Here is where the current run stands.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HEADLINE.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-pie-border bg-white p-4"
          >
            <dt className="text-[13px] text-pie-charcoal/80">{item.label}</dt>
            <dd className="mt-1.5 text-2xl font-semibold tracking-tight">
              {item.value}
            </dd>
            <p className="mt-1 text-[12px] leading-snug text-pie-charcoal/70">
              {item.note}
            </p>
          </div>
        ))}
      </dl>

      <h4 className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-pie-charcoal/70">
        The gates that block a release
      </h4>
      <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-pie-ink/85">
        {GATES.map((gate) => (
          <li key={gate} className="flex gap-2.5">
            <span
              aria-hidden
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pie-green-deep"
            />
            <span>{gate}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 border-t border-pie-border pt-5 text-[13px] leading-relaxed text-pie-charcoal/80">
        Measured over {summary.metrics.cases} tuning personas. A separate holdout
        set is kept aside and run once, so the numbers above are not the numbers
        the classifier was tuned against. Run{" "}
        <code className="rounded bg-white px-1.5 py-0.5">npm run eval</code> to
        reproduce this, and{" "}
        <code className="rounded bg-white px-1.5 py-0.5">npm run eval:ci</code> for
        the gate.
      </p>
    </section>
  );
}
