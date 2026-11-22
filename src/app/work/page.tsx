import type { Metadata } from "next";
import { PageEnter, Reveal } from "@/components/motion";
import { card, label, SectionTitle, Tag } from "@/components/sections";
import { profile, projects, thesis } from "@/data/profile";

export const metadata: Metadata = {
    title: `Work · ${profile.name}`,
    description: `Projects and research by ${profile.name}.`,
};

export default function WorkPage() {
    return (
        <PageEnter className="mx-auto max-w-3xl space-y-20 px-4 pb-20 sm:px-6">
            {/* Clears the strip of pond along the top. */}
            <div aria-hidden="true" className="h-[calc(var(--strip-depth)-2.5rem)]" />

            <section>
                <SectionTitle index="01">Projects</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                    {projects.map((p, i) => (
                        <Reveal key={p.title} delay={(i % 2) * 0.08}>
                            <article
                                className={`${card} flex h-full flex-col p-6 transition hover:-translate-y-1 hover:border-accent/60`}
                            >
                                <p className="font-mono text-xs text-muted">{p.kind}</p>
                                <h3 className="mt-1 text-lg font-semibold">{p.title}</h3>
                                <ul className="mt-3 flex-1 list-disc space-y-1.5 pl-4 text-sm leading-relaxed marker:text-accent">
                                    {p.points.map((pt) => (
                                        <li key={pt}>{pt}</li>
                                    ))}
                                </ul>
                                <div className="mt-4 flex flex-wrap gap-1.5">
                                    {p.tags.map((t) => (
                                        <Tag key={t}>{t}</Tag>
                                    ))}
                                </div>
                                {p.links.length > 0 && (
                                    <div className="mt-4 flex gap-4 text-sm font-medium">
                                        {p.links.map((l) => (
                                            <a
                                                key={l.href}
                                                href={l.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-accent hover:underline"
                                            >
                                                {l.label} ↗
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </article>
                        </Reveal>
                    ))}
                </div>
            </section>

            <Reveal>
                <section>
                    <SectionTitle index="02">Research</SectionTitle>
                    <article className={`${card} p-6 sm:p-8`}>
                        <p className={`${label} lowercase`}>Master&apos;s thesis</p>
                        <h3 className="mt-2 text-xl font-semibold">{thesis.title}</h3>
                        <ul className="mt-4 list-disc space-y-2 pl-4 text-sm leading-relaxed marker:text-accent">
                            {thesis.points.map((p) => (
                                <li key={p}>{p}</li>
                            ))}
                        </ul>
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            {thesis.tags.map((t) => (
                                <Tag key={t}>{t}</Tag>
                            ))}
                            <a
                                href={thesis.href}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto text-sm font-medium text-accent hover:underline"
                            >
                                Read the thesis →
                            </a>
                        </div>
                    </article>
                </section>
            </Reveal>
        </PageEnter>
    );
}
