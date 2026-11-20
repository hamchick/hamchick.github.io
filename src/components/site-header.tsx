"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePath, useIsHome } from "@/components/site";
import { navLinks } from "@/components/strip";

// Each link sits on its own frosted pill, so it stays readable over koi swimming past behind it.
const pill = "rounded-full bg-bg/70 px-3 py-1.5 text-sm backdrop-blur-md transition";

/**
 * The header on the content pages. It sits over the strip of pond along the top, so empty water around the links
 * can still be clicked to feed the koi. The home page is the pond itself and has no header.
 */
export function SiteHeader() {
    const path = usePath();
    const home = useIsHome();
    if (home) return null;
    return (
        <header className="fixed inset-x-0 top-0 z-30">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
                <Link href="/" className={`${pill} font-mono font-semibold`} title="Back to the pond">
                    hamchick<span className="text-accent">.</span>
                </Link>
                <nav className="flex items-center gap-1.5 sm:gap-2">
                    {navLinks.map((n) => {
                        const active = path === n.href.replace(/\/$/, "");
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                aria-current={active ? "page" : undefined}
                                className={`${pill} ${active ? "text-ink" : "text-muted hover:text-ink"}`}
                            >
                                {n.label}
                            </Link>
                        );
                    })}
                    <a href="#contact" className={`${pill} text-muted hover:text-ink`}>
                        Contact
                    </a>
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}
