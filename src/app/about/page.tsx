import type { Metadata } from "next";
import Image from "next/image";
import { PageEnter, Reveal } from "@/components/motion";
import { card, label, SectionTitle, Timeline } from "@/components/sections";
import { certificates, education, experience, profile, skills } from "@/data/profile";

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
                <div className={`${card} grid gap-6 p-6 sm:grid-cols-[160px_1fr] sm:p-8`}>
                    <Image
                        src="/images/profile.jpg"
                        alt={`Portrait of ${profile.name}`}
                        width={160}
                        height={160}
                        className="size-32 rounded-2xl object-cover sm:size-40"
                    />
                    <div className="space-y-3 leading-relaxed">
                        <p>
                            I studied computer science at NTUST, then economics at National Taipei University. In between I
                            found that financial data is some of the most interesting data there is, and I wanted to
                            understand what it actually means.
                        </p>
                        <p>
                            My master&apos;s thesis brought both sides together: forecasting Bitcoin with an Echo State
                            Network. Since then I have been building on the web side, from Django to ASP.NET Core and now
                            React.
                        </p>
                        <p className="text-muted">Off the keyboard you&apos;ll find me on a badminton court.</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {skills.map((s) => (
                        <div key={s.group} className={`${card} p-5`}>
                            <h3 className="mb-3 font-mono text-xs lowercase text-accent">{s.group}</h3>
                            <ul className="space-y-1 text-sm">
                                {s.items.map((i) => (
                                    <li key={i}>{i}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
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
                                <a
                                    href={c.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between px-6 py-3.5 text-sm transition hover:text-accent"
                                >
                                    {c.name}
                                    <span className="font-mono text-xs text-muted">view ↗</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            </Reveal>
        </PageEnter>
    );
}
