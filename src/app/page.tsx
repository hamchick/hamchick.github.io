import Image from "next/image";
import { DuckPond } from "@/components/duck-pond/duck-pond";
import { Reveal, RotatingWord } from "@/components/motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { certificates, education, experience, profile, projects, skills, thesis, type TimelineItem } from "@/data/profile";

const nav = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#research", label: "Research" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

const card = "rounded-2xl border border-line bg-card/85 shadow-sm backdrop-blur-md";

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-muted">{children}</span>;
}

function SectionTitle({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <h2 className="mb-6 flex items-baseline gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
      <span className="font-mono text-sm text-accent">{index}</span>
      {children}
    </h2>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-6">
      {items.map((item) => (
        <li key={item.title + item.period} className="relative border-l border-line pl-5">
          <span className="absolute -left-[5px] top-2 size-2.5 rounded-full bg-accent" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h4 className="font-medium">{item.title}</h4>
            <span className="font-mono text-xs text-muted">{item.period}</span>
          </div>
          <p className="text-sm text-muted">
            {item.href ? (
              <a href={item.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-ink hover:underline">
                {item.org}
              </a>
            ) : (
              item.org
            )}
            {" · "}
            {item.place}
          </p>
          {item.points && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm marker:text-accent">
              {item.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function Home() {
  return (
    <>
      <DuckPond />

      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/70 backdrop-blur-md" data-pond-ignore>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="font-mono text-sm font-semibold">
            hamchick<span className="text-accent">.</span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-2">
            <div className="hidden gap-1 sm:flex">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-sm text-muted transition hover:bg-card hover:text-ink">
                  {n.label}
                </a>
              ))}
            </div>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="top">
        {/* Hero: mostly open water so the ducks have room. */}
        <section className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-5xl items-center px-4 sm:px-6">
          <Reveal>
            <div data-pond-avoid className="max-w-2xl">
              <p className="mb-4 font-mono text-sm text-muted">Hi, I&apos;m</p>
              <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">{profile.name}</h1>
              <p className="mt-5 text-2xl leading-snug text-muted sm:text-3xl">
                CS × Economics, into <RotatingWord words={profile.focus} />
              </p>
              <p className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg">{profile.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#projects" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85">
                  See my work
                </a>
                <a href={profile.cv} className="rounded-full border border-line bg-card/70 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-accent">
                  Download CV
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        <div className="mx-auto max-w-3xl space-y-24 px-4 pb-24 sm:px-6">
          {/* About */}
          <section id="about" className="scroll-mt-20">
            <Reveal>
              <SectionTitle index="01">About</SectionTitle>
              <div data-pond-avoid className={`${card} grid gap-6 p-6 sm:grid-cols-[160px_1fr] sm:p-8`}>
                <Image
                  src="/images/profile.jpg"
                  alt={`Portrait of ${profile.name}`}
                  width={160}
                  height={160}
                  className="size-32 rounded-2xl object-cover sm:size-40"
                />
                <div className="space-y-3 leading-relaxed">
                  <p>
                    I studied computer science at NTUST, then economics at National Taipei University. In between I found that
                    financial data is some of the most interesting data there is, and I wanted to understand what it actually means.
                  </p>
                  <p>
                    My master&apos;s thesis brought both sides together: forecasting Bitcoin with an Echo State Network. Since then
                    I have been building on the web side, from Django to ASP.NET Core and now React.
                  </p>
                  <p className="text-muted">Off the keyboard you&apos;ll find me on a badminton court.</p>
                </div>
              </div>
              <div data-pond-avoid className="mt-4 grid gap-4 sm:grid-cols-3">
                {skills.map((s) => (
                  <div key={s.group} className={`${card} p-5`}>
                    <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-accent">{s.group}</h3>
                    <ul className="space-y-1 text-sm">
                      {s.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>

          {/* Experience & education */}
          <section id="experience" className="scroll-mt-20">
            <Reveal>
              <SectionTitle index="02">Experience &amp; Education</SectionTitle>
              <div data-pond-avoid className={`${card} grid gap-10 p-6 sm:p-8`}>
                <div>
                  <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted">Experience</h3>
                  <Timeline items={experience} />
                </div>
                <div>
                  <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted">Education</h3>
                  <Timeline items={education} />
                </div>
              </div>
            </Reveal>
          </section>

          {/* Research */}
          <section id="research" className="scroll-mt-20">
            <Reveal>
              <SectionTitle index="03">Research</SectionTitle>
              <article data-pond-avoid className={`${card} p-6 sm:p-8`}>
                <p className="font-mono text-xs uppercase tracking-wider text-muted">Master&apos;s thesis</p>
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
                  <a href={thesis.href} target="_blank" rel="noreferrer" className="ml-auto text-sm font-medium text-accent hover:underline">
                    Read the thesis →
                  </a>
                </div>
              </article>
            </Reveal>
          </section>

          {/* Projects */}
          <section id="projects" className="scroll-mt-20">
            <Reveal>
              <SectionTitle index="04">Projects</SectionTitle>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((p, i) => (
                <Reveal key={p.title} delay={(i % 2) * 0.08}>
                  <article data-pond-avoid className={`${card} flex h-full flex-col p-6 transition hover:-translate-y-1 hover:border-accent/60`}>
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
                    <div className="mt-4 flex gap-4 text-sm font-medium">
                      {p.links.map((l) => (
                        <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Certificates */}
          <section id="certificates" className="scroll-mt-20">
            <Reveal>
              <SectionTitle index="05">Certificates</SectionTitle>
              <ul data-pond-avoid className={`${card} divide-y divide-line`}>
                {certificates.map((c) => (
                  <li key={c.name}>
                    <a href={c.href} target="_blank" rel="noreferrer" className="flex items-center justify-between px-6 py-3.5 text-sm transition hover:text-accent">
                      {c.name}
                      <span className="font-mono text-xs text-muted">view ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>

          {/* Contact */}
          <section id="contact" className="scroll-mt-20">
            <Reveal>
              <SectionTitle index="06">Contact</SectionTitle>
              <div data-pond-avoid className={`${card} p-6 sm:p-8`}>
                <p className="text-lg">Open to new opportunities. The quickest way to reach me is email.</p>
                <a href={`mailto:${profile.email}`} className="mt-3 inline-block font-mono text-accent hover:underline">
                  {profile.email}
                </a>
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  {[
                    { label: "GitHub", href: profile.github },
                    { label: "Instagram", href: profile.instagram },
                    { label: "CV (PDF)", href: profile.cv },
                  ].map((l) => (
                    <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 transition hover:border-accent">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>
        </div>
      </main>

      <footer className="pb-16 text-center font-mono text-xs text-muted">
        <p>
          Designed &amp; built by {profile.name}. The ducks are hand-drawn ASCII. <span className="text-accent">&lt;&apos;)</span>
        </p>
      </footer>
    </>
  );
}
