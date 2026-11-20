"use client";

import { useIsHome } from "@/components/site";
import { Bracketed } from "@/components/sections";
import { profile } from "@/data/profile";

export const contactLinks = [
    { label: "GitHub", href: profile.github },
    { label: "Instagram", href: profile.instagram },
];

/**
 * Contact details and credits, at the foot of every content page, written like the home page: monospace, links in
 * square brackets, no frame. The home page keeps them in its own contact line instead.
 */
export function SiteFooter() {
    const home = useIsHome();
    if (home) return null;
    return (
        <footer id="contact" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:px-6">
            <div className="border-t border-line pt-10">
                <h2 className="mb-4 font-mono text-xl font-semibold tracking-tight sm:text-2xl">
                    <span className="mr-3 text-sm font-normal text-accent">~</span>get in touch
                </h2>
                <div className="font-mono">
                    <p className="text-sm text-muted">Open to new opportunities. The quickest way to reach me is email.</p>
                    <a href={`mailto:${profile.email}`} className="mt-3 inline-block text-accent hover:underline">
                        {profile.email}
                    </a>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        {contactLinks.map((l) => (
                            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="transition hover:text-accent">
                                <Bracketed>{l.label.toLowerCase()} ↗</Bracketed>
                            </a>
                        ))}
                        <a href={profile.cv} className="transition hover:text-accent">
                            <Bracketed>cv ↓</Bracketed>
                        </a>
                    </div>
                </div>
            </div>
            <p className="mt-12 text-center font-mono text-xs text-muted">
                Designed &amp; built by {profile.name}. The koi and ducklings are drawn in code.{" "}
                <span className="text-accent">&lt;&apos;)))&gt;&lt;</span>
            </p>
        </footer>
    );
}
