"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { POND_FEED_EVENT } from "@/components/koi-pond/koi-pond";
import { MosaicName } from "@/components/mosaic-name";
import { RotatingWord } from "@/components/motion";
import { contactLinks } from "@/components/site-footer";
import { profile } from "@/data/profile";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fires each time someone throws food into the pond. */
function useFed(onFed: () => void) {
    const latest = useRef(onFed);
    useEffect(() => {
        latest.current = onFed;
    });
    useEffect(() => {
        const handler = () => latest.current();
        window.addEventListener(POND_FEED_EVENT, handler);
        return () => window.removeEventListener(POND_FEED_EVENT, handler);
    }, []);
}

const links = [
    { href: "/about/", label: "about" },
    { href: "/work/", label: "work" },
];

const bracket = "transition hover:text-accent";

/**
 * Who this is, floating on the pond on the home page, in the pond's own style: the name built from tiles like the
 * koi's, the rest in monospace, the ways in as bracketed words, and no frame around any of it. It keeps to the left,
 * leaving the middle of the pond to the koi, and stays put while they're fed. Contact opens the ways to reach me
 * right below the links.
 */
export function HomeCard() {
    const reduce = useReducedMotion();
    const [contact, setContact] = useState(false);

    return (
        // Low on a phone, where the text spans the width; against the left edge and centred down a wider screen.
        <div className="pointer-events-none fixed inset-0 z-10 flex items-end px-4 pb-16 sm:items-center sm:px-12 sm:pb-0">
            <div className="pointer-events-auto w-full max-w-2xl">
                <h1 className="sr-only">{profile.name}</h1>
                {/* The name floats on the water: koi swim on beneath it, showing between the tiles. */}
                <MosaicName text={profile.name} className="w-full" />
                {/* The words below steer the koi aside and dim them, so they stay easy to read. */}
                <div data-pond-avoid className="font-mono">
                    {/* The header logo says hamchick, so tie it to the name: tucked right under it, as its subtitle. */}
                    <p className="mt-1 text-sm text-muted sm:mt-2 sm:text-base">
                        aka <span className="text-ink">{profile.handle}</span>
                        <span className="text-accent">.</span>
                    </p>
                    <p className="mt-6 text-base leading-snug text-muted sm:mt-8 sm:text-lg">
                        CS × Economics, into <RotatingWord words={profile.focus} />
                    </p>
                    <p className="mt-3 max-w-lg whitespace-pre-line text-sm leading-relaxed sm:text-base">{profile.intro}</p>
                    <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm sm:mt-7">
                        {links.map((l) => (
                            <Link key={l.href} href={l.href} className={bracket}>
                                <span className="text-muted">[</span> {l.label} <span className="text-muted">]</span>
                            </Link>
                        ))}
                        <button
                            type="button"
                            aria-expanded={contact}
                            onClick={() => setContact((c) => !c)}
                            className={`${bracket} ${contact ? "text-accent" : ""}`}
                        >
                            <span className="text-muted">[</span> contact <span className="text-muted">]</span>
                        </button>
                        {profile.cv && (
                            <a href={profile.cv} className={bracket}>
                                <span className="text-muted">[</span> cv ↓ <span className="text-muted">]</span>
                            </a>
                        )}
                    </nav>
                    <AnimatePresence initial={false}>
                        {contact && (
                            <motion.div
                                key="contact"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                                    <span className="text-muted">↳</span>
                                    <a href={`mailto:${profile.email}`} className="text-accent hover:underline">
                                        {profile.email}
                                    </a>
                                    {contactLinks.map((l) => (
                                        <a
                                            key={l.label}
                                            href={l.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-muted hover:text-ink"
                                        >
                                            {l.label.toLowerCase()} ↗
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

/** The nudge to feed the koi, until someone does. */
export function FeedHint() {
    const [fed, setFed] = useState(false);
    useFed(() => setFed(true));
    return (
        <AnimatePresence>
            {!fed && (
                <motion.div
                    data-pond-ignore
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 1.2, duration: 0.6 } }}
                    exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    className="pointer-events-none fixed left-4 top-4 z-20 max-w-[calc(100%-5rem)] rounded-2xl border border-line bg-card/80 px-3 py-1.5 font-mono text-xs text-muted shadow-sm backdrop-blur sm:left-auto sm:right-6 sm:top-auto sm:bottom-6 sm:max-w-none sm:rounded-full"
                >
                    <span className="sm:hidden">tap the water to feed the koi · up top, the ducklings</span>
                    <span className="hidden sm:inline">click the water to feed the koi, or up top, the ducklings</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
