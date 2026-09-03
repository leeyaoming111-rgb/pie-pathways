/**
 * The outcome card. Every route renders through this one component, so the
 * compliance footer, the fixed "What happens next" steps and the
 * never-quote-returns rule cannot be forgotten on one branch and kept on another.
 */

import { COMPLIANCE, WHAT_HAPPENS_NEXT } from "@/lib/config";
import { ESCALATION_CONTACTS } from "@/lib/outcomes";
import { ROUTES, absoluteUrl } from "@/lib/routes";
import type { PathwayDefinition } from "@/lib/types";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-pie-charcoal/70">
      {children}
    </h3>
  );
}

export function OutcomeCard({ pathway }: { pathway: PathwayDefinition }) {
  const isSensitive = pathway.tone === "sensitive";
  const contactHref = absoluteUrl(ROUTES.contact.url);
  // On the contact routes the primary action already is "talk to a person",
  // so the standing secondary button would just repeat it.
  const showContactButton = pathway.primaryAction.href !== contactHref;

  return (
    <article
      aria-labelledby="outcome-title"
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        isSensitive ? "border-pie-charcoal" : "border-pie-border"
      }`}
    >
      {isSensitive && (
        <p className="bg-pie-charcoal px-6 py-2.5 text-sm font-medium text-white sm:px-8">
          A person will pick this up
        </p>
      )}

      <div className="px-6 py-7 sm:px-8">
        <h2 id="outcome-title" className="text-2xl font-semibold tracking-tight">
          {pathway.title}
        </h2>
        <p className="mt-2 text-[17px] leading-relaxed text-pie-charcoal">
          {pathway.summary}
        </p>

        <div className="mt-7 grid gap-7 sm:grid-cols-2">
          <section>
            <SectionHeading>Why this route?</SectionHeading>
            <p className="mt-2.5 text-[15px] leading-relaxed text-pie-ink/85">
              {pathway.why}
            </p>
          </section>

          <section>
            <SectionHeading>What to have ready</SectionHeading>
            <ul className="mt-2.5 space-y-2 text-[15px] leading-relaxed text-pie-ink/85">
              {pathway.whatToHaveReady.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pie-green-deep"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-7 rounded-xl bg-pie-light p-5">
          <SectionHeading>What happens next</SectionHeading>
          <ol className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-pie-ink/85">
            {WHAT_HAPPENS_NEXT.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pie-green text-xs font-semibold text-pie-ink"
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {pathway.privacyNote && (
          <p className="mt-5 rounded-xl border border-pie-border bg-pie-cream p-4 text-[14px] leading-relaxed text-pie-charcoal">
            {pathway.privacyNote}
          </p>
        )}

        {pathway.showEscalationContacts && (
          <section className="mt-5 rounded-xl border border-pie-border p-5">
            <SectionHeading>Reach Pie&rsquo;s team directly</SectionHeading>
            <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
              {ESCALATION_CONTACTS.map((contact) => (
                <li key={contact.value}>
                  <span className="text-pie-charcoal/70">{contact.label}: </span>
                  <a
                    href={contact.href}
                    className="rounded-sm font-medium underline underline-offset-4 hover:text-pie-charcoal"
                  >
                    {contact.value}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href={pathway.primaryAction.href}
            className="rounded-full bg-pie-green px-6 py-3 text-[15px] font-medium text-pie-ink transition-colors hover:bg-pie-green-deep"
          >
            {pathway.primaryAction.label}
          </a>
          {showContactButton && (
            <a
              href={contactHref}
              className="rounded-full border border-pie-charcoal px-6 py-3 text-[15px] font-medium text-pie-charcoal transition-colors hover:bg-pie-charcoal hover:text-white"
            >
              Speak to our team
            </a>
          )}
        </div>

        {pathway.secondaryLinks && pathway.secondaryLinks.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
            {pathway.secondaryLinks.map((link) => (
              <li key={link.href + link.label}>
                <a
                  href={link.href}
                  className="rounded-sm text-pie-charcoal underline underline-offset-4 hover:text-pie-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-7 border-t border-pie-border pt-5 text-[13px] text-pie-charcoal/75">
          {COMPLIANCE.footer} {COMPLIANCE.unknownRequirement}
        </p>
      </div>
    </article>
  );
}
