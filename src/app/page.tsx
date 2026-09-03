import { PathwayModule } from "@/components/PathwayModule";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-pie-cream">
          <div className="mx-auto max-w-5xl px-5 pb-14 pt-16 sm:pb-20 sm:pt-24">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pie-charcoal/70">
              Boutique. Bespoke. For you.
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              We manage your investments so you can focus on what you love.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pie-charcoal">
              Whether you&rsquo;re starting KiwiSaver, investing outside it, or
              looking after a family trust, the first step is finding the right
              place to start. That&rsquo;s what this page is for.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-5 pb-4">
          <PathwayModule />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
