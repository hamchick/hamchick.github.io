"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
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

/**
 * Who this is, floating on the pond on the home page, in the pond's own style: the name built from tiles like the
 * koi's, the rest in monospace, the ways in as bracketed words. No frame around any of it.
 *
 * The first time someone feeds the koi it gets out of the way: the tiled name shrinks and glides down to the
 * bottom-left corner, turning into a small monospace name, while the rest fades. Clicking that small name (a "↖"
 * appears on hover) brings everything back to where it started; the next feed shrinks it again. Contact, from the
 * small version, opens the full one with the ways to reach me showing.
 */
export function HomeCard() {
    const reduce = useReducedMotion();
    const [shrunk, setShrunk] = useState(false);
    const [contact, setContact] = useState(false);

    useFed(() => {
        setShrunk(true);
        setContact(false);
    });

    const transition = { duration: reduce ? 0 : 0.6, ease: EASE };
    const fade = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.2 } },
        exit: { opacity: 0, transition: { duration: reduce ? 0 : 0.2 } },
    };

    return (
        // Full, it sits low on a phone and to the left of centre on a wider screen; shrunk, in the bottom-left corner.
        <div
            className={`pointer-events-none fixed inset-0 z-10 flex px-4 pb-6 sm:px-10 sm:pb-8 ${
                shrunk ? "items-end" : "items-end pb-16 sm:items-center sm:pb-0 lg:pl-[max(2.5rem,calc((100vw-64rem)/2+1.5rem))]"
            }`}
        >
            <LayoutGroup>
                {shrunk ? (
                    <motion.div
                        key="small"
                        layout
                        transition={transition}
                        data-pond-avoid
                        className="pointer-events-auto relative font-mono"
                    >
                        {/* A soft, unframed shade behind the words, so they read when koi swim beneath. */}
                        <div aria-hidden="true" className="absolute -inset-4 -z-10 rounded-[2rem] bg-bg/70 blur-xl" />
                        <motion.button
                            layoutId="name"
                            transition={transition}
                            type="button"
                            onClick={() => setShrunk(false)}
                            className="group flex items-center gap-2 text-sm font-semibold"
                            title="Show more"
                        >
                            {profile.name}
                            <span
                                aria-hidden="true"
                                className="text-xs text-muted opacity-60 transition group-hover:text-accent group-hover:opacity-100 sm:opacity-0"
                            >
                                ↖
                            </span>
                        </motion.button>
                        <motion.nav {...fade} className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                            {links.map((l) => (
                                <Link key={l.href} href={l.href} className="transition hover:text-ink">
                                    {l.label}
                                </Link>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setShrunk(false);
                                    setContact(true);
                                }}
                                className="transition hover:text-ink"
                            >
                                contact
                            </button>
                            <a href={profile.cv} className="transition hover:text-ink">
                                cv ↓
                            </a>
                        </motion.nav>
                    </motion.div>
                ) : (
                    <motion.div key="full" layout transition={transition} className="pointer-events-auto w-full max-w-2xl">
                        <h1 className="sr-only">{profile.name}</h1>
                        {/* The name floats on the water: koi swim on beneath it, showing between the tiles. */}
                        <motion.div layoutId="name" transition={transition}>
                            <MosaicName text={profile.name} className="w-full" />
                        </motion.div>
                        {/* The words below steer the koi aside and dim them, so they stay easy to read. */}
                        <motion.div {...fade} data-pond-avoid className="font-mono">
                            <p className="mt-5 text-base leading-snug text-muted sm:mt-6 sm:text-lg">
                                CS × Economics, into <RotatingWord words={profile.focus} />
                            </p>
                            <p className="mt-3 max-w-md text-sm leading-relaxed">{profile.intro}</p>
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
                                <a href={profile.cv} className={bracket}>
                                    <span className="text-muted">[</span> cv ↓ <span className="text-muted">]</span>
                                </a>
                            </nav>
                            <AnimatePresence initial={false}>
                                {contact && (
                                    <motion.div
                                        key="contact"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={transition}
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
                        </motion.div>
                    </motion.div>
                )}
            </LayoutGroup>
        </div>
    );
}

const bracket = "transition hover:text-accent";

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
                    <span className="sm:hidden">tap the water to feed the koi · ducklings may steal some</span>
                    <span className="hidden sm:inline">click the water to feed the koi — the ducklings may steal some</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
