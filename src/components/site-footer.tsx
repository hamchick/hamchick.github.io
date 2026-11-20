"use client";

import { useIsHome } from "@/components/site";
import { card } from "@/components/sections";
import { profile } from "@/data/profile";

export const contactLinks = [
    { label: "GitHub", href: profile.github },
    { label: "Instagram", href: profile.instagram },
];

/** Contact details and credits, at the foot of every content page. The home page keeps them in its card instead. */
export function SiteFooter() {
    const home = useIsHome();
    if (home) return null;
    return (
        <footer id="contact" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:px-6">
            <div className={`${card} p-6 sm:p-8`}>
                <h2 className="text-lg font-semibold">Get in touch</h2>
                <p className="mt-1 text-muted">Open to new opportunities. The quickest way to reach me is email.</p>
                <a href={`mailto:${profile.email}`} className="mt-3 inline-block font-mono text-accent hover:underline">
                    {profile.email}
                </a>
                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                    {contactLinks.map((l) => (
                        <a
                            key={l.label}
                            href={l.href}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-line px-4 py-2 transition hover:border-accent"
                        >
                            {l.label}
                        </a>
                    ))}
                    <a href={profile.cv} className="rounded-full border border-line px-4 py-2 transition hover:border-accent">
                        CV (PDF)
                    </a>
                </div>
            </div>
            <p className="mt-10 text-center font-mono text-xs text-muted">
                Designed &amp; built by {profile.name}. The koi and ducklings are drawn in code.{" "}
                <span className="text-accent">&lt;&apos;)</span>
            </p>
        </footer>
    );
}
