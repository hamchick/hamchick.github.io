import type { TimelineItem } from "@/data/profile";

/**
 * The panel shared by every block of content. The content pages sit on plain page colour, below the strip of pond,
 * so a panel is just a faint frame: flat, like the home page, with nothing to blur.
 */
export const card = "rounded-lg border border-line/80 bg-card/50";

/** A small label over a block, in the home page's monospace. */
export const label = "font-mono text-xs text-muted";

export function Tag({ children }: { children: React.ReactNode }) {
    return <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.6875rem] text-muted">{children}</span>;
}

/**
 * A word in square brackets, the way the home page writes its links: "[ about ]". The space inside the brackets
 * closes up on a phone, where the header has little room.
 */
export function Bracketed({ children }: { children: React.ReactNode }) {
    return (
        <>
            <span className="text-muted">[</span>
            <span className="px-px sm:px-[1ch]">{children}</span>
            <span className="text-muted">]</span>
        </>
    );
}

export function SectionTitle({ index, children }: { index: string; children: React.ReactNode }) {
    return (
        <h2 className="mb-6 flex items-baseline gap-3 font-mono text-xl font-semibold lowercase tracking-tight sm:text-2xl">
            <span className="text-sm font-normal text-accent">
                {index} <span className="text-muted">—</span>
            </span>
            {children}
        </h2>
    );
}

export function Timeline({ items }: { items: TimelineItem[] }) {
    return (
        <ol className="space-y-6">
            {items.map((item) => (
                <li key={item.title + item.period} className="relative border-l border-line pl-5">
                    <span className="absolute -left-[0.3125rem] top-2 size-2.5 rounded-full bg-accent" />
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
