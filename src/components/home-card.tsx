"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { POND_FEED_EVENT } from "@/components/koi-pond/koi-pond";
import { RotatingWord } from "@/components/motion";
import { contactLinks } from "@/components/site-footer";
import { profile } from "@/data/profile";

const EASE = [0.22, 1, 0.36, 1] as const;
// A hover has to settle before the card opens, so a mouse passing over it on its way to the water doesn't.
const OPEN_DELAY_MS = 200;
const CLOSE_DELAY_MS = 350;

/** Fires once someone throws food into the pond. */
function useFed(onFed: () => void) {
    const latest = useRef(onFed);
    latest.current = onFed;
    useEffect(() => {
        const handler = () => latest.current();
        window.addEventListener(POND_FEED_EVENT, handler);
        return () => window.removeEventListener(POND_FEED_EVENT, handler);
    }, []);
}

/**
 * Who this is, over the pond on the home page. It opens in full (name, what I do, one line, and the ways in),
 * then the first time someone feeds the koi it shrinks to a small card in the bottom-left corner and leaves them
 * the whole pond. Hovering the small card (or tapping its name) opens it again in place. Contact opens the ways to
 * reach me right in the card. Coming back to the home page always starts in full.
 */
export function HomeCard() {
    const reduce = useReducedMotion();
    const [shrunk, setShrunk] = useState(false);
    const [peek, setPeek] = useState(false);
    const [contact, setContact] = useState(false);
    const timer = useRef(0);
    useEffect(() => () => clearTimeout(timer.current), []);

    useFed(() => {
        clearTimeout(timer.current);
        setShrunk(true);
        setPeek(false);
    });

    const full = !shrunk || peek;
    const hover = (open: boolean) => (e: React.PointerEvent) => {
        if (e.pointerType !== "mouse" || !shrunk) return;
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setPeek(open), open ? OPEN_DELAY_MS : CLOSE_DELAY_MS);
    };
    const transition = { duration: reduce ? 0 : 0.55, ease: EASE };

    return (
        // Full, it sits low on a phone and to the left of centre on a wider screen; shrunk, it settles into the
        // bottom-left corner, and opens up from there when peeked at, so it doesn't jump out from under the cursor.
        <div
            className={`pointer-events-none fixed inset-0 z-10 flex px-4 pb-6 sm:px-10 sm:pb-8 ${
                shrunk ? "items-end" : "items-end pb-16 sm:items-center sm:pb-0 lg:pl-[max(2.5rem,calc((100vw-64rem)/2+1.5rem))]"
            }`}
        >
            <LayoutGroup>
                <motion.div
                    layout
                    transition={transition}
                    data-pond-avoid
                    onPointerEnter={hover(true)}
                    onPointerLeave={hover(false)}
                    className={`pointer-events-auto max-w-2xl ${
                        shrunk
                            ? "w-full rounded-2xl border border-line bg-card/85 p-4 shadow-sm backdrop-blur-md sm:w-auto sm:p-5"
                            : ""
                    }`}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {full ? (
                            <motion.div
                                key="full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: reduce ? 0 : 0.3 }}
                            >
                                {shrunk ? (
                                    <button
                                        type="button"
                                        onClick={() => setPeek(false)}
                                        className="text-left text-3xl font-semibold tracking-tight sm:text-5xl"
                                        title="Shrink"
                                    >
                                        {profile.name}
                                    </button>
                                ) : (
                                    <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{profile.name}</h1>
                                )}
                                <p className="mt-3 text-lg leading-snug text-muted sm:mt-4 sm:text-2xl">
                                    CS × Economics, into <RotatingWord words={profile.focus} />
                                </p>
                                <p className="mt-3 max-w-md text-sm leading-relaxed sm:mt-4 sm:text-base">{profile.intro}</p>
                            </motion.div>
                        ) : (
                            <motion.button
                                key="small"
                                type="button"
                                onClick={() => setPeek(true)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: reduce ? 0 : 0.3 }}
                                className="flex items-center gap-1.5 font-semibold"
                                title="Show more"
                            >
                                {profile.name}
                                <span aria-hidden="true" className="text-xs text-muted">
                                    ↗
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <motion.nav
                        layout="position"
                        transition={transition}
                        className={`flex flex-wrap items-center ${full ? "mt-5 gap-2 sm:mt-7" : "mt-2 gap-x-3 gap-y-1"}`}
                    >
                        {[
                            { href: "/about/", label: "About" },
                            { href: "/work/", label: "Work" },
                        ].map((l, i) => (
                            <Link key={l.href} href={l.href} className={linkClass(full, i === 0)}>
                                {l.label}
                            </Link>
                        ))}
                        <button
                            type="button"
                            aria-expanded={contact}
                            onClick={() => setContact((c) => !c)}
                            className={`${linkClass(full, false)} ${contact ? "text-accent" : ""}`}
                        >
                            Contact
                        </button>
                        <a href={profile.cv} className={linkClass(full, false)}>
                            CV ↓
                        </a>
                    </motion.nav>

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
                                <div
                                    className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 font-mono ${
                                        full ? "text-sm" : "text-xs"
                                    }`}
                                >
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
                                            {l.label} ↗
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </LayoutGroup>
        </div>
    );
}

/** In full, the ways in are pills, the first one filled; in the small card they're plain text links. */
function linkClass(full: boolean, primary: boolean) {
    if (!full) return "text-sm text-muted transition hover:text-ink";
    return primary
        ? "rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
        : "rounded-full border border-line bg-card/70 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-accent";
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
                    className="pointer-events-none fixed left-4 top-4 z-20 max-w-[calc(100%-5rem)] rounded-2xl sm:max-w-none sm:rounded-full border border-line bg-card/80 px-3 py-1.5 font-mono text-xs text-muted shadow-sm backdrop-blur sm:left-auto sm:right-6 sm:top-auto sm:bottom-6"
                >
                    <span className="sm:hidden">tap the water to feed the koi · ducklings may steal some</span>
                    <span className="hidden sm:inline">click the water to feed the koi — the ducklings may steal some</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
