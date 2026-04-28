import Link from 'next/link';
import { ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/marketing';
import type { LegalDocument } from '@/lib/legal-documents';

export function LegalDocumentPage({
  document,
  canonicalPath,
}: {
  document: LegalDocument;
  canonicalPath: string;
}) {
  const sectionLinks = document.sections.map((section) => ({
    id: `legal-section-${section.number}`,
    label: `${section.number}. ${section.title}`,
  }));

  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-white/6 py-14 md:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(0,255,157,0.12),transparent_26%),radial-gradient(circle_at_82%_16%,rgba(57,255,20,0.09),transparent_24%),linear-gradient(180deg,rgba(1,50,32,0.42),rgba(0,0,0,0.02))]" />
        </div>
        <div className="relative mx-auto grid max-w-[1680px] gap-8 px-5 sm:px-6 lg:grid-cols-12 xl:px-10">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-brand-green/20 bg-brand-green/[0.08] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">
              <FileText className="h-4 w-4" />
              Legal
            </div>
            <h1 className="mt-6 max-w-5xl text-4xl font-semibold uppercase leading-[0.96] text-white sm:text-5xl md:text-7xl xl:text-[5.7rem]">
              {document.title}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#E5E7EB]">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                Effective Date: <span className="text-white">{document.effectiveDate}</span>
              </span>
              {document.companyName ? (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                  Company Name: <span className="text-white">{document.companyName}</span>
                </span>
              ) : null}
            </div>
            <p className="mt-6 max-w-4xl text-base leading-8 text-[#E5E7EB] md:text-xl md:leading-9">
              {document.intro[0]}
            </p>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.95),rgba(0,0,0,0.95))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.4)] lg:sticky lg:top-28">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">Document map</p>
                  <p className="mt-2 text-sm text-[#E5E7EB]">Navigate this policy or copy the canonical page.</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-brand-green" />
              </div>
              <nav className="mt-5 space-y-2" aria-label={`${document.title} sections`}>
                {sectionLinks.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-white transition hover:border-brand-green/22 hover:bg-brand-green/[0.05] hover:text-white"
                  >
                    <span>{section.label}</span>
                    <ChevronRight className="h-4 w-4 text-brand-green" />
                  </a>
                ))}
              </nav>
              <div className="mt-5 rounded-[1.2rem] border border-brand-green/16 bg-brand-green/[0.05] p-4 text-sm leading-6 text-[#E5E7EB]">
                Canonical path:{' '}
                <Link href={canonicalPath} className="text-brand-green transition hover:text-[#39FF14]">
                  {canonicalPath}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="relative py-10 md:py-16">
        <div className="mx-auto grid max-w-[1680px] gap-6 px-5 sm:px-6 lg:grid-cols-12 xl:px-10">
          <article className="lg:col-span-8">
            <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.96),rgba(0,0,0,0.96))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.42)] md:p-8">
              <div className="space-y-6 border-b border-white/8 pb-8">
                {document.intro.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-8 text-[#E5E7EB]">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-8 space-y-8">
                {document.sections.map((section) => (
                  <section key={section.number} id={`legal-section-${section.number}`} className="scroll-mt-28">
                    <div className="flex items-start gap-4">
                      <span className="mt-1 flex h-9 min-w-9 items-center justify-center rounded-full border border-brand-green/20 bg-brand-green/[0.08] font-mono text-[11px] font-semibold text-brand-green">
                        {section.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-semibold text-white md:text-3xl">{section.title}</h2>
                        {section.paragraphs?.map((paragraph) => (
                          <p key={`${section.number}-${paragraph}`} className="mt-4 text-base leading-8 text-[#E5E7EB]">
                            {paragraph}
                          </p>
                        ))}
                        {section.bullets?.length ? (
                          <ul className="mt-4 space-y-3 pl-5 text-base leading-8 text-[#E5E7EB]">
                            {section.bullets.map((item) => (
                              <li key={`${section.number}-${item}`} className="list-disc marker:text-brand-green">
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {section.subsections?.length ? (
                          <div className="mt-5 space-y-5">
                            {section.subsections.map((subsection) => (
                              <div key={`${section.number}-${subsection.title}`} className="rounded-[1.25rem] border border-white/8 bg-white/[0.035] p-4 md:p-5">
                                <h3 className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-brand-green">
                                  {subsection.title}
                                </h3>
                                {subsection.paragraphs?.map((paragraph) => (
                                  <p key={`${section.number}-${subsection.title}-${paragraph}`} className="mt-3 text-base leading-8 text-[#E5E7EB]">
                                    {paragraph}
                                  </p>
                                ))}
                                {subsection.bullets?.length ? (
                                  <ul className="mt-3 space-y-3 pl-5 text-base leading-8 text-[#E5E7EB]">
                                    {subsection.bullets.map((item) => (
                                      <li key={`${section.number}-${subsection.title}-${item}`} className="list-disc marker:text-brand-green">
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </article>

          <aside className="hidden lg:col-span-4 lg:block">
            <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,20,15,0.96),rgba(0,0,0,0.96))] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand-green">Support</p>
              <h2 className="mt-3 text-xl font-semibold text-white">Questions about this document?</h2>
              <p className="mt-3 text-sm leading-7 text-[#E5E7EB]">
                Reach Burner Point through the official support paths listed in the dashboard, help center, or website footer.
              </p>
              <div className="mt-5 grid gap-3">
                <Link
                  href="/help-center"
                  className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white transition hover:border-brand-green/22 hover:text-white"
                >
                  Open Help Center
                </Link>
                <Link
                  href="/contact"
                  className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white transition hover:border-brand-green/22 hover:text-white"
                >
                  Contact Burner Point
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </MarketingShell>
  );
}
