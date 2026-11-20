import type { Metadata } from "next";
import Link from "next/link";
import { PageEnter } from "@/components/motion";
import { Bracketed, SectionTitle } from "@/components/sections";
import { navLinks } from "@/components/strip";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
    title: `Not found · ${profile.name}`,
};

const link = "transition hover:text-accent";

/**
 * The page for an address that isn't here. The static export writes it out as 404.html, which GitHub Pages serves
 * for any missing path, so it is laid out like the other content pages, with the strip of pond along the top.
 */
export default function NotFound() {
    return (
        <PageEnter className="mx-auto min-h-[60svh] max-w-3xl space-y-20 px-4 pb-20 sm:px-6">
            {/* Clears the strip of pond along the top. */}
            <div aria-hidden="true" className="h-[calc(var(--strip-depth)-2.5rem)]" />

            <section>
                <SectionTitle index="404">Nothing here</SectionTitle>
                <div className="font-mono">
                    <p className="max-w-md text-sm leading-relaxed text-muted">
                        This part of the pond is empty. The page may have moved, or swum off somewhere.{" "}
                        <span className="text-accent">&lt;&apos;)))&gt;&lt;</span>
                    </p>
                    <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <Link href="/" className={`${link} text-accent`}>
                            <Bracketed>back to the pond</Bracketed>
                        </Link>
                        {navLinks.map((n) => (
                            <Link key={n.href} href={n.href} className={link}>
                                <Bracketed>{n.label.toLowerCase()}</Bracketed>
                            </Link>
                        ))}
                    </nav>
                </div>
            </section>
        </PageEnter>
    );
}
