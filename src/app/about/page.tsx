import type { Metadata } from "next";
import Image from "next/image";
import { PageEnter, Reveal } from "@/components/motion";
import { card, label, SectionTitle, Tag, Timeline } from "@/components/sections";
import { certificates, education, experience, profile, skills } from "@/data/profile";

/** The route from school to now, one stop per chip. */
const path: [string, string][] = [
    ["Computer science", "2016"],
    ["M.A. Economics", "2020"],
    ["5 financial licences", "2022"],
    ["Bank tech rotations", "2023"],
    ["LLM engineer", "2025"],
];

/** Short side facts, label then value. */
const facts: [string, string][] = [
    ["used to", "Grind LeetCode for the streak, until AI showed up and hand‑coding stopped being a thing"],
    ["hooked on", "Putting AI on my hobbies too: Japanese practice, diet, training"],
    ["off-screen", "Running twice a week, table tennis now and then, surfing and skiing next"],
];

export const metadata: Metadata = {
    title: `About · ${profile.name}`,
    description: `About ${profile.name}: background, skills, experience, education and certificates.`,
};

export default function AboutPage() {
    return (
        <PageEnter className="mx-auto max-w-3xl space-y-20 px-4 pb-20 sm:px-6">
            {/* Clears the strip of pond along the top. */}
            <div aria-hidden="true" className="h-[calc(var(--strip-depth)-2.5rem)]" />

            <section>
                <SectionTitle index="01">About</SectionTitle>
                <div className={`${card} space-y-6 p-6 leading-relaxed sm:p-8`}>
                    <div className="flex items-center gap-4 sm:gap-5">
                        <Image
                            src="/images/profile.jpg"
                            alt={`Portrait of ${profile.name}`}
                            width={160}
                            height={160}
                            className="size-16 shrink-0 rounded-xl object-cover sm:size-[4.5rem]"
                        />
                        <p className="text-lg font-medium sm:text-xl">I build LLM assistants at CTBC Bank.</p>
                    </div>

                    <p className="text-pretty">
                        I&apos;m a bit of a <strong className="font-semibold text-accent">progress addict</strong>: exams,
                        streaks, anything with a next step. It&apos;s how I got from CS to finance to LLMs. The one rule:
                        I judge myself by what I can build.
                    </p>

                    <div className="grid gap-6 border-t border-line/60 pt-6 sm:grid-cols-2 sm:gap-10">
                        <div>
                            <h3 className={`${label} mb-3 lowercase`}>how I got here</h3>
                            <ol className="text-sm">
                                {path.map(([step, year], i) => {
                                    const last = i === path.length - 1;
                                    return (
                                        <li key={step} className="relative flex items-baseline justify-between gap-4 pb-2 pl-5 last:pb-0">
                                            {/* The line down to the next stop, then the stop itself. */}
                                            {!last && <span aria-hidden="true" className="absolute left-[0.25rem] top-[0.6rem] h-full border-l border-line" />}
                                            <span
                                                aria-hidden="true"
                                                className={`absolute left-0 top-[0.4rem] size-2.5 rounded-full border ${last ? "border-accent bg-accent" : "border-muted bg-card"}`}
                                            />
                                            <span className={last ? "font-medium text-accent" : ""}>{step}</span>
                                            <span className="font-mono text-xs text-muted">{year}</span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        <dl className="space-y-3 text-sm">
                            {facts.map(([k, v]) => (
                                <div key={k}>
                                    <dt className={`${label} lowercase`}>{k}</dt>
                                    <dd className="text-pretty">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
                <dl className={`${card} mt-4 divide-y divide-line/60`}>
                    {skills.map((s) => (
                        <div key={s.group} className="grid gap-2 px-6 py-4 sm:grid-cols-[8rem_1fr] sm:items-baseline">
                            <dt className="font-mono text-xs lowercase text-accent">{s.group}</dt>
                            <dd className="flex flex-wrap gap-1.5">
                                {s.core.map((i) => (
                                    <span
                                        key={i}
                                        className="rounded-full border border-accent/60 bg-accent/10 px-2 py-0.5 font-mono text-[0.6875rem] text-accent"
                                    >
                                        {i}
                                    </span>
                                ))}
                                {s.items.map((i) => (
                                    <Tag key={i}>{i}</Tag>
                                ))}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            <Reveal>
                <section>
                    <SectionTitle index="02">Experience &amp; Education</SectionTitle>
                    <div className={`${card} grid gap-10 p-6 sm:p-8`}>
                        <div>
                            <h3 className={`${label} mb-4 lowercase`}>Experience</h3>
                            <Timeline items={experience} />
                        </div>
                        <div>
                            <h3 className={`${label} mb-4 lowercase`}>Education</h3>
                            <Timeline items={education} />
                        </div>
                    </div>
                </section>
            </Reveal>

            <Reveal>
                <section>
                    <SectionTitle index="03">Certificates</SectionTitle>
                    <ul className={`${card} divide-y divide-line`}>
                        {certificates.map((c) => (
                            <li key={c.name}>
                                {c.href ? (
                                    <a
                                        href={c.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between gap-4 px-6 py-3.5 text-sm transition hover:text-accent"
                                    >
                                        {c.name}
                                        <span className="shrink-0 font-mono text-xs text-muted">{c.date} · view ↗</span>
                                    </a>
                                ) : (
                                    <div className="flex items-center justify-between gap-4 px-6 py-3.5 text-sm">
                                        {c.name}
                                        <span className="shrink-0 font-mono text-xs text-muted">{c.date}</span>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            </Reveal>
        </PageEnter>
    );
}
