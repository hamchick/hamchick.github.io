import type { TimelineItem } from "@/data/profile";

/** The panel style shared by every block of content. */
export const card = "rounded-2xl border border-line bg-card/85 shadow-sm backdrop-blur-md";

export function Tag({ children }: { children: React.ReactNode }) {
    return <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-muted">{children}</span>;
}

export function SectionTitle({ index, children }: { index: string; children: React.ReactNode }) {
    return (
        <h2 className="mb-6 flex items-baseline gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            <span className="font-mono text-sm text-accent">{index}</span>
            {children}
        </h2>
    );
}

export function Timeline({ items }: { items: TimelineItem[] }) {
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
                            <a
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                className="underline-offset-4 hover:text-ink hover:underline"
                            >
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
