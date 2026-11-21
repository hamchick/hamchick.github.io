"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { Bracketed } from "@/components/sections";
import { contactLinks } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePath, useIsHome } from "@/components/site";
import { navLinks } from "@/components/strip";
import { profile } from "@/data/profile";

// The logo and the links each sit on a frosted backing, so they stay readable over koi swimming past behind them.
const backing = "rounded-full bg-bg/70 backdrop-blur-md";
const link = "transition hover:text-accent";
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The header on the content pages, written like the home page's links: monospace words in square brackets. It sits
 * over the strip of pond along the top, so empty water around the links can still be clicked to feed the koi. On the
 * home page it shows only on a wider screen: a phone gives the whole screen to the pond, and the card's links do.
 */
export function SiteHeader() {
    const path = usePath();
    const home = useIsHome();
    const reduce = useReducedMotion();
    // The home page has no footer to scroll to, so there contact drops down right below the header instead.
    const [contact, setContact] = useState(false);
    const contactRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contact) return;
        const outside = (e: PointerEvent) => {
            if (!contactRef.current?.contains(e.target as Node)) setContact(false);
        };
        const escape = (e: KeyboardEvent) => e.key === "Escape" && setContact(false);
        document.addEventListener("pointerdown", outside);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("pointerdown", outside);
            document.removeEventListener("keydown", escape);
        };
    }, [contact]);

    // Leaving the home page closes it.
    useEffect(() => setContact(false), [path]);

    return (
        <header className={`fixed inset-x-0 top-0 z-30 ${home ? "hidden sm:block" : ""}`}>
            <div className="mx-auto flex h-(--strip-slim) max-w-5xl items-center justify-between gap-2 px-4 font-mono sm:px-6">
                <Link href="/" className={`${backing} ${link} flex items-center px-2 py-1.5 text-xs sm:px-3 font-semibold sm:text-sm`} title="Back to the pond">
                    <Logo />
                </Link>
                <div ref={contactRef} className="relative flex items-center gap-1.5 sm:gap-2">
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
                        {home ? (
                            <button
                                type="button"
                                aria-expanded={contact}
                                onClick={() => setContact((c) => !c)}
                                className={`${link} ${contact ? "text-accent" : ""}`}
                            >
                                <Bracketed>contact</Bracketed>
                            </button>
                        ) : (
                            <a href="#contact" className={link}>
                                <Bracketed>contact</Bracketed>
                            </a>
                        )}
                        {/* The footer has the CV too, so on a phone it gives its room to the other links. */}
                        <a href={profile.cv} className={`${link} hidden sm:inline`}>
                            <Bracketed>cv ↓</Bracketed>
                        </a>
                    </nav>
                    <div className={backing}>
                        <ThemeToggle />
                    </div>
                    <AnimatePresence>
                        {home && contact && (
                            <motion.div
                                data-pond-ignore
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                                className="absolute right-0 top-full mt-2 rounded-2xl border border-line bg-bg/85 px-4 py-3 text-sm shadow-sm backdrop-blur-md"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-muted">↳</span>
                                    <a href={`mailto:${profile.email}`} className="text-accent hover:underline">
                                        {profile.email}
                                    </a>
                                </div>
                                <div className="mt-1.5 flex gap-x-5 pl-5">
                                    {contactLinks.map((l) => (
                                        <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="text-muted hover:text-ink">
                                            {l.label.toLowerCase()} ↗
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
