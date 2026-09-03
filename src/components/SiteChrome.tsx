/**
 * Header and footer. The wordmark is styled text, never the real logo, and
 * every navigation link points at a URL verified in pie-funds-brand.md.
 */

import { COMPLIANCE, CONTACTS } from "@/lib/config";
import { ACTION_URLS, NAV_LINKS, absoluteUrl } from "@/lib/routes";

export function Wordmark({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span
      className={`text-xl font-semibold tracking-tight ${
        tone === "light" ? "text-white" : "text-pie-ink"
      }`}
    >
      Pie
      <span className={tone === "light" ? "text-pie-green" : "text-pie-charcoal"}>
        {" "}
        Funds
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="bg-pie-charcoal text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">
        <a
          href={absoluteUrl("/")}
          className="rounded-sm"
          aria-label="Pie Funds home"
        >
          <Wordmark />
        </a>

        <nav aria-label="Main" className="order-3 w-full lg:order-none lg:w-auto">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={absoluteUrl(link.href)}
                  className="rounded-sm text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <a
            href={absoluteUrl(ACTION_URLS.investorPortalGuide)}
            className="rounded-sm text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Log in
          </a>
          <a
            href={absoluteUrl(ACTION_URLS.fundsApplyOnline)}
            className="rounded-full bg-pie-green px-4 py-2 font-medium text-pie-ink transition-colors hover:bg-pie-green-deep"
          >
            Invest with Pie
          </a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-pie-charcoal text-white">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-sm text-sm text-white/70">
              Boutique, New Zealand-owned KiwiSaver, investment fund and wealth
              manager. Helping Kiwis grow their wealth since 2007.
            </p>
          </div>

          <div className="text-sm">
            <h2 className="font-medium">Talk to us</h2>
            <ul className="mt-3 space-y-1.5 text-white/75">
              <li>
                <a
                  className="rounded-sm underline-offset-4 hover:text-white hover:underline"
                  href={`tel:${CONTACTS.phoneNz.replace(/\s/g, "")}`}
                >
                  {CONTACTS.phoneNz}
                </a>
                <span className="text-white/45"> (NZ)</span>
              </li>
              <li>
                <a
                  className="rounded-sm underline-offset-4 hover:text-white hover:underline"
                  href={`tel:${CONTACTS.phoneInternational.replace(/\s/g, "")}`}
                >
                  {CONTACTS.phoneInternational}
                </a>
                <span className="text-white/45"> (international)</span>
              </li>
              <li>
                <a
                  className="rounded-sm underline-offset-4 hover:text-white hover:underline"
                  href={`mailto:${CONTACTS.clientEmail}`}
                >
                  {CONTACTS.clientEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/15 pt-6 text-sm text-white/60">
          {COMPLIANCE.prototype}
        </p>
      </div>
    </footer>
  );
}
