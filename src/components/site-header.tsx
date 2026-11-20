"use client";

import Link from "next/link";
import { Bracketed } from "@/components/sections";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePath, useIsHome } from "@/components/site";
import { navLinks } from "@/components/strip";
import { profile } from "@/data/profile";

// The logo and the links each sit on a frosted backing, so they stay readable over koi swimming past behind them.
const backing = "rounded-full bg-bg/70 backdrop-blur-md";
const link = "transition hover:text-accent";

/**
 * The header on the content pages, written like the home page's links: monospace words in square brackets. It sits
 * over the strip of pond along the top, so empty water around the links can still be clicked to feed the koi. The
 * home page is the pond itself and has no header.
 */
export function SiteHeader() {
    const path = usePath();
    const home = useIsHome();
    if (home) return null;
    return (
        <header className="fixed inset-x-0 top-0 z-30">
            <div className="mx-auto flex h-(--strip-slim) max-w-5xl items-center justify-between gap-2 px-4 font-mono sm:px-6">
                <Link href="/" className={`${backing} ${link} px-2 py-1.5 text-xs sm:px-3 font-semibold sm:text-sm`} title="Back to the pond">
                    hamchick<span className="text-accent">.</span>
                </Link>
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <nav className={`${backing} flex items-center gap-1.5 px-2 py-1.5 text-xs sm:gap-4 sm:px-3 sm:text-sm`}>
                        {navLinks.map((n) => {
                            const active = path === n.href.replace(/\/$/, "");
                            return (
                                <Link
                                    key={n.href}
                                    href={n.href}
                                    aria-current={active ? "page" : undefined}
                                    className={`${link} ${active ? "text-accent" : ""}`}
                                >
                                    <Bracketed>{n.label.toLowerCase()}</Bracketed>
                                </Link>
                            );
                        })}
                        <a href="#contact" className={link}>
                            <Bracketed>contact</Bracketed>
                        </a>
                        {/* The footer has the CV too, so on a phone it gives its room to the other links. */}
                        <a href={profile.cv} className={`${link} hidden sm:inline`}>
                            <Bracketed>cv ↓</Bracketed>
                        </a>
                    </nav>
                    <div className={backing}>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
